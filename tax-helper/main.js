/**
 * main.js — クレカ明細 → 経費仕分け → freee登録
 *
 * 使い方:
 *   1. csv/ フォルダに明細CSVを配置
 *      - rakuten_2024.csv   ← 楽天カード
 *      - epos_2024.csv      ← エポスカード
 *      - smbc_2024.csv      ← 三井住友カード
 *      - paypay_2024.csv    ← PayPayカード
 *   2. node main.js
 *   3. 仕分け結果を確認 → y で freee に登録
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import 'dotenv/config';

import { parseRakuten, parseEpos, parseSmbc, parsePaypay } from './lib/parsers.js';
import { categorize } from './lib/categorizer.js';
import { FreeeClient } from './lib/freee-api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_DIR   = path.join(__dirname, 'csv');

// ─── 環境変数チェック ─────────────────────────────────────
function checkEnv() {
  const required = ['ANTHROPIC_API_KEY', 'FREEE_ACCESS_TOKEN', 'FREEE_COMPANY_ID'];
  const missing  = required.filter(k => !process.env[k]);
  if (missing.length) {
    console.error(`❌ .env に以下が設定されていません: ${missing.join(', ')}`);
    console.error('  → node auth.js を先に実行してください');
    process.exit(1);
  }
}

// ─── CSVファイルを自動検出してパース ──────────────────────
function loadAllTransactions() {
  const files = fs.readdirSync(CSV_DIR).filter(f => f.endsWith('.csv'));
  if (files.length === 0) {
    console.error('❌ csv/ フォルダにCSVファイルがありません');
    console.error('  各カードの明細CSVを csv/ フォルダに配置してください');
    process.exit(1);
  }

  const all = [];
  for (const file of files) {
    const fp = path.join(CSV_DIR, file);
    try {
      if (file.startsWith('rakuten')) {
        const rows = parseRakuten(fp);
        console.log(`  ✅ 楽天カード: ${rows.length} 件 (${file})`);
        all.push(...rows);
      } else if (file.startsWith('epos')) {
        const rows = parseEpos(fp);
        console.log(`  ✅ エポスカード: ${rows.length} 件 (${file})`);
        all.push(...rows);
      } else if (file.startsWith('smbc')) {
        const rows = parseSmbc(fp);
        console.log(`  ✅ 三井住友カード: ${rows.length} 件 (${file})`);
        all.push(...rows);
      } else if (file.startsWith('paypay')) {
        const rows = parsePaypay(fp);
        console.log(`  ✅ PayPayカード: ${rows.length} 件 (${file})`);
        all.push(...rows);
      } else {
        console.warn(`  ⚠️ スキップ (ファイル名が未対応): ${file}`);
      }
    } catch (e) {
      console.error(`  ❌ パース失敗 ${file}: ${e.message}`);
    }
  }
  return all;
}

// ─── 確認プロンプト ────────────────────────────────────────
async function confirm(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim().toLowerCase()); }));
}

// ─── 結果テーブル表示 ─────────────────────────────────────
function printTable(transactions) {
  const business = transactions.filter(t => t.isBusiness);
  const skip     = transactions.filter(t => !t.isBusiness);

  console.log('\n━━━ 【経費対象】 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`${'日付'.padEnd(12)}${'店名'.padEnd(30)}${'金額'.padStart(8)}  ${'勘定科目'.padEnd(16)}  ${'カード'}`);
  console.log('─'.repeat(90));
  for (const t of business) {
    const name = t.description.slice(0, 28).padEnd(30);
    console.log(`${t.date.padEnd(12)}${name}${String(t.amount).padStart(8)}円  ${t.accountItem.padEnd(16)}  ${t.source}`);
  }
  const total = business.reduce((s, t) => s + t.amount, 0);
  console.log(`${'─'.repeat(90)}`);
  console.log(`合計 ${business.length} 件 / ${total.toLocaleString()}円\n`);

  console.log(`━━━ 【対象外 (登録しない)】 ${skip.length} 件 ━━━━━━━━━━━━━━━━━━━━━━━`);
}

// ─── メイン処理 ───────────────────────────────────────────
async function main() {
  console.log('\n🧾 クレカ明細 → 確定申告 自動化ツール\n');
  checkEnv();

  // 1. CSVを読み込み
  console.log('📂 CSVを読み込み中...');
  const transactions = loadAllTransactions();
  console.log(`  合計 ${transactions.length} 件\n`);

  if (transactions.length === 0) {
    console.log('件数が0です。CSVファイルを確認してください。');
    return;
  }

  // 2. Claude で仕分け
  console.log('🤖 Claude で経費仕分け中... (Claude Haiku使用、コスト最小)');
  const categorized = await categorize(transactions);
  const business    = categorized.filter(t => t.isBusiness);

  // 3. 結果表示
  printTable(categorized);

  if (business.length === 0) {
    console.log('経費対象の取引が0件です。');
    return;
  }

  // 4. 確認
  const ans = await confirm(`\nこの ${business.length} 件を freee に登録しますか？ [y/N]: `);
  if (ans !== 'y') {
    console.log('キャンセルしました。');
    return;
  }

  // 5. 勘定科目マップを取得
  console.log('\n📚 freee 勘定科目を取得中...');
  const freee     = new FreeeClient(process.env.FREEE_ACCESS_TOKEN, process.env.FREEE_COMPANY_ID);
  const itemMap   = await freee.getAccountItemMap();

  // 6. freee に登録
  console.log('📤 freee に登録中...\n');
  let ok = 0, ng = 0;

  for (const t of business) {
    const accountItemId = itemMap[t.accountItem];
    if (!accountItemId) {
      console.warn(`  ⚠️ 勘定科目「${t.accountItem}」がfreeeに見つかりません: ${t.description}`);
      ng++;
      continue;
    }
    try {
      await freee.createExpense({
        date: t.date,
        description: t.description,
        amount: t.amount,
        accountItemId,
        cardSource: t.source,
      });
      console.log(`  ✅ ${t.date} ${t.description.slice(0, 25)} ${t.amount}円`);
      ok++;
    } catch (e) {
      console.error(`  ❌ 登録失敗: ${t.description} → ${e.message}`);
      ng++;
    }
  }

  console.log(`\n🎉 完了！ 成功: ${ok}件 / 失敗: ${ng}件`);
  console.log('freee を開いて確認してください: https://secure.freee.co.jp');
}

main().catch(e => {
  console.error('❌ エラー:', e.message);
  process.exit(1);
});
