import { prisma } from '@/lib/prisma';
import { ok, err } from '@/lib/api';

type Ctx = { params: Promise<{ storeId: string }> };

const VALID_PROVIDERS = ['google_drive', 'dropbox', 'onedrive'] as const;

// GET /api/stores/[storeId]/upload-destination
// 未設定の場合は isConfigured=false のダミーレコードを返す（upsert で常にレコードを保証）
export async function GET(_req: Request, { params }: Ctx) {
  const { storeId } = await params;
  try {
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return err('店舗が見つかりません', 404);

    const dest = await prisma.uploadDestination.upsert({
      where:  { storeId },
      update: {},
      create: { storeId },
    });

    return ok(dest);
  } catch {
    return err('保存先設定の取得に失敗しました', 500);
  }
}

// PUT /api/stores/[storeId]/upload-destination — 保存先設定更新
export async function PUT(request: Request, { params }: Ctx) {
  const { storeId } = await params;
  try {
    const body = await request.json();
    const {
      provider, rootFolderName, rootFolderUrl,
      photoFolderUrl, assetFolderUrl, documentFolderUrl,
    } = body;

    if (provider !== undefined && !(VALID_PROVIDERS as readonly string[]).includes(provider)) {
      return err('provider は google_drive / dropbox / onedrive のいずれかを指定してください');
    }
    if (rootFolderUrl !== undefined && (typeof rootFolderUrl !== 'string' || rootFolderUrl.trim() === '')) {
      return err('rootFolderUrl は空にできません');
    }

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return err('店舗が見つかりません', 404);

    // rootFolderUrl が設定されていれば isConfigured=true とみなす
    const incoming = {
      ...(provider        !== undefined && { provider }),
      ...(rootFolderName  !== undefined && { rootFolderName:    String(rootFolderName).trim() }),
      ...(rootFolderUrl   !== undefined && { rootFolderUrl:     String(rootFolderUrl).trim() }),
      ...(photoFolderUrl  !== undefined && { photoFolderUrl:    String(photoFolderUrl).trim() }),
      ...(assetFolderUrl  !== undefined && { assetFolderUrl:    String(assetFolderUrl).trim() }),
      ...(documentFolderUrl !== undefined && { documentFolderUrl: String(documentFolderUrl).trim() }),
    };

    const updated = await prisma.uploadDestination.upsert({
      where:  { storeId },
      update: {
        ...incoming,
        // rootFolderUrl が空でなければ設定済みとする
        isConfigured: typeof rootFolderUrl === 'string' && rootFolderUrl.trim() !== '',
      },
      create: {
        storeId,
        ...incoming,
        isConfigured: typeof rootFolderUrl === 'string' && rootFolderUrl.trim() !== '',
      },
    });

    // EventLog
    await prisma.eventLog.create({
      data: {
        storeId,
        actorType:  'admin',
        eventType:  'upload_destination_configured',
        targetType: 'store',
        targetId:   storeId,
        phase:      store.currentPhase,
        metaJson:   JSON.stringify({ provider: updated.provider, isConfigured: updated.isConfigured }),
      },
    });

    return ok(updated);
  } catch {
    return err('保存先設定の更新に失敗しました', 500);
  }
}
