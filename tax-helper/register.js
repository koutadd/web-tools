/**
 * register.js — 確定済み経費をfreeeに一括登録
 */
import 'dotenv/config';

const BASE = 'https://api.freee.co.jp/api/1';
const token = process.env.FREEE_ACCESS_TOKEN;
const companyId = Number(process.env.FREEE_COMPANY_ID);

// 確定済み経費リスト
const EXPENSES = [
  // ── ソフトウェア ──────────────────────────────
  { date: '2025-01-31', description: 'ChatGPT Plus', amount: 3500, account: 'ソフトウェア' },
  { date: '2025-02-28', description: 'ChatGPT Plus', amount: 3500, account: 'ソフトウェア' },
  { date: '2025-03-31', description: 'ChatGPT Plus', amount: 3500, account: 'ソフトウェア' },
  { date: '2025-04-30', description: 'ChatGPT Plus', amount: 3500, account: 'ソフトウェア' },
  { date: '2025-05-31', description: 'ChatGPT Plus', amount: 3500, account: 'ソフトウェア' },
  { date: '2025-06-30', description: 'ChatGPT Plus', amount: 3500, account: 'ソフトウェア' },
  { date: '2025-07-31', description: 'ChatGPT Plus', amount: 3500, account: 'ソフトウェア' },
  { date: '2025-08-31', description: 'ChatGPT Plus', amount: 3500, account: 'ソフトウェア' },
  { date: '2025-09-30', description: 'ChatGPT Plus', amount: 3500, account: 'ソフトウェア' },
  { date: '2025-10-31', description: 'ChatGPT Plus', amount: 3500, account: 'ソフトウェア' },
  { date: '2025-11-30', description: 'ChatGPT Plus', amount: 3500, account: 'ソフトウェア' },
  { date: '2025-12-31', description: 'Runway ML', amount: 15317, account: 'ソフトウェア' },
  { date: '2025-12-31', description: 'Perplexity AI', amount: 30396, account: 'ソフトウェア' },
  { date: '2025-12-31', description: 'Genspark AI', amount: 40492, account: 'ソフトウェア' },
  { date: '2025-12-31', description: 'NOTTA', amount: 14220, account: 'ソフトウェア' },
  { date: '2025-12-31', description: 'ElevenLabs', amount: 6000, account: 'ソフトウェア' },
  { date: '2025-12-31', description: 'D-ID Studio', amount: 4341, account: 'ソフトウェア' },
  { date: '2025-12-31', description: 'Splashtop', amount: 9300, account: 'ソフトウェア' },
  { date: '2025-12-31', description: 'Canva', amount: 8300, account: 'ソフトウェア' },
  { date: '2025-12-31', description: 'aescripts', amount: 6935, account: 'ソフトウェア' },
  { date: '2025-12-31', description: 'Vimeo', amount: 757, account: 'ソフトウェア' },
  { date: '2025-12-31', description: 'Envato', amount: 32231, account: 'ソフトウェア' },
  // ── 通信費 ────────────────────────────────────
  { date: '2025-12-31', description: 'BIGLOBE（家事按分50%）', amount: 17742, account: '通信費' },
  { date: '2025-12-31', description: 'Google One', amount: 2500, account: '通信費' },
  // ── 旅費交通費 ────────────────────────────────
  { date: '2025-12-31', description: '出張ホテル代', amount: 125531, account: '旅費交通費' },
];

async function getAccountItemMap() {
  const res = await fetch(`${BASE}/account_items?company_id=${companyId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  const map = {};
  for (const item of data.account_items || []) map[item.name] = item.id;
  return map;
}

async function registerExpense({ date, description, amount, accountItemId }) {
  const body = {
    company_id: companyId,
    issue_date: date,
    due_date: date,
    type: 'expense',
    partner_name: description,
    details: [{
      account_item_id: accountItemId,
      tax_code: 1,
      description: description,
      amount: amount,
      vat: Math.floor(amount - amount / 1.1),
    }],
  };
  const res = await fetch(`${BASE}/deals`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

async function main() {
  console.log('📚 勘定科目を取得中...');
  const itemMap = await getAccountItemMap();

  let ok = 0, ng = 0, total = 0;
  console.log('\n📤 経費登録開始...\n');

  for (const exp of EXPENSES) {
    const accountItemId = itemMap[exp.account];
    if (!accountItemId) {
      console.warn(`  ⚠️ 勘定科目「${exp.account}」が見つかりません: ${exp.description}`);
      ng++;
      continue;
    }
    try {
      await registerExpense({ ...exp, accountItemId });
      console.log(`  ✅ ${exp.date}  ${exp.description.padEnd(25)}  ¥${exp.amount.toLocaleString()}`);
      ok++;
      total += exp.amount;
    } catch (e) {
      console.error(`  ❌ ${exp.description}: ${e.message}`);
      ng++;
    }
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`🎉 完了！ 成功: ${ok}件 / 失敗: ${ng}件`);
  console.log(`経費合計: ¥${total.toLocaleString()}`);
  console.log('\nfreeeを確認: https://secure.freee.co.jp');
}

main().catch(e => {
  console.error('❌ エラー:', e.message);
  process.exit(1);
});
