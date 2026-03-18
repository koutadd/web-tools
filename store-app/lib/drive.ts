/**
 * Google Drive API ヘルパー
 *
 * 認証: サービスアカウント
 * 環境変数:
 *   GOOGLE_SERVICE_ACCOUNT_JSON  — サービスアカウントの JSON 文字列（全体）
 *   GOOGLE_DRIVE_PARENT_FOLDER_ID — 親フォルダ ID（固定: 1ugm5wM_ShOQAN3YJrVsAP7a2LrfhtfHQ）
 */

import { google } from 'googleapis';
import { Readable } from 'stream';

// ─── 定数 ───────────────────────────────────────────────────────────────────

export const PARENT_FOLDER_ID =
  (process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID ?? '1ugm5wM_ShOQAN3YJrVsAP7a2LrfhtfHQ').trim();

/** 店舗フォルダ内サブフォルダ一覧（将来拡張用に全部作成） */
export const STORE_SUBFOLDERS = [
  '01_店舗画像',
  '02_ロゴ・素材',
  '03_制作資料',
  '04_提出データ',
  '99_その他',
] as const;

/** RequiredItem.category → サブフォルダ名 */
export const CATEGORY_TO_SUBFOLDER: Record<string, string> = {
  photo:    '01_店舗画像',
  logo:     '02_ロゴ・素材',
  document: '03_制作資料',
  access:   '03_制作資料',
  sns:      '03_制作資料',
  other:    '99_その他',
};

// ─── Drive クライアント ──────────────────────────────────────────────────────

export function getDriveClient() {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!json) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON が設定されていません');

  const credentials = JSON.parse(json) as object;
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  return google.drive({ version: 'v3', auth });
}

// ─── フォルダ操作 ────────────────────────────────────────────────────────────

type FolderResult = { id: string; url: string };

/**
 * 指定親フォルダ配下に name のフォルダを探す。
 * なければ作成して返す。
 */
export async function getOrCreateFolder(
  drive: ReturnType<typeof getDriveClient>,
  parentId: string,
  name: string,
): Promise<FolderResult> {
  // 既存フォルダを検索（nameにシングルクォートが含まれる場合はエスケープ）
  const escapedName = name.replace(/'/g, "\\'");
  const listRes = await drive.files.list({
    q: `'${parentId}' in parents and name = '${escapedName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, webViewLink)',
    spaces: 'drive',
  });

  const existing = listRes.data.files?.[0];
  if (existing?.id) {
    return { id: existing.id, url: existing.webViewLink ?? '' };
  }

  // 新規作成
  const createRes = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id, webViewLink',
  });

  return {
    id:  createRes.data.id  ?? '',
    url: createRes.data.webViewLink ?? '',
  };
}

// ─── ファイルアップロード ────────────────────────────────────────────────────

type UploadResult = { id: string; url: string };

/**
 * Drive の folderId 配下へファイルをアップロードする。
 * ファイル名は `{timestampMs}_{originalName}` 形式で衝突を防ぐ。
 */
export async function uploadFileToDrive(
  drive: ReturnType<typeof getDriveClient>,
  folderId: string,
  originalName: string,
  mimeType: string,
  buffer: Buffer,
): Promise<UploadResult> {
  const safeName = `${Date.now()}_${originalName}`;
  const stream = Readable.from(buffer);

  const res = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name: safeName,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: 'id, webViewLink',
  });

  return {
    id:  res.data.id  ?? '',
    url: res.data.webViewLink ?? '',
  };
}

/**
 * Drive の folderId 配下へ Node.js Readable ストリームをアップロードする。
 * Buffer に展開しないため 100MB 超のファイルでも OOM しない。
 */
export async function uploadStreamToDrive(
  drive: ReturnType<typeof getDriveClient>,
  folderId: string,
  originalName: string,
  mimeType: string,
  stream: Readable,
): Promise<UploadResult> {
  const safeName = `${Date.now()}_${originalName}`;

  const res = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name:    safeName,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: 'id, webViewLink',
  });

  return {
    id:  res.data.id  ?? '',
    url: res.data.webViewLink ?? '',
  };
}

// ─── 店舗フォルダ一式を取得／作成 ────────────────────────────────────────────

export type StoreFolderMap = {
  root:     FolderResult;
  photo:    FolderResult;
  asset:    FolderResult;
  document: FolderResult;
  submit:   FolderResult;
  other:    FolderResult;
};

/**
 * 親フォルダ配下に `{storeName}_{storeId}` フォルダを作成し、
 * その中に規定のサブフォルダを全て getOrCreate する。
 */
export async function ensureStoreFolders(
  drive: ReturnType<typeof getDriveClient>,
  storeName: string,
  storeId: string,
): Promise<StoreFolderMap> {
  const rootName = `${storeName}_${storeId}`;
  const root = await getOrCreateFolder(drive, PARENT_FOLDER_ID, rootName);

  const [photo, asset, document, submit, other] = await Promise.all([
    getOrCreateFolder(drive, root.id, '01_店舗画像'),
    getOrCreateFolder(drive, root.id, '02_ロゴ・素材'),
    getOrCreateFolder(drive, root.id, '03_制作資料'),
    getOrCreateFolder(drive, root.id, '04_提出データ'),
    getOrCreateFolder(drive, root.id, '99_その他'),
  ]);

  return { root, photo, asset, document, submit, other };
}
