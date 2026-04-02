/**
 * Google Drive OAuth2 認証
 * ローカルサーバーでコールバックを受け取り、コード貼り付け不要で認証を完了する。
 */

import fs from 'fs/promises';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const TOKEN_PATH = path.join(__dirname, 'token.json');
const SCOPES = ['https://www.googleapis.com/auth/drive'];
const CALLBACK_PORT = 9999;
const REDIRECT_URI = `http://localhost:${CALLBACK_PORT}`;

export async function getAuthClient() {
  let credentials;
  try {
    const raw = await fs.readFile(CREDENTIALS_PATH, 'utf8');
    credentials = JSON.parse(raw);
  } catch {
    throw new Error(
      `credentials.json が見つかりません。\n` +
      `Google Cloud Console で OAuth2 クライアント ID (デスクトップアプリ) を作成し、\n` +
      `credentials.json として ${__dirname} に保存してください。`
    );
  }

  const { client_secret, client_id } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, REDIRECT_URI);

  // 保存済みトークンがあれば再利用
  try {
    const token = JSON.parse(await fs.readFile(TOKEN_PATH, 'utf8'));
    oAuth2Client.setCredentials(token);
    oAuth2Client.on('tokens', async (newTokens) => {
      const current = JSON.parse(await fs.readFile(TOKEN_PATH, 'utf8').catch(() => '{}'));
      await fs.writeFile(TOKEN_PATH, JSON.stringify({ ...current, ...newTokens }, null, 2));
    });
    return oAuth2Client;
  } catch {
    return await runAuthFlow(oAuth2Client);
  }
}

async function runAuthFlow(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    redirect_uri: REDIRECT_URI,
  });

  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url, REDIRECT_URI);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      if (error) {
        res.end('<html><body><h2>❌ 認証がキャンセルされました</h2><p>ターミナルを確認してください。</p></body></html>');
        server.close();
        reject(new Error(`OAuth error: ${error}`));
        return;
      }

      if (!code) { res.end('waiting...'); return; }

      res.end('<html><body style="font-family:sans-serif;padding:40px"><h2>✅ 認証完了</h2><p>このタブを閉じてください。</p></body></html>');
      server.close();

      try {
        const { tokens } = await oAuth2Client.getToken({ code, redirect_uri: REDIRECT_URI });
        oAuth2Client.setCredentials(tokens);
        await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2));
        console.log('✅ 認証完了。token.json を保存しました。');
        resolve(oAuth2Client);
      } catch (e) {
        reject(e);
      }
    });

    server.listen(CALLBACK_PORT, () => {
      console.log('ブラウザで認証してください...');
      // macOS でブラウザを開く
      import('child_process').then(({ exec }) => exec(`open "${authUrl}"`));
    });

    server.on('error', reject);
  });
}

// CLI 直接実行
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    await getAuthClient();
    process.exit(0);
  } catch (e) {
    console.error('❌', e.message);
    process.exit(1);
  }
}
