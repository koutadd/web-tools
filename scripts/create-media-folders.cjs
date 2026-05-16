#!/usr/bin/env node
/**
 * AICARE 媒体フォルダ自動作成スクリプト
 * 使用: node create-media-folders.js <店名>
 *
 * ① 親フォルダに 000_(店名) を作成（既存はスキップ）
 * ② スプレッドシートH+I列から媒体リスト取得
 * ③ 通し番号_媒体名 サブフォルダを作成（既存はスキップ）
 * ④ アウトプット / 入稿データ / 入稿前データ を作成（既存はスキップ）
 */

'use strict';

const https = require('https');
const fs    = require('fs');
const path  = require('path');

// ── 設定 ──────────────────────────────────────────────────────
const PARENT_FOLDER_ID = '10bc1kJynMcL3Peh799wVL6nH38Q5kI7X';
const SHEET_ID         = '1Qe7Ri8rm_GQ21u5m6s533p0R9qAIKqbcBHP5HmLoLf0';
const SHEETS_API_KEY   = 'AIzaSyClqdrH3V1i9cqV7mkERllvX4u4PEGgLCs';
const SUBFOLDERS       = ['アウトプット', '入稿データ', '入稿前データ'];
const CLASPRC          = path.join(process.env.HOME, '.clasprc.json');

// ── OAuth トークン取得 ─────────────────────────────────────────
async function getAccessToken() {
  const rc = JSON.parse(fs.readFileSync(CLASPRC, 'utf8'));
  const { refresh_token, client_id, client_secret } = rc.tokens.default;
  const body = `client_id=${client_id}&client_secret=${client_secret}&refresh_token=${refresh_token}&grant_type=refresh_token`;
  const data = await post('oauth2.googleapis.com', '/token', body, 'application/x-www-form-urlencoded');
  if (data.error) throw new Error('トークン取得失敗: ' + data.error_description);
  return data.access_token;
}

// ── HTTP ヘルパー ───────────────────────────────────────────────
function get(host, path) {
  return new Promise((resolve, reject) => {
    https.get({ host, path, headers: { 'User-Agent': 'aicare-script/1.0' } }, res => {
      let buf = '';
      res.on('data', d => buf += d);
      res.on('end', () => resolve(JSON.parse(buf)));
    }).on('error', reject);
  });
}

function authGet(host, path, token) {
  return new Promise((resolve, reject) => {
    https.get({ host, path, headers: { Authorization: 'Bearer ' + token } }, res => {
      let buf = '';
      res.on('data', d => buf += d);
      res.on('end', () => resolve(JSON.parse(buf)));
    }).on('error', reject);
  });
}

function post(host, path, body, contentType) {
  return new Promise((resolve, reject) => {
    const buf = Buffer.from(body);
    const req = https.request({
      host, path, method: 'POST',
      headers: { 'Content-Type': contentType || 'application/json', 'Content-Length': buf.length }
    }, res => {
      let out = '';
      res.on('data', d => out += d);
      res.on('end', () => resolve(JSON.parse(out)));
    });
    req.on('error', reject);
    req.write(buf);
    req.end();
  });
}

function authPost(host, path, body, token) {
  return new Promise((resolve, reject) => {
    const buf = Buffer.from(JSON.stringify(body));
    const req = https.request({
      host, path, method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', 'Content-Length': buf.length }
    }, res => {
      let out = '';
      res.on('data', d => out += d);
      res.on('end', () => resolve(JSON.parse(out)));
    });
    req.on('error', reject);
    req.write(buf);
    req.end();
  });
}

// ── Drive: フォルダ一覧 ────────────────────────────────────────
async function listFolders(parentId, token) {
  const q = encodeURIComponent(`'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const data = await authGet('www.googleapis.com',
    `/drive/v3/files?q=${q}&fields=files(id,name,webViewLink)&pageSize=1000`, token);
  if (data.error) throw new Error('Drive list error: ' + data.error.message);
  return data.files || [];
}

// ── Drive: フォルダ find-or-create ─────────────────────────────
async function findOrCreate(name, parentId, token) {
  const list  = await listFolders(parentId, token);
  const found = list.find(f => f.name === name);
  if (found) return { id: found.id, url: found.webViewLink, skipped: true };
  const data = await authPost('www.googleapis.com',
    '/drive/v3/files?fields=id,name,webViewLink',
    { name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] }, token);
  if (data.error) throw new Error('Drive create error: ' + data.error.message);
  return { id: data.id, url: data.webViewLink || `https://drive.google.com/drive/folders/${data.id}`, skipped: false };
}

// ── Sheets: 媒体リスト取得（店舗製作物シート H+I列のユニーク組合せ）────
async function getMediaList() {
  const range = encodeURIComponent('店舗製作物!H:I');
  const data  = await get('sheets.googleapis.com',
    `/v4/spreadsheets/${SHEET_ID}/values/${range}?key=${SHEETS_API_KEY}`);
  if (data.error) throw new Error('Sheets API error: ' + data.error.message);

  const seen = new Map();
  for (const row of (data.values || [])) {
    const h = String(row[0] || '').trim();
    const i = String(row[1] || '').trim();
    if (!h || !i) continue;
    if (h.includes('番号') || i.includes('アイテム')) continue;
    const no  = h.padStart(2, '0');
    const key = no + '_' + i;
    if (!seen.has(key)) seen.set(key, { no, name: i, folderName: key });
  }
  return Array.from(seen.values()).sort((a, b) => a.folderName.localeCompare(b.folderName, 'ja'));
}

// ── キャンセル時の再帰削除 ────────────────────────────────────
async function deleteRecursive(folderId, token) {
  const q = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
  const data = await authGet('www.googleapis.com',
    `/drive/v3/files?q=${q}&fields=files(id,name,mimeType)&pageSize=1000`, token);
  for (const f of (data.files || [])) {
    if (f.mimeType === 'application/vnd.google-apps.folder') await deleteRecursive(f.id, token);
    await new Promise((resolve, reject) => {
      const req = require('https').request({
        host: 'www.googleapis.com', path: `/drive/v3/files/${f.id}`, method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token }
      }, res => { res.resume(); res.on('end', resolve); });
      req.on('error', reject); req.end();
    });
  }
}

