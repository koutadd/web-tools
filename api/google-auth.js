// api/google-auth.js — Google サービスアカウント認証共通ヘルパー
import { google } from 'googleapis';

/**
 * Google API 認証オブジェクトを返す
 * 環境変数:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL   - サービスアカウントのメールアドレス
 *   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY - 秘密鍵（\n をそのまま設定可）
 */
export function getAuth() {
  const email  = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!email || !rawKey) {
    throw new Error(
      'Google認証情報が未設定です。\n' +
      'Vercel環境変数に GOOGLE_SERVICE_ACCOUNT_EMAIL と ' +
      'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY を設定してください。\n' +
      'サービスアカウントの設定手順: https://cloud.google.com/iam/docs/service-accounts-create'
    );
  }

  // Vercel は改行を \\n として保存するため変換
  const privateKey = rawKey.replace(/\\n/g, '\n');

  return new google.auth.JWT(email, null, privateKey, [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/spreadsheets',
  ]);
}

/** CORS ヘッダー共通設定 */
export function setCors(res, methods = 'GET, POST, OPTIONS') {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
