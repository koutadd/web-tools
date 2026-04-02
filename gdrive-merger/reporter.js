/**
 * レポート出力モジュール
 * - アクション計画を CSV と JSON で出力
 * - サマリーをコンソールに表示
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { stringify } from 'csv-stringify/sync';
import { ACTION } from './merger.js';
import { log } from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = path.join(__dirname, 'reports');

/**
 * アクション一覧をファイルと標準出力に出力
 */
export async function writeReport(actions, dryRun) {
  await fs.mkdir(REPORTS_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const prefix = dryRun ? 'dry-run' : 'apply';
  const baseName = `${prefix}_${timestamp}`;

  const jsonPath = path.join(REPORTS_DIR, `${baseName}.json`);
  const csvPath = path.join(REPORTS_DIR, `${baseName}.csv`);

  // JSON 出力
  const report = {
    generatedAt: new Date().toISOString(),
    mode: dryRun ? 'dry-run' : 'apply',
    summary: buildSummary(actions),
    actions,
  };
  await fs.writeFile(jsonPath, JSON.stringify(report, null, 2), 'utf8');

  // CSV 出力
  const csvRows = actions.map((a) => ({
    タイプ: a.type,
    ファイル名: a.fileName,
    ファイルID: a.fileId,
    移動元フォルダパス: a.fromFolderPath,
    移動元フォルダID: a.fromFolderId,
    移動先フォルダパス: a.toFolderPath ?? '',
    移動先フォルダID: a.toFolderId ?? '',
    理由: a.reason,
  }));

  const csvContent = stringify(csvRows, { header: true });
  await fs.writeFile(csvPath, '\uFEFF' + csvContent, 'utf8'); // BOM 付き UTF-8（Excel 対応）

  // サマリー表示
  const summary = buildSummary(actions);
  console.log('\n' + '='.repeat(60));
  console.log(`📊 実行レポート [${dryRun ? 'DRY-RUN' : 'APPLY'}]`);
  console.log('='.repeat(60));
  console.log(`  移動予定/実施:    ${summary.move} 件`);
  console.log(`  完全一致スキップ: ${summary.skipExact} 件`);
  console.log(`  要確認_重複 退避: ${summary.quarantine} 件`);
  console.log(`  合計:             ${summary.total} 件`);
  console.log('='.repeat(60));
  console.log(`\n📄 JSON レポート: ${jsonPath}`);
  console.log(`📄 CSV レポート:  ${csvPath}\n`);

  return { jsonPath, csvPath };
}

function buildSummary(actions) {
  return {
    move: actions.filter((a) => a.type === ACTION.MOVE).length,
    skipExact: actions.filter((a) => a.type === ACTION.SKIP_EXACT).length,
    quarantine: actions.filter((a) => a.type === ACTION.QUARANTINE).length,
    trash: actions.filter((a) => a.type === ACTION.TRASH).length,
    total: actions.length,
  };
}
