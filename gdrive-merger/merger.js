/**
 * マージエンジン
 * - 重複グループ内で「正規フォルダ」を決定し、他フォルダのファイルを移動
 * - ファイル比較: 完全一致 → スキップ / 名前同一・内容差異 → 要確認_重複 へ退避
 * - dry-run モードでは実際の移動を行わず計画のみ返す
 */

import {
  getSubFolderStructure,
  listFilesInFolder,
  ensureFolder,
  TARGET_PATHS,
} from './scanner.js';
import { log } from './logger.js';

export const ACTION = {
  MOVE: 'MOVE',
  SKIP_EXACT: 'SKIP_EXACT',
  QUARANTINE: 'QUARANTINE',
  TRASH: 'TRASH',
};

/**
 * 重複グループを処理してアクション計画を返す
 * @param {object} drive
 * @param {Map<string, object[]>} duplicateGroups
 * @param {boolean} dryRun
 * @returns {object[]} actions
 */
export async function processDuplicateGroups(drive, duplicateGroups, dryRun) {
  const allActions = [];

  for (const [key, folders] of duplicateGroups) {
    log.info(`\n処理中: ${key} (${folders.length} フォルダ)`);

    // 正規フォルダ: 最も古い createdTime または caseNumber が最小
    const canonical = selectCanonical(folders);
    const sources = folders.filter((f) => f.id !== canonical.id);

    log.info(`  正規: [${canonical.caseNumber}] ${canonical.name} (id: ${canonical.id})`);
    sources.forEach((s) =>
      log.info(`  統合元: [${s.caseNumber}] ${s.name} (id: ${s.id})`)
    );

    for (const source of sources) {
      const actions = await mergeFolder(drive, canonical, source, dryRun);
      allActions.push(...actions);

      // 統合元フォルダをゴミ箱へ
      const trashAction = {
        type: ACTION.TRASH,
        fileId: source.id,
        fileName: source.name,
        fromFolderId: source.id,
        fromFolderPath: source.name,
        toFolderId: null,
        toFolderPath: 'ゴミ箱',
        reason: '統合完了後に削除',
      };
      allActions.push(trashAction);

      if (!dryRun) {
        try {
          await trashFolder(drive, source.id);
          log.info(`  🗑 ゴミ箱へ移動: ${source.name}`);
        } catch (e) {
          trashAction.type = 'SKIP_PERMISSION';
          trashAction.reason = `権限なしのためスキップ: ${e.message}`;
          log.warn(`  ⚠ ゴミ箱権限なしスキップ: ${source.name}`);
        }
      } else {
        log.info(`  [DRY-RUN] ゴミ箱移動予定: ${source.name}`);
      }
    }
  }

  return allActions;
}

/**
 * 正規フォルダを選択（更新日時が最新のもの）
 */
function selectCanonical(folders) {
  return folders.reduce((prev, curr) =>
    new Date(curr.modifiedTime) > new Date(prev.modifiedTime) ? curr : prev
  );
}

/**
 * source フォルダの全対象子フォルダを canonical へ統合
 */
async function mergeFolder(drive, canonical, source, dryRun) {
  const actions = [];

  // 両フォルダの標準構造を取得
  const canonicalStructure = await getSubFolderStructure(drive, canonical);
  const sourceStructure = await getSubFolderStructure(drive, source);

  for (const targetPath of TARGET_PATHS) {
    const srcSubFolder = sourceStructure.get(targetPath);
    if (!srcSubFolder) {
      log.debug(`  スキップ (存在しない): ${source.name}/${targetPath}`);
      continue;
    }

    const canonSubFolder = canonicalStructure.get(targetPath);
    if (!canonSubFolder) {
      // 正規側にフォルダが存在しない → 移動する際は親を確保
      log.warn(`  正規フォルダに ${targetPath} が見つかりません。スキップします。`);
      continue;
    }

    log.info(`  統合: ${targetPath}`);
    const subActions = await mergeSubFolder(
      drive,
      canonSubFolder,
      srcSubFolder,
      {
        canonicalFolderName: canonical.name,
        sourceFolderName: source.name,
        targetPath,
      },
      dryRun
    );
    actions.push(...subActions);
  }

  return actions;
}

/**
 * 子フォルダ同士のファイルを比較・移動
 */
