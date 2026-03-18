/**
 * GET /api/stores/[storeId]/drive/info
 *
 * フロントエンドが「入稿データフォルダURL」と「設定済みか」を確認するためのシンプルなエンドポイント。
 * driveUploadUrl: 04_提出データ フォルダの URL（ユーザーが直接アップロードする先）
 */

import { prisma } from '@/lib/prisma';

type Ctx = { params: Promise<{ storeId: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { storeId } = await params;

  const dest = await prisma.uploadDestination.findUnique({
    where: { storeId },
    select: { submitFolderUrl: true, isConfigured: true },
  });

  return Response.json({
    driveUploadUrl: dest?.submitFolderUrl ?? '',
    isConfigured:   dest?.isConfigured   ?? false,
  });
}
