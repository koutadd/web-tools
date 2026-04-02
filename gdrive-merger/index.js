#!/usr/bin/env node
/**
 * Google Drive 重複案件フォルダ統合ツール
 *
 * CLI 使い方:
 *   node index.js --dry-run [--root <フォルダID>]
 *   node index.js --apply  [--root <フォルダID>]
 *
 * API として使う場合は runScan / runDryRun / runApply をインポートしてください。
 */

import { getAuthClient } from './auth.js';
import { createDriveClient, scanDuplicateGroups } from './scanner.js';
import { processDuplicateGroups } from './merger.js';
import { writeReport } from './reporter.js';
import { log } from './logger.js';

// ===== 共通コア =====

/** Drive クライアントを取得（認証済み） */
async function getDrive() {
  const auth = await getAuthClient();
  return createDriveClient(auth);
}

/**
 * スキャンのみ実行して重複グループを返す
 * @param {string|null} rootFolderId
 * @returns {{ key: string, folders: object[] }[]}
 */
export async function runScan(rootFolderId = null) {
  const drive = await getDrive();
  const duplicateGroups = await scanDuplicateGroups(drive, rootFolderId);

  // Map → 配列に変換してシリアライズ可能な形にする
  return Array.from(duplicateGroups.entries()).map(([key, folders]) => ({
    key,
    folders: folders.map((f) => ({
      id: f.id,
      name: f.name,
      caseNumber: f.caseNumber,
      storeName: f.storeName,
      mediaName: f.mediaName,
      modifiedTime: f.modifiedTime,
    })),
  }));
}

/**
 * dry-run を実行してアクション計画とレポートパスを返す
 * @param {string|null} rootFolderId
 * @returns {{ actions: object[], jsonPath: string, csvPath: string, summary: object }}
 */
export async function runDryRun(rootFolderId = null) {
  const drive = await getDrive();
  const duplicateGroups = await scanDuplicateGroups(drive, rootFolderId);

  if (duplicateGroups.size === 0) {
    return { actions: [], jsonPath: null, csvPath: null, summary: { move: 0, skipExact: 0, quarantine: 0, total: 0 } };
  }

  const actions = await processDuplicateGroups(drive, duplicateGroups, true);
  const { jsonPath, csvPath } = await writeReport(actions, true);
  const summary = buildSummary(actions);

  return { actions, jsonPath, csvPath, summary };
}

/**
 * apply を実行して実際にファイルを移動する
 * @param {string|null} rootFolderId
 * @returns {{ actions: object[], jsonPath: string, csvPath: string, summary: object }}
 */
export async function runApply(rootFolderId = null) {
  const drive = await getDrive();
  const duplicateGroups = await scanDuplicateGroups(drive, rootFolderId);

  if (duplicateGroups.size === 0) {
    return { actions: [], jsonPath: null, csvPath: null, summary: { move: 0, skipExact: 0, quarantine: 0, total: 0 } };
  }

  const actions = await processDuplicateGroups(drive, duplicateGroups, false);
  const { jsonPath, csvPath } = await writeReport(actions, false);
  const summary = buildSummary(actions);

  return { actions, jsonPath, csvPath, summary };
}

function buildSummary(actions) {
  return {
    move: actions.filter((a) => a.type === 'MOVE').length,
    skipExact: actions.filter((a) => a.type === 'SKIP_EXACT').length,
    quarantine: actions.filter((a) => a.type === 'QUARANTINE').length,
    trash: actions.filter((a) => a.type === 'TRASH').length,
    total: actions.length,
  };
}

// ===== CLI エントリーポイント =====

const isCLI = process.argv[1] && process.argv[1].endsWith('index.js');

if (isCLI) {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--apply');
  const rootIdx = args.indexOf('--root');
  const rootFolderId = rootIdx !== -1 ? args[rootIdx + 1] : null;

  console.log('='.repeat(60));
  console.log('  Google Drive 重複案件フォルダ統合ツール');
  console.log(`  モード: ${dryRun ? '🔍 DRY-RUN（移動なし）' : '🚀 APPLY（移動実行）'}`);
  if (rootFolderId) console.log(`  起点フォルダ ID: ${rootFolderId}`);
  console.log('='.repeat(60) + '\n');

  if (!dryRun) {
    console.log('⚠️  APPLY モードで実行します。ファイルが実際に移動されます。');
    console.log('   続行しますか？ Ctrl+C でキャンセル / 3秒後に自動で続行...\n');
    await new Promise((r) => setTimeout(r, 3000));
  }

  try {
    const fn = dryRun ? runDryRun : runApply;
    const result = await fn(rootFolderId);

    if (result.summary.total === 0) {
      log.info('重複フォルダは見つかりませんでした。');
    } else if (dryRun) {
      console.log('💡 実際に移動するには --apply オプションを付けて再実行してください。');
    } else {
      console.log('✅ 統合が完了しました。');
    }
  } catch (err) {
    log.error(`致命的エラー: ${err.message}`);
    if (process.env.LOG_LEVEL === 'DEBUG') console.error(err.stack);
    process.exit(1);
  }
}