async function mergeSubFolder(drive, canonFolder, srcFolder, meta, dryRun) {
  const actions = [];

  const [canonFiles, srcFiles] = await Promise.all([
    listFilesInFolder(drive, canonFolder.id),
    listFilesInFolder(drive, srcFolder.id),
  ]);

  // 正規フォルダのファイルをマップ化（名前 → ファイル情報）
  const canonMap = new Map(canonFiles.map((f) => [f.name, f]));

  for (const srcFile of srcFiles) {
    const canonFile = canonMap.get(srcFile.name);

    if (!canonFile) {
      // 正規フォルダに同名ファイルなし → 移動
      const action = {
        type: ACTION.MOVE,
        fileId: srcFile.id,
        fileName: srcFile.name,
        fromFolderId: srcFolder.id,
        fromFolderPath: `${meta.sourceFolderName}/${meta.targetPath}`,
        toFolderId: canonFolder.id,
        toFolderPath: `${meta.canonicalFolderName}/${meta.targetPath}`,
        reason: '正規フォルダに同名ファイルなし',
      };
      actions.push(action);

      if (!dryRun) {
        try {
          await moveFile(drive, srcFile.id, srcFolder.id, canonFolder.id);
          log.info(`    → 移動: ${srcFile.name}`);
        } catch (e) {
          action.type = 'SKIP_PERMISSION';
          action.reason = `権限なしのためスキップ: ${e.message}`;
          log.warn(`    ⚠ 権限なしスキップ: ${srcFile.name}`);
        }
      } else {
        log.info(`    [DRY-RUN] 移動予定: ${srcFile.name}`);
      }
    } else if (isExactDuplicate(canonFile, srcFile)) {
      // 完全一致 → スキップ
      actions.push({
        type: ACTION.SKIP_EXACT,
        fileId: srcFile.id,
        fileName: srcFile.name,
        fromFolderId: srcFolder.id,
        fromFolderPath: `${meta.sourceFolderName}/${meta.targetPath}`,
        toFolderId: null,
        toFolderPath: null,
        reason: '正規フォルダに完全一致ファイルが存在',
      });
      log.debug(`    スキップ (完全一致): ${srcFile.name}`);
    } else {
      // 名前同一・内容差異 → 要確認_重複 フォルダへ退避
      const quarantineFolder = await getOrCreateQuarantineFolder(
        drive,
        canonFolder.id,
        dryRun
      );

      const action = {
        type: ACTION.QUARANTINE,
        fileId: srcFile.id,
        fileName: srcFile.name,
        fromFolderId: srcFolder.id,
        fromFolderPath: `${meta.sourceFolderName}/${meta.targetPath}`,
        toFolderId: quarantineFolder?.id || '(dry-run)',
        toFolderPath: `${meta.canonicalFolderName}/${meta.targetPath}/要確認_重複`,
        reason: `名前同一・内容差異 (canonMd5=${canonFile.md5Checksum ?? 'N/A'} srcMd5=${srcFile.md5Checksum ?? 'N/A'} canonSize=${canonFile.size} srcSize=${srcFile.size})`,
      };
      actions.push(action);

      if (!dryRun && quarantineFolder) {
        try {
          await moveFile(drive, srcFile.id, srcFolder.id, quarantineFolder.id);
          log.warn(`    → 要確認_重複 へ退避: ${srcFile.name}`);
        } catch (e) {
          action.type = 'SKIP_PERMISSION';
          action.reason = `権限なしのためスキップ: ${e.message}`;
          log.warn(`    ⚠ 権限なしスキップ: ${srcFile.name}`);
        }
      } else {
        log.warn(`    [DRY-RUN] 要確認_重複 退避予定: ${srcFile.name}`);
      }
    }
  }

  return actions;
}

/**
 * ファイルが完全に一致するか判定
 * md5Checksum が利用可能な場合は最優先、なければ size + modifiedTime で判断
 */
function isExactDuplicate(a, b) {
  if (a.md5Checksum && b.md5Checksum) {
    return a.md5Checksum === b.md5Checksum;
  }
  // Google Workspace ファイル（md5 なし）は mimeType + modifiedTime で判断
  return (
    a.mimeType === b.mimeType &&
    a.size === b.size &&
    a.modifiedTime === b.modifiedTime
  );
}

/**
 * 「要確認_重複」フォルダを取得または作成
 * dry-run の場合は null を返す（フォルダ作成しない）
 */
async function getOrCreateQuarantineFolder(drive, parentFolderId, dryRun) {
  if (dryRun) return null;
  return ensureFolder(drive, '要確認_重複', parentFolderId);
}

/**
 * ファイルを別フォルダへ移動（addParents / removeParents）
 */
async function moveFile(drive, fileId, fromFolderId, toFolderId) {
  await drive.files.update({
    fileId,
    addParents: toFolderId,
    removeParents: fromFolderId,
    fields: 'id, parents',
  });
}

/**
 * フォルダをゴミ箱へ移動
 */
async function trashFolder(drive, folderId) {
  await drive.files.update({
    fileId: folderId,
    resource: { trashed: true },
    fields: 'id, trashed',
  });
}
