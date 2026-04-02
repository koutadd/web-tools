// api/portfolio-list.js — Drive フォルダ走査による制作物一覧取得
// 構造: 親フォルダ / 000_店舗名 / 00_媒体名 / アウトプット / ファイル群
import { google } from 'googleapis';
import { getAuth, setCors } from './google-auth.js';

const PARENT_ID = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID || '10bc1kJynMcL3Peh799wVL6nH38Q5kI7X';

// 店舗フォルダ: 000_ で始まる（3桁数字 + _）
const STORE_RE  = /^\d{3}_/;
// 媒体フォルダ: 2桁数字 + _ （000_ は除外）
const MEDIA_RE  = /^\d{2}_/;
// アウトプットフォルダの許容名（表記ゆれ対応）
const OUTPUT_NAMES = new Set(['アウトプット', 'output', 'Output', 'アウトプット ']);

export default async function handler(req, res) {
  setCors(res, 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const auth  = getAuth();
    const drive = google.drive({ version: 'v3', auth });

    // ① 親フォルダ直下の店舗フォルダを取得（000_* パターン）
    const topFolders   = await listFolders(drive, PARENT_ID);
    const storeFolders = topFolders.filter(f => STORE_RE.test(f.name));

    const results = [];

    for (const sf of storeFolders) {
      const storeName = sf.name.replace(STORE_RE, '').trim();

      // ② 店舗フォルダ内の媒体フォルダ（00_* パターン）
      const allSub     = await listFolders(drive, sf.id);
      const mediaFolders = allSub.filter(
        f => MEDIA_RE.test(f.name) && !STORE_RE.test(f.name)
      );

      for (const mf of mediaFolders) {
        const mediaName = mf.name.replace(MEDIA_RE, '').trim();

        // ③ アウトプットフォルダを探す（表記ゆれ対応）
        const subFolders   = await listFolders(drive, mf.id);
        const outputFolder = subFolders.find(f => OUTPUT_NAMES.has(f.name.trim()));

        if (!outputFolder) continue; // アウトプットなし → スキップ（エラーにしない）

        // ④ アウトプット内のファイル一覧
        const files = await listFiles(drive, outputFolder.id);

        for (const file of files) {
          results.push({
            id:               file.id,
            name:             file.name,
            store_name:       storeName,
            store_folder_id:  sf.id,
            store_folder_name: sf.name,
            media_name:       mediaName,
            media_folder_id:  mf.id,
            media_folder_name: mf.name,
            output_folder_id: outputFolder.id,
            mime_type:        file.mimeType,
            modified_at:      file.modifiedTime,
            web_view_link:    file.webViewLink  || null,
            thumbnail_link:   file.thumbnailLink || null,
          });
        }
      }
    }

    // 更新日時の新しい順にソート
    results.sort((a, b) => new Date(b.modified_at) - new Date(a.modified_at));

    console.log(`[portfolio-list] 取得完了: ${results.length}件 (店舗${storeFolders.length}件)`);

    return res.json({
      data:        results,
      total:       results.length,
      store_count: storeFolders.length,
      fetched_at:  new Date().toISOString(),
    });

  } catch (e) {
    console.error('[portfolio-list] エラー:', e.message, e.stack);
    const code = e.message.includes('未設定') ? 503 : 500;
    return res.status(code).json({ error: e.message });
  }
}

// Drive フォルダ一覧取得
async function listFolders(drive, parentId) {
  const resp = await drive.files.list({
    q: `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id,name)',
    orderBy: 'name',
    pageSize: 200,
  });
  return resp.data.files || [];
}

// Drive ファイル一覧取得
async function listFiles(drive, folderId) {
  const resp = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: 'files(id,name,mimeType,modifiedTime,webViewLink,thumbnailLink)',
    orderBy: 'modifiedTime desc',
    pageSize: 200,
  });
  return resp.data.files || [];
}
