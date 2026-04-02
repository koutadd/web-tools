// api/requests-update.js — 依頼管理シートへの書き戻し
//   action=updateStatus   : R列のステータスを更新
//   action=writeDriveUrl  : 格納先DriveURL を列に書き込む
import { google } from 'googleapis';
import { getAuth, setCors } from './google-auth.js';

const SHEET_ID  = process.env.GOOGLE_SHEETS_REQUESTS_ID || '1Qe7Ri8rm_GQ21u5m6s533p0R9qAIKqbcBHP5HmLoLf0';
const SHEET_TAB = process.env.GOOGLE_SHEETS_REQUESTS_TAB || '';

// R列は 18番目 (A=1)
const COL_R_NUM  = 18;
// Drive URL 書き込み列のヘッダーキーワード（見つからなければ末尾に追加）
const DRIVE_URL_HEADER_KEYWORDS = ['制作完了データ', 'driveURL', 'Drive', '格納先'];

export default async function handler(req, res) {
  setCors(res, 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST のみ受け付けます' });

  let body;
  try {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    body = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
  } catch {
    return res.status(400).json({ error: 'リクエストボディの解析に失敗しました' });
  }

  const { action, row_index, status, drive_url, store_name, item } = body;

  if (!row_index || row_index < 1) {
    return res.status(400).json({ error: '行番号(row_index)が不正です' });
  }

  try {
    const auth   = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // タブ名を取得
    const tabName = await getTabName(sheets);

    // ── ステータス更新 ──────────────────────────────────────────────────
    if (action === 'updateStatus') {
      if (!status) return res.status(400).json({ error: 'status が指定されていません' });

      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range:         `'${tabName}'!R${row_index}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[status]] },
      });

      console.log(`[requests-update] ステータス更新: 行${row_index} "${store_name || ''}" "${item || ''}" → "${status}"`);
      return res.json({ ok: true, row_index, status });
    }

    // ── Drive URL 書き込み ───────────────────────────────────────────────
    if (action === 'writeDriveUrl') {
      if (!drive_url) return res.status(400).json({ error: 'drive_url が指定されていません' });

      // ヘッダー行を取得して書き込み先列を決定（既存列を破壊しない）
      const headerResp = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `'${tabName}'!1:1`,
      });
      const headers = (headerResp.data.values?.[0] || []).map(String);

      let urlColIdx = headers.findIndex(h =>
        DRIVE_URL_HEADER_KEYWORDS.some(k => h.includes(k))
      );
      if (urlColIdx === -1) {
        // 見つからなければ末尾の翌列（少なくとも R列=17 より後）
        urlColIdx = Math.max(headers.length, 17);
      }
      const colLetter = numToColLetter(urlColIdx + 1);

      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `'${tabName}'!${colLetter}${row_index}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[drive_url]] },
      });

      console.log(`[requests-update] Drive URL書き込み: 行${row_index} "${store_name || ''}" → ${drive_url}`);
      return res.json({ ok: true, row_index, drive_url, col: colLetter });
    }

    return res.status(400).json({ error: `不明なアクションです: ${action}` });

  } catch (e) {
    console.error('[requests-update] エラー:', e.message, e.stack);
    return res.status(500).json({ error: e.message });
  }
}

// ── ユーティリティ ────────────────────────────────────────────────────────

async function getTabName(sheets) {
  if (SHEET_TAB) return SHEET_TAB;
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_ID,
    fields: 'sheets(properties(title))',
  });
  return meta.data.sheets?.[0]?.properties?.title || 'シート1';
}

function numToColLetter(n) {
  let result = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}
