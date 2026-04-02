/**
 * GET /api/stores/[storeId]/drive/info
 *
 * フロントエンドがカテゴリ別フォルダURLと設定済みフラグを確認するエンドポイント。
 * driveUploadUrl: 04_提出データ フォルダ URL（後方互換のため維持）
 * photoFolderUrl / assetFolderUrl / documentFolderUrl / rootFolderUrl: カテゴリ別フォルダ URL
 */

import { prisma } from '@/lib/prisma';

type Ctx = { params: Promise<{ storeId: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { storeId } = await params;

  const dest = await prisma.uploadDestination.findUnique({
    where: { storeId },
    select: {
      submitFolderUrl:   true,
      photoFolderUrl:    true,
      assetFolderUrl:    true,
      documentFolderUrl: true,
      rootFolderUrl:     true,
      isConfigured:      true,
    },
  });

  return Response.json({
    driveUploadUrl:    dest?.submitFolderUrl   ?? '',
    photoFolderUrl:    dest?.photoFolderUrl    ?? '',
    assetFolderUrl:    dest?.assetFolderUrl    ?? '',
    documentFolderUrl: dest?.documentFolderUrl ?? '',
    rootFolderUrl:     dest?.rootFolderUrl     ?? '',
    isConfigured:      dest?.isConfigured      ?? false,
  });
}
