/**
 * Google Sheets チャットログ書き込みヘルパー
 *
 * 必要な環境変数:
 *   GOOGLE_SERVICE_ACCOUNT_JSON  — 既存のサービスアカウント認証情報
 *   GOOGLE_SHEETS_CHAT_LOG_ID    — 書き込み先スプレッドシートID
 *
 * スプレッドシートのシート1に以下の列でログを追記:
 *   A: 日時 (JST)  B: 店舗名  C: 送信者  D: メッセージ本文
 */

import { google } from 'googleapis';

export async function appendChatLog(
  storeName: string,
  userType: string,
  authorName: string,
  text: string,
): Promise<void> {
  const sheetId  = process.env.GOOGLE_SHEETS_CHAT_LOG_ID;
  const credJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!sheetId || !credJson) return;

  try {
    const creds = JSON.parse(credJson);
    const auth  = new google.auth.GoogleAuth({
      credentials: creds,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() as Parameters<typeof google.sheets>[0]['auth'] });

    const now = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
    const who = userType === 'owner'
      ? `オーナー${authorName ? ` (${authorName})` : ''}`
      : `管理者${authorName ? ` (${authorName})` : ''}`;

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'A:D',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[now, storeName, who, text]],
      },
    });
  } catch {
    console.warn('[sheets] ログ書き込み失敗（続行）');
  }
}
