import { prisma } from '@/lib/prisma';
import { ok, err } from '@/lib/api';

type Ctx = { params: Promise<{ storeId: string }> };

// GET /api/stores/[storeId]/snapshots — スナップショット一覧
export async function GET(_req: Request, { params }: Ctx) {
  const { storeId } = await params;
  try {
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return err('店舗が見つかりません', 404);

    const snapshots = await prisma.flowSnapshot.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, phase: true, note: true, createdAt: true },
    });

    return ok(snapshots);
  } catch {
    return err('スナップショット一覧の取得に失敗しました', 500);
  }
}

// POST /api/stores/[storeId]/snapshots — スナップショット作成
// フェーズ変更時などに現在の状態を記録する
export async function POST(request: Request, { params }: Ctx) {
  const { storeId } = await params;
  try {
    const body = await request.json();
    const { note } = body;

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: { tasks: { orderBy: { order: 'asc' } } },
    });
    if (!store) return err('店舗が見つかりません', 404);

    // 現在の store + tasks を JSON として保存
    const snapshotData = JSON.stringify({
      id: store.id,
      name: store.name,
      category: store.category,
      currentPhase: store.currentPhase,
      startDate: store.startDate,
      deadline: store.deadline,
      memo: store.memo,
      tasks: store.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        done: t.done,
        phase: t.phase,
        order: t.order,
      })),
    });

    const snapshot = await prisma.flowSnapshot.create({
      data: {
        storeId,
        phase: store.currentPhase,
        data: snapshotData,
        note: typeof note === 'string' ? note.trim() : '',
      },
    });

    return ok({ id: snapshot.id, phase: snapshot.phase, note: snapshot.note, createdAt: snapshot.createdAt }, 201);
  } catch {
    return err('スナップショットの作成に失敗しました', 500);
  }
}
