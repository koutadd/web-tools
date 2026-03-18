/**
 * POST /api/stores/[storeId]/drive/setup
 *
 * 店舗フォルダ一式を Google Drive に作成（なければ作成・あればスキップ）し、
 * Store と UploadDestination に ID / URL を保存する。
 *
 * 冪等操作: 何度呼んでも安全（既存フォルダは再利用）
 */

import { prisma } from '@/lib/prisma';
import { getDriveClient, ensureStoreFolders } from '@/lib/drive';

type Ctx = { params: Promise<{ storeId: string }> };

export async function POST(_req: Request, { params }: Ctx) {
  const { storeId } = await params;

  // ─── 店舗確認 ──────────────────────────────────────────────────────────
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) {
    return Response.json({ error: '店舗が見つかりません' }, { status: 404 });
  }

  // ─── Drive クライアント ────────────────────────────────────────────────
  let drive;
  try {
    drive = getDriveClient();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Google Drive の認証に失敗しました';
    return Response.json({ error: msg }, { status: 500 });
  }

  // ─── フォルダを getOrCreate ────────────────────────────────────────────
  let folders;
  try {
    folders = await ensureStoreFolders(drive, store.name, storeId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'フォルダの作成に失敗しました';
    return Response.json({ error: msg }, { status: 500 });
  }

  // ─── DB 保存 ────────────────────────────────────────────────────────────
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

  // EventLog
  await prisma.eventLog.create({
    data: {
      storeId,
      eventType:  'upload_destination_configured',
      actorType:  'admin',
      targetType: 'store',
      targetId:   storeId,
      metaJson:   JSON.stringify({
        storeFolderId: folders.root.id,
        photoFolderId: folders.photo.id,
      }),
    },
  });

  return Response.json({
    message:       'Google Drive フォルダの準備が完了しました',
    storeFolderId: folders.root.id,
    folders: {
      root:     { id: folders.root.id,     url: folders.root.url },
      photo:    { id: folders.photo.id,    url: folders.photo.url },
      asset:    { id: folders.asset.id,    url: folders.asset.url },
      document: { id: folders.document.id, url: folders.document.url },
      submit:   { id: folders.submit.id,   url: folders.submit.url },
      other:    { id: folders.other.id,    url: folders.other.url },
    },
  });
}
