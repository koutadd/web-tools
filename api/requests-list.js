// api/requests-list.js — 依頼管理シートを読み込み、店舗ブロックごとに正規化して返す
// シート構造:
//   F列(idx=5): 結合セル = 店舗ブロックの範囲指定
//   G列(idx=6): 店名「【アイケアLaBo〇〇店】」
//   H列(idx=7): 店舗情報
//   J列(idx=9): 制作アイテム（タスク）
//   R列(idx=17): タスクステータス
import { google } from 'googleapis';
import { getAuth, setCors } from './google-auth.js';

const SHEET_ID   = process.env.GOOGLE_SHEETS_REQUESTS_ID || '1Qe7Ri8rm_GQ21u5m6s533p0R9qAIKqbcBHP5HmLoLf0';
const SHEET_TAB  = process.env.GOOGLE_SHEETS_REQUESTS_TAB || ''; // 空なら最初のシート

// 列マッピング（0-indexed）
const COL = { F: 5, G: 6, H: 7, J: 9, R: 17 };

// ステータス優先度（大きいほど重要）
const STATUS_WEIGHT = {
  '差し戻し': 8, '確認待ち': 7, '進行中': 6, '未着手': 5,
  '承認待ち': 4, '保留': 3, 'データ送付完了': 2, '完了': 1,
};

export default async function handler(req, res) {
  setCors(res, 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const auth   = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // シートタブ名を取得（設定がなければ最初のシートを使用）
    const metaResp = await sheets.spreadsheets.get({
      spreadsheetId: SHEET_ID,
      includeGridData: false,
      fields: 'sheets(properties(sheetId,title,index),merges)',
    });

    const sheetList = metaResp.data.sheets || [];
    if (!sheetList.length) throw new Error('シートが見つかりません');

    // タブ名指定があれば一致するシートを使用、なければ最初のシート
    const targetSheet = SHEET_TAB
      ? (sheetList.find(s => s.properties.title === SHEET_TAB) || sheetList[0])
      : sheetList[0];

    const tabName = targetSheet.properties.title;
    const merges  = targetSheet.merges || [];

    // シート全データ取得
    const valResp = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range:         `'${tabName}'!A:Z`,
      valueRenderOption: 'FORMATTED_VALUE',
    });

    const rows = valResp.data.values || [];

    // F列の結合セル一覧（0-indexed）
    const fMerges = merges.filter(
      m => m.startColumnIndex === COL.F && m.endColumnIndex === COL.F + 1
    );

    // 店舗ブロックを構築
    const stores = buildStoreBlocks(rows, fMerges);

    console.log(`[requests-list] 取得完了: 店舗${stores.length}件 (シート: ${tabName})`);

    return res.json({
      stores,
      total:      stores.length,
      sheet_tab:  tabName,
      fetched_at: new Date().toISOString(),
    });

  } catch (e) {
    console.error('[requests-list] エラー:', e.message, e.stack);
    const code = e.message.includes('未設定') ? 503 : 500;
    return res.status(code).json({ error: e.message });
  }
}

// ── 店舗ブロック構築 ──────────────────────────────────────────────────────

function buildStoreBlocks(rows, fMerges) {
  const processed = new Set();
  const stores    = [];

  // 結合セルのある店舗ブロック
  for (const m of fMerges) {
    const startRow = m.startRowIndex;
    const endRow   = m.endRowIndex - 1; // inclusive
    const block    = extractBlock(rows, startRow, endRow);
    if (block) {
      stores.push(block);
      for (let r = startRow; r <= endRow; r++) processed.add(r);
    }
  }

  // 結合なしの単独行（店名パターンに一致する場合のみ）
  for (let r = 0; r < rows.length; r++) {
    if (processed.has(r)) continue;
    const row = rows[r];
    if (!row) continue;
    const g = cell(row, COL.G);
    if (!isStoreName(g)) continue;
    const block = extractBlock(rows, r, r);
    if (block) {
      stores.push(block);
      processed.add(r);
    }
  }

  // シート行順にソート
  stores.sort((a, b) => a.start_row - b.start_row);
  return stores;
}

function extractBlock(rows, startRow, endRow) {
  const firstRow = rows[startRow];
  if (!firstRow) return null;

  const rawName  = cell(firstRow, COL.G);
  const storeName = normalizeStoreName(rawName);
  if (!storeName) return null;

  // H列の店舗情報を複数行にわたり結合
  const infoLines = [];
  for (let r = startRow; r <= endRow; r++) {
    const v = cell(rows[r], COL.H);
    if (v.trim()) infoLines.push(v.trim());
  }

  // タスク（J列 + R列 のペア）
  const tasks = [];
  for (let r = startRow; r <= endRow; r++) {
    const item   = cell(rows[r], COL.J).trim();
    const status = cell(rows[r], COL.R).trim() || '未着手';
    if (!item) continue;
    tasks.push({ row_index: r + 1, item, status }); // 1-indexed
  }

  if (!tasks.length) return null;

  // 代表ステータス（最も重いもの）
  const repStatus = tasks.reduce((best, t) => {
    return (STATUS_WEIGHT[t.status] || 0) > (STATUS_WEIGHT[best] || 0) ? t.status : best;
  }, tasks[0].status);

  const completedCount = tasks.filter(
    t => t.status === '完了' || t.status === 'データ送付完了'
  ).length;

  return {
    id:                   `store_${startRow}_${storeName}`,
    store_name:           storeName,
    store_name_raw:       rawName,
    store_info:           infoLines.join('\n'),
    tasks,
    task_count:           tasks.length,
    completed_count:      completedCount,
    representative_status: repStatus,
    start_row:            startRow + 1, // 1-indexed（表示用）
    end_row:              endRow   + 1,
  };
}

// ── ユーティリティ ────────────────────────────────────────────────────────

function cell(row, idx) {
  return (row && row[idx] != null) ? String(row[idx]) : '';
}

function isStoreName(s) {
  return /アイケア|LaBo/.test(s) || /【.+店/.test(s);
}

function normalizeStoreName(raw) {
  if (!raw) return '';
  // 「【アイケアLaBo代々木本店】」 → 「代々木本店」
  const m1 = raw.match(/LaBo\s*(.+?)】/);
  if (m1) return m1[1].trim();
  // 「【アイケア代々木本店】」などの変形
  const m2 = raw.match(/【.+?アイケア\s*(.+?)】/);
  if (m2) return m2[1].trim();
  // 「【代々木本店】」のように直接書いてある場合
  const m3 = raw.match(/【(.+?)】/);
  if (m3) return m3[1].trim();
  return raw.trim();
}
