// api/drive-manage.js — Drive フォルダ構造の作成・アップロードセッション管理
//
// GET  ?mode=createStructure&store_name=代々木本店&media_name=チラシ
//       → 000_代々木本店/00_チラシ/アウトプット|参考資料|制作データ/入稿前データ|入稿データ を作成して ID を返す
//
// POST { action:'createUploadSession', folder_id, file_name, mime_type }
//       → Resumable アップロード用 URL を返す（ブラウザから直接 Drive PUT）
import { google } from 'googleapis';
import { getAuth, setCors } from './google-auth.js';

const PARENT_ID = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID || '10bc1kJynMcL3Peh799wVL6nH38Q5kI7X';
const FOLDER_MIME = 'application/vnd.google-apps.folder';

export default async function handler(req, res) {
  setCors(res, 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const auth  = getAuth();
    const drive = google.drive({ version: 'v3', auth });

    // ── GET: フォルダ構造作成 ───────────────────────────────────────────
    if (req.method === 'GET') {
      const { mode, store_name, media_name } = req.query;

      if (mode === 'createStructure') {
        if (!store_name || !media_name) {
          return res.status(400).json({ error: 'store_name と media_name が必要です' });
        }
        const result = await createFolderStructure(drive, store_name, media_name);
        return res.json({ ok: true, ...result });
      }

      return res.status(400).json({ error: '不明なモードです: ' + mode });
    }

    // ── POST: アップロードセッション作成 ────────────────────────────────
    if (req.method === 'POST') {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const body = JSON.parse(Buffer.concat(chunks).toString('utf-8'));

      if (body.action === 'createUploadSession') {
        const { folder_id, file_name, mime_type } = body;
        if (!folder_id || !file_name) {
          return res.status(400).json({ error: 'folder_id と file_name が必要です' });
        }
        const uploadUrl = await createResumableSession(auth, folder_id, file_name, mime_type || 'application/octet-stream');
        return res.json({ ok: true, upload_url: uploadUrl });
      }

      return res.status(400).json({ error: '不明なアクションです: ' + body.action });
    }

    return res.status(405).end();

  } catch (e) {
    console.error('[drive-manage] エラー:', e.message, e.stack);
    const code = e.message.includes('未設定') ? 503 : 500;
    return res.status(code).json({ error: e.message });
  }
}

// ── フォルダ構造作成 ────────────────────────────────────────────────────────

async function createFolderStructure(drive, storeName, mediaName) {
  // ① 000_店舗名
  const storeFolder  = await findOrCreate(drive, PARENT_ID, `000_${storeName}`);
  // ② 00_媒体名
  const mediaFolder  = await findOrCreate(drive, storeFolder.id, `00_${mediaName}`);
  // ③ アウトプット / 参考資料 / 制作データ
  const outputFolder = await findOrCreate(drive, mediaFolder.id, 'アウトプット');
  const refFolder    = await findOrCreate(drive, mediaFolder.id, '参考資料');
  const dataFolder   = await findOrCreate(drive, mediaFolder.id, '制作データ');
  // ④ 制作データ / 入稿前データ / 入稿データ
  const preNyukoFolder = await findOrCreate(drive, dataFolder.id, '入稿前データ');
  const nyukoFolder    = await findOrCreate(drive, dataFolder.id, '入稿データ');

  const logLabel = `000_${storeName} > 00_${mediaName}`;
  console.log(`[drive-manage] フォルダ構造確認/作成完了: ${logLabel}`);

  return {
    store_folder:      toInfo(storeFolder),
    media_folder:      toInfo(mediaFolder),
    output_folder:     toInfo(outputFolder),
    reference_folder:  toInfo(refFolder),
    data_folder:       toInfo(dataFolder),
    pre_nyuko_folder:  toInfo(preNyukoFolder),
    nyuko_folder:      toInfo(nyukoFolder),
    existed: storeFolder.existed && mediaFolder.existed,
  };
}

// 既存フォルダを探して返す。なければ作成
async function findOrCreate(drive, parentId, name) {
  const escaped = name.replace(/'/g, "\\'");
  const resp = await drive.files.list({
    q: `'${parentId}' in parents and mimeType='${FOLDER_MIME}' and name='${escaped}' and trashed=false`,
    fields: 'files(id,name)',
    pageSize: 1,
  });

  if (resp.data.files?.length > 0) {
    return { ...resp.data.files[0], existed: true };
  }

  const created = await drive.files.create({
    requestBody: { name, mimeType: FOLDER_MIME, parents: [parentId] },
    fields: 'id,name',
  });
  console.log(`[drive-manage] フォルダ作成: "${name}" in ${parentId}`);
  return { ...created.data, existed: false };
}

// ── Resumable アップロードセッション作成 ────────────────────────────────────

async function createResumableSession(auth, folderId, fileName, mimeType) {
  const tokenResp  = await auth.getAccessToken();
  const accessToken = tokenResp.token;

  const initResp = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': mimeType,
      },
      body: JSON.stringify({ name: fileName, parents: [folderId] }),
    }
  );

  if (!initResp.ok) {
    const txt = await initResp.text();
    throw new Error(`アップロードセッション作成失敗 (${initResp.status}): ${txt.slice(0, 200)}`);
  }

  const uploadUrl = initResp.headers.get('location');
  if (!uploadUrl) throw new Error('アップロードURLが取得できませんでした');

  return uploadUrl;
}

// ── ユーティリティ ────────────────────────────────────────────────────────

function toInfo(f) {
  return {
    id:  f.id,
    name: f.name,
    url: `https://drive.google.com/drive/folders/${f.id}`,
    existed: !!f.existed,
  };
}
