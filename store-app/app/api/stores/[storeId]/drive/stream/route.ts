/**
 * POST /api/stores/[storeId]/drive/stream
 *
 * 大容量ファイル（.ai / .psd など 20MB 超）向けのストリーミングアップロード。
 * req.body を Buffer に展開せず Node.js Readable ストリームとして直接 Drive へ流す。
 *
 * クエリパラメータ（body の代わりにメタデータを URL で渡す）:
 *   fileName       string  — ファイル名（必須）
 *   mimeType       string  — MIME タイプ（省略時: application/octet-stream）
 *   category       string  — 'photo'|'logo'|'document'|'access'|'sns'|'other'（省略時: 'other'）
 *   requiredItemId string  — 紐づく RequiredItem ID（任意）
 *
 * リクエストボディ: 生ファイルバイト列（Content-Type: ファイルの MIME タイプ）
 *
 * レスポンス:
 *   { driveFileId, driveFileUrl, storeFolderId, subFolderId, submission? }
 */

import { type NextRequest } from 'next/server';
import { Readable } from 'stream';
import { prisma } from '@/lib/prisma';
import {
  getDriveClient,
  ensureStoreFolders,
  uploadStreamToDrive,
  CATEGORY_TO_SUBFOLDER,
} from '@/lib/drive';

// Vercel では最大 300 秒（大容量ファイル転送に備える）
export const maxDuration = 300;
export const dynamic     = 'force-dynamic';

type Ctx = { params: Promise<{ storeId: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const { storeId } = await params;

  // ─── クエリパラメータ読み取り ──────────────────────────────────────────────
  const url            = new URL(req.url);
  const fileName       = url.searchParams.get('fileName')?.trim()  || 'upload';
  const mimeType       = url.searchParams.get('mimeType')?.trim()  || 'application/octet-stream';
  const category       = url.searchParams.get('category')?.trim()  || 'other';
  const requiredItemId = url.searchParams.get('requiredItemId')?.trim() || '';

  if (!req.body) {
    return Response.json({ error: 'ファイルデータが空です' }, { status: 400 });
  }

  // ─── 店舗確認 ──────────────────────────────────────────────────────────────
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) {
    return Response.json({ error: '店舗が見つかりません' }, { status: 404 });
  }

  // ─── Drive クライアント + フォルダ準備 ────────────────────────────────────
  let drive;
  try {
    drive = getDriveClient();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Google Drive の認証に失敗しました';
    return Response.json({ error: msg }, { status: 500 });
  }

  let folders;
  try {
    folders = await ensureStoreFolders(drive, store.name, storeId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Drive フォルダの準備に失敗しました';
    return Response.json({ error: msg }, { status: 500 });
  }

  // category → サブフォルダ選択
  const subfolderKey = CATEGORY_TO_SUBFOLDER[category] ?? '99_その他';
  let targetFolder = folders.other;
  if (subfolderKey === '01_店舗画像')   targetFolder = folders.photo;
  if (subfolderKey === '02_ロゴ・素材') targetFolder = folders.asset;
  if (subfolderKey === '03_制作資料')   targetFolder = folders.document;
  if (subfolderKey === '04_提出データ') targetFolder = folders.submit;

  // ─── ストリーミングアップロード ────────────────────────────────────────────
  // req.body は Web API の ReadableStream — Node.js Readable に変換して googleapis へ渡す
  const nodeStream = Readable.fromWeb(
    req.body as Parameters<typeof Readable.fromWeb>[0],
  );

  let uploaded: { id: string; url: string };
  try {
    uploaded = await uploadStreamToDrive(
      drive,
      targetFolder.id,
      fileName,
      mimeType,
      nodeStream,
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Drive へのアップロードに失敗しました';
    return Response.json({ error: msg }, { status: 500 });
  }

  // ─── DB 書き込み ───────────────────────────────────────────────────────────
  let submission = null;
  if (requiredItemId) {
    const item = await prisma.requiredItem.findUnique({ where: { id: requiredItemId } });
    if (item && item.storeId === storeId) {
      submission = await prisma.submission.create({
        data: {
          requiredItemId,
          fileUrl:         uploaded.url,
          fileName,
          driveFileId:     uploaded.id,
          driveFileUrl:    uploaded.url,
          driveFolderId:   targetFolder.id,
          storageProvider: 'google_drive',
          status:          'pending',
        },
      });
      await prisma.requiredItem.update({
        where: { id: requiredItemId },
        data:  { status: 'submitted', whoWaiting: 'admin' },
      });
    }
  }

  // Store と UploadDestination を更新
  await prisma.store.update({
    where: { id: storeId },
    data: {
      googleDriveStoreFolderId: folders.root.id,
      googleDrivePhotoFolderId: folders.photo.id,
    },
  });

  await prisma.uploadDestination.upsert({
    where:  { storeId },
    create: {
      storeId,
      provider:          'google_drive',
      rootFolderName:    `${store.name}_${storeId}`,
      rootFolderId:      folders.root.id,
      rootFolderUrl:     folders.root.url,
      photoFolderId:     folders.photo.id,
      photoFolderUrl:    folders.photo.url,
      assetFolderId:     folders.asset.id,
      assetFolderUrl:    folders.asset.url,
      documentFolderId:  folders.document.id,
      documentFolderUrl: folders.document.url,
      otherFolderId:     folders.other.id,
      submitFolderId:    folders.submit.id,
      submitFolderUrl:   folders.submit.url,
      isConfigured:      true,
    },
    update: {
      rootFolderName:    `${store.name}_${storeId}`,
      rootFolderId:      folders.root.id,
      rootFolderUrl:     folders.root.url,
      photoFolderId:     folders.photo.id,
      photoFolderUrl:    folders.photo.url,
      assetFolderId:     folders.asset.id,
      assetFolderUrl:    folders.asset.url,
      documentFolderId:  folders.document.id,
      documentFolderUrl: folders.document.url,
      otherFolderId:     folders.other.id,
      submitFolderId:    folders.submit.id,
      submitFolderUrl:   folders.submit.url,
      isConfigured:      true,
    },
  });

  return Response.json({
    uploadSuccess:  true,
    driveUploadUrl: folders.submit.url,
    submission,
  });
}
