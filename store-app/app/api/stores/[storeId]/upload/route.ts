/**
 * POST /api/stores/[storeId]/upload
 *
 * multipart/form-data:
 *   file           File     — アップロードするファイル（必須）
 *   requiredItemId string   — 紐づく RequiredItem ID（任意）
 *   category       string   — 'photo'|'logo'|'document'|'access'|'sns'|'other'（省略時: 'photo'）
 *
 * レスポンス:
 *   { driveFileId, driveFileUrl, storeFolderId, subFolderId, submission? }
 *
 * 処理フロー:
 *   1. 店舗フォルダ（{storeName}_{storeId}）を getOrCreate
 *   2. category に対応するサブフォルダを getOrCreate
 *   3. Drive へファイルをアップロード
 *   4. Submission レコードを作成（requiredItemId がある場合）
 *   5. RequiredItem.status → 'submitted'、whoWaiting → 'admin' に更新
 *   6. UploadDestination を upsert（フォルダ ID / URL を保存）
 *
 * ファイルサイズ上限: 50MB
 *   このルートは formData() + Buffer でメモリバッファリングするため、
 *   50MB 超のファイル（.ai / .psd など）はサーバー OOM を防ぐために拒否する。
 *   大容量ファイルは Google Drive フォルダへ直接アップロードを案内すること。
 */

import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getDriveClient,
  ensureStoreFolders,
  uploadFileToDrive,
  CATEGORY_TO_SUBFOLDER,
} from '@/lib/drive';

// Drive アップロードを含む処理のためタイムアウトを延長
export const maxDuration = 120;

// サーバー側ファイルサイズ上限（クライアント側と統一: 100MB）
// formData() はリクエスト全体をメモリにバッファリングするため、大容量ファイルは OOM のリスクがある
const FILE_MAX_BYTES = 100 * 1024 * 1024; // 100MB

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  const { storeId } = await params;

  // ─── 1. リクエストパース ────────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return Response.json({ error: 'ファイルの受信に失敗しました。ファイルが大きすぎるか、通信が途切れた可能性があります。' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: 'ファイルが見つかりません' }, { status: 400 });
  }

  // ─── サイズチェック ─────────────────────────────────────────────────────
  if (file.size > FILE_MAX_BYTES) {
    return Response.json(
      {
        error:
          'ファイルサイズが大きすぎます。100MB以下の画像はこの画面からアップロードできます。' +
          'ai / psd / pdf などの大きいデータはGoogle Driveへ直接アップしてください。',
      },
      { status: 413 },
    );
  }

  const requiredItemId = formData.get('requiredItemId');
  const category       = (formData.get('category') as string | null) ?? 'photo';

  // ─── 2. 店舗を取得 ─────────────────────────────────────────────────────
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) {
    return Response.json({ error: '店舗が見つかりません' }, { status: 404 });
  }

  // ─── 3. Drive 操作 ─────────────────────────────────────────────────────
  let drive;
  try {
    drive = getDriveClient();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Drive 認証エラー';
    return Response.json({ error: msg }, { status: 500 });
  }

  // 店舗フォルダ一式を getOrCreate
  const folders = await ensureStoreFolders(drive, store.name, storeId);

  // category → サブフォルダ選択
  const subfolderKey = CATEGORY_TO_SUBFOLDER[category] ?? '01_店舗画像';
  let targetFolder = folders.photo; // default: 01_店舗画像
  if (subfolderKey === '02_ロゴ・素材')  targetFolder = folders.asset;
  if (subfolderKey === '03_制作資料')   targetFolder = folders.document;
  if (subfolderKey === '04_提出データ') targetFolder = folders.submit;
  if (subfolderKey === '99_その他')     targetFolder = folders.other;

  // ファイルをバッファに展開して Drive へアップロード
  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch {
    return Response.json(
      { error: 'ファイルの読み込みに失敗しました。再度お試しください。' },
      { status: 500 },
    );
  }

  let uploaded: { id: string; url: string };
  try {
    uploaded = await uploadFileToDrive(
      drive,
      targetFolder.id,
      file.name,
      file.type || 'application/octet-stream',
      buffer,
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Drive へのアップロードに失敗しました';
    return Response.json({ error: `Drive アップロードエラー: ${msg}` }, { status: 500 });
  }

  // ─── 4. DB 書き込み ────────────────────────────────────────────────────
  // Submission 作成 + RequiredItem 更新
  let submission = null;
  if (typeof requiredItemId === 'string' && requiredItemId.length > 0) {
    // 既存 requiredItem の確認
    const item = await prisma.requiredItem.findUnique({ where: { id: requiredItemId } });
    if (item) {
      submission = await prisma.submission.create({
        data: {
          requiredItemId,
          fileUrl:         uploaded.url,
          fileName:        file.name,
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

  // Store に Drive フォルダ ID を保存（クイックアクセス用）
  await prisma.store.update({
    where: { id: storeId },
    data: {
      googleDriveStoreFolderId: folders.root.id,
      googleDrivePhotoFolderId: folders.photo.id,
    },
  });

  // UploadDestination を upsert（フォルダ ID / URL を保存）
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

  // ─── 5. レスポンス ─────────────────────────────────────────────────────
  return Response.json({
    uploadSuccess:  true,
    driveUploadUrl: folders.submit.url,
    submission,
  });
}
