/**
 * auth.js — freee OAuth2認証（implicit grant flow）
 */
import http from 'http';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CLIENT_ID    = process.env.FREEE_CLIENT_ID;
const REDIRECT_URI = 'http://localhost:8080/callback';

if (!CLIENT_ID) {
  console.error('❌ .env に FREEE_CLIENT_ID を設定してください');
  process.exit(1);
}

const port = 8080;
const authUrl = `https://accounts.secure.freee.co.jp/public_api/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token`;

const HTML = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>
<script>
  const hash = window.location.hash.substring(1);
  const params = Object.fromEntries(new URLSearchParams(hash));
  if (params.access_token) {
    fetch('/save?token=' + encodeURIComponent(params.access_token))
      .then(() => { document.body.innerHTML = '<h2>認証完了！このタブを閉じてください。</h2>'; });
  } else {
    document.body.innerHTML = '<h2>トークンが取得できませんでした: ' + JSON.stringify(params) + '</h2>';
  }
</script>
</body></html>`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);

  if (url.pathname === '/callback') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(HTML);
    return;
  }

  if (url.pathname === '/save') {
    const token = url.searchParams.get('token');
    if (!token) {
      res.end('token not found');
      return;
    }

    // 事業所IDを取得
    let companyId = '';
    try {
      const meRes = await fetch('https://api.freee.co.jp/api/1/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const me = await meRes.json();
      companyId = String(me.user?.companies?.[0]?.id || '');
      console.log(`✅ 事業所: ${me.user?.companies?.[0]?.display_name} (ID: ${companyId})`);
    } catch (e) {
      console.error('事業所ID取得失敗:', e.message);
    }

    // .env に書き込み
    const envPath = path.join(__dirname, '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent = setEnvVar(envContent, 'FREEE_ACCESS_TOKEN', token);
    if (companyId) envContent = setEnvVar(envContent, 'FREEE_COMPANY_ID', companyId);
    fs.writeFileSync(envPath, envContent);

    console.log('✅ 認証完了！ .env にトークンを保存しました。');
    res.end('ok');
    server.close();
    process.exit(0);
  }
});

server.listen(port, () => {
  console.log('\n🔑 freee認証を開始します...');
  console.log(`ブラウザが開かない場合は以下のURLを開いてください:\n${authUrl}\n`);
  exec(`open "${authUrl}"`);
});

function setEnvVar(content, key, value) {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) return content.replace(regex, `${key}=${value}`);
  return content + `\n${key}=${value}`;
}
