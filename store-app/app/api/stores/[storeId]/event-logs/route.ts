import { prisma } from '@/lib/prisma';
import { ok, err } from '@/lib/api';

type Ctx = { params: Promise<{ storeId: string }> };

// POST /api/stores/[storeId]/event-logs
export async function POST(request: Request, { params }: Ctx) {
  const { storeId } = await params;
  try {
    const body = await request.json() as {
      eventType:  string;
      actorType?: string;
      actorName?: string;
      targetType?: string;
      targetId?:  string;
      phase?:     string;
      metaJson?:  string;
    };
    if (!body.eventType) return err('eventType は必須です', 400);

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return err('店舗が見つかりません', 404);

    const log = await prisma.eventLog.create({
      data: {
        storeId,
        eventType:  body.eventType,
        actorType:  body.actorType  ?? 'owner',
        actorName:  body.actorName  ?? '',
        targetType: body.targetType ?? '',
        targetId:   body.targetId   ?? '',
        phase:      body.phase      ?? store.currentPhase,
        metaJson:   body.metaJson   ?? '{}',
      },
    });
    return ok(log);
  } catch {
    return err('イベントログの作成に失敗しました', 500);
  }
}

// GET /api/stores/[storeId]/event-logs?eventType=xxx&actorType=owner&limit=50
export async function GET(request: Request, { params }: Ctx) {
  const { storeId } = await params;
  const { searchParams } = new URL(request.url);
  const eventType = searchParams.get('eventType');
  const actorType = searchParams.get('actorType');
  const limitRaw  = searchParams.get('limit');
  const limit     = limitRaw ? Math.min(Number(limitRaw), 200) : 50;

  try {
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return err('店舗が見つかりません', 404);

    const logs = await prisma.eventLog.findMany({
      where: {
        storeId,
        ...(eventType ? { eventType } : {}),
        ...(actorType ? { actorType } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take:    limit,
    });

    return ok(logs);
  } catch {
    return err('イベントログの取得に失敗しました', 500);
  }
}