function askYesNo(question) {
  return new Promise(resolve => {
    process.stdout.write(question + ' [y/N] ');
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', d => {
      process.stdin.pause();
      resolve(d.trim().toLowerCase() === 'y');
    });
  });
}

// ── メイン ────────────────────────────────────────────────────
async function main() {
  const storeNo   = process.argv[2];
  const storeName = process.argv[3];
  if (!storeNo || !storeName) {
    console.error('使用方法: node create-media-folders.cjs <店舗番号> <店舗名>');
    console.error('例:       node create-media-folders.cjs 001 虎ノ門駅前');
    process.exit(1);
  }

  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('  AICARE 媒体フォルダ自動作成');
  console.log('═══════════════════════════════════════════');
  console.log(`  店舗番号: ${storeNo}  店舗名: ${storeName}`);
  console.log('  ※ 途中でキャンセルするには Ctrl+C を押してください');
  console.log('');

  const token = await getAccessToken();
  const storeFolderName = storeNo + '_' + storeName;
  const createdFolderIds = [];
  let storeFolderId = null;
  let cancelled = false;

  // Ctrl+C ハンドラ
  process.on('SIGINT', async () => {
    if (cancelled) return;
    cancelled = true;
    console.log('\n\n⚠ キャンセルされました');
    if (createdFolderIds.length > 0 || storeFolderId) {
      console.log(`\n現在「${storeFolderName}」というフォルダが作られています。`);
      console.log(`作成済みフォルダ数: ${createdFolderIds.length + (storeFolderId ? 1 : 0)} フォルダ`);
      const del = await askYesNo('作成済みのフォルダを削除しますか？');
      if (del) {
        process.stdout.write('削除中... ');
        const rootId = storeFolderId || createdFolderIds[0];
        if (rootId) {
          await deleteRecursive(rootId, token).catch(() => {});
          await new Promise((res, rej) => {
            const req = require('https').request({
              host: 'www.googleapis.com', path: `/drive/v3/files/${rootId}`, method: 'DELETE',
              headers: { Authorization: 'Bearer ' + token }
            }, r => { r.resume(); r.on('end', res); });
            req.on('error', rej); req.end();
          }).catch(() => {});
        }
        console.log('✅ 削除完了');
      } else {
        console.log('フォルダはそのまま残します。');
        console.log(`URL: https://drive.google.com/drive/folders/${storeFolderId}`);
      }
    }
    process.exit(0);
  });

  // ① 店舗フォルダ
  process.stdout.write(`① 店舗フォルダ確認: ${storeFolderName} ... `);
  const storeFolder = await findOrCreate(storeFolderName, PARENT_FOLDER_ID, token);
  storeFolderId = storeFolder.id;
  if (!storeFolder.skipped) createdFolderIds.push(storeFolder.id);
  console.log(storeFolder.skipped ? '⏭ スキップ（既存）' : '✅ 作成');
  console.log(`   ${storeFolder.url}`);
  console.log('');

  // ② 媒体リスト
  process.stdout.write('② スプレッドシートから媒体リストを取得中 ... ');
  const mediaList = await getMediaList();
  console.log(`${mediaList.length} 件`);
  mediaList.forEach(m => process.stdout.write(`   ${m.folderName}  `));
  console.log('\n');

  if (!mediaList.length) {
    console.error('⚠ スプレッドシートのH・I列に有効なデータがありません');
    process.exit(1);
  }

  // ③④ 各媒体フォルダ
  let created = 0, skipped = 0;
  for (const media of mediaList) {
    if (cancelled) break;
    process.stdout.write(`③ ${media.folderName} ... `);
    const mediaFolder = await findOrCreate(media.folderName, storeFolder.id, token);
    console.log(mediaFolder.skipped ? '⏭ スキップ' : '✅ 作成');
    if (!mediaFolder.skipped) { created++; createdFolderIds.push(mediaFolder.id); }
    else skipped++;

    for (const subName of SUBFOLDERS) {
      if (cancelled) break;
      process.stdout.write(`   ④ ${subName} ... `);
      const sub = await findOrCreate(subName, mediaFolder.id, token);
      console.log(sub.skipped ? '⏭ スキップ' : '✅ 作成');
    }
  }

  if (cancelled) return;

  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log(`  ✅ 完了！`);
  console.log(`  媒体フォルダ: 作成 ${created} / スキップ ${skipped}`);
  console.log(`  店舗フォルダ: ${storeFolder.url}`);
  console.log('═══════════════════════════════════════════');
  console.log('');
  process.exit(0);
}

main().catch(e => { console.error('\n❌ エラー:', e.message); process.exit(1); });
