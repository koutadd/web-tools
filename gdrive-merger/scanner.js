/**
 * Google Drive スキャナー
 * - 対象フォルダ配下の案件フォルダを全取得
 * - 「番号_店舗名_媒体名」形式を解析してグルーピング
 * - 各案件フォルダの標準子フォルダ構造を取得
 */

import { google } from 'googleapis';
import { log } from './logger.js';

// 案件フォルダ名のパターン: 先頭1〜3桁の数字で始まるもの（_や,の後に続くテキストは任意）
const CASE_FOLDER_PATTERN = /^(\d{1,3})(?:[_,].+)?$/;

// 統合対象の標準子フォルダパス（/ 区切り）
export const TARGET_PATHS = [
  'アウトプット',
  '制作データ/入稿前データ',
  '制作データ/入稿データ',
];

/**
 * Drive API クライアントを生成
 */
export function createDriveClient(auth) {
  return google.drive({ version: 'v3', auth });
}

/**
 * 全案件フォルダを取得し、重複グループを返す
 * @param {object} drive - Drive API クライアント
 * @param {string|null} rootFolderId - 検索起点フォルダ ID (null = My Drive 全体)
 * @returns {Map<string, CaseFolder[]>} key=「店舗名_媒体名」, value=フォルダ配列
 */
export async function scanDuplicateGroups(drive, rootFolderId = null) {
  log.info('案件フォルダのスキャンを開始します...');

  const allCaseFolders = await listCaseFolders(drive, rootFolderId);
  log.info(`案件フォルダ ${allCaseFolders.length} 件を検出`);

  // 「店舗名_媒体名」でグルーピング
  const groups = new Map();
  for (const folder of allCaseFolders) {
    const key = folder.caseNumber;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(folder);
  }

  // 1件のみのグループは重複なし → 除外 / 999は除外
  const duplicateGroups = new Map();
  for (const [key, folders] of groups) {
    if (folders.length >= 2 && key !== '999') {
      duplicateGroups.set(key, folders);
    }
  }

  log.info(`重複グループ ${duplicateGroups.size} 件を検出`);
  return duplicateGroups;
}

/**
 * 案件フォルダ一覧を取得（ページネーション対応）
 */
async function listCaseFolders(drive, rootFolderId) {
  const results = [];
  let pageToken = null;

  // 親フォルダ条件
  const parentQuery = rootFolderId
    ? `'${rootFolderId}' in parents`
    : `'root' in parents`;

  do {
    const res = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and ${parentQuery} and trashed=false`,
      fields: 'nextPageToken, files(id, name, modifiedTime, createdTime, parents)',
      pageSize: 1000,
      pageToken: pageToken || undefined,
    });

    for (const folder of res.data.files || []) {
      const parsed = parseCaseFolderName(folder.name);
      if (parsed) {
        results.push({ ...folder, ...parsed });
      }
    }

    pageToken = res.data.nextPageToken;
  } while (pageToken);

  return results;
}

/**
 * フォルダ名を解析して番号・店舗名・媒体名を抽出
 * @returns {{ number: string, storeName: string, mediaName: string } | null}
 */
function parseCaseFolderName(name) {
  const m = name.match(CASE_FOLDER_PATTERN);
  if (!m) return null;
  return {
    caseNumber: m[1],
    storeName: '',
    mediaName: '',
  };
}

/**
 * 案件フォルダ内の標準子フォルダ構造を取得
 * @returns {Map<string, SubFolderInfo>} key=TARGET_PATH, value=フォルダ情報
 */
export async function getSubFolderStructure(drive, caseFolder) {
  const structure = new Map();

  // 直下の子フォルダを取得
  const directChildren = await listChildFolders(drive, caseFolder.id);

  for (const targetPath of TARGET_PATHS) {
    const parts = targetPath.split('/');
    const resolved = await resolvePathInFolders(drive, directChildren, parts, caseFolder.id);
    if (resolved) {
      structure.set(targetPath, resolved);
    }
  }

  return structure;
}

/**
 * パス部品を再帰的に辿ってフォルダを解決
 */
async function resolvePathInFolders(drive, childFolders, parts, parentId) {
  const [head, ...rest] = parts;
  const matched = childFolders.find((f) => f.name === head);
  if (!matched) return null;
  if (rest.length === 0) return matched;

  // 次の階層を取得
  const nextChildren = await listChildFolders(drive, matched.id);
  return resolvePathInFolders(drive, nextChildren, rest, matched.id);
}

/**
 * 指定フォルダの直下子フォルダ一覧
 */
async function listChildFolders(drive, folderId) {
  const res = await drive.files.list({
    q: `mimeType='application/vnd.google-apps.folder' and '${folderId}' in parents and trashed=false`,
    fields: 'files(id, name, modifiedTime)',
    pageSize: 100,
  });
  return res.data.files || [];
}

/**
 * フォルダ直下のファイル一覧（フォルダは除く）
 */
export async function listFilesInFolder(drive, folderId) {
  const files = [];
  let pageToken = null;

  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and mimeType!='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime, md5Checksum)',
      pageSize: 1000,
      pageToken: pageToken || undefined,
    });
    files.push(...(res.data.files || []));
    pageToken = res.data.nextPageToken;
  } while (pageToken);

  return files;
}

/**
 * フォルダを作成（または既存を返す）
 */
export async function ensureFolder(drive, name, parentId) {
  // 既存確認
  const res = await drive.files.list({
    q: `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    pageSize: 1,
  });

  if (res.data.files?.length > 0) {
    return res.data.files[0];
  }

  // 新規作成
  const created = await drive.files.create({
    resource: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id, name',
  });
  return created.data;
}
