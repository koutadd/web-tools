import { prisma } from '@/lib/prisma';
import { ok, err, isValidPhase } from '@/lib/api';

type Ctx = { params: Promise<{ storeId: string }> };

// GET /api/stores/[storeId] — 店舗詳細（タスク全件含む）
export async function GET(_req: Request, { params }: Ctx) {
  const { storeId } = await params;

  try {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        tasks: { orderBy: { order: 'asc' } },
      },
    });

    if (!store) return err('店舗が見つかりません', 404);
    return ok(store);
  } catch {
    return err('店舗の取得に失敗しました', 500);
  }
}

// PATCH /api/stores/[storeId] — 店舗情報更新（フェーズ変更含む）
export async function PATCH(request: Request, { params }: Ctx) {
  const { storeId } = await params;

  try {
    const body = await request.json();
    const { name, category, currentPhase, startDate, deadline, memo } = body;

    // 各フィールドは省略可能（PATCHなので）
    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      return err('店舗名が空です');
    }
    if (category !== undefined && (typeof category !== 'string' || category.trim() === '')) {
      return err('業種が空です');
    }
    if (currentPhase !== undefined && !isValidPhase(currentPhase)) {
      return err('フェーズの値が正しくありません（企画・デザイン・制作・納品のいずれかを指定）');
    }

    const existing = await prisma.store.findUnique({ where: { id: storeId } });
    if (!existing) return err('店舗が見つかりません', 404);

    const updated = await prisma.store.update({
      where: { id: storeId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(category !== undefined && { category: category.trim() }),
        ...(currentPhase !== undefined && { currentPhase }),
        ...(startDate !== undefined && { startDate }),
        ...(deadline !== undefined && { deadline }),
        ...(memo !== undefined && { memo: typeof memo === 'string' ? memo.trim() : '' }),
      },
      include: {
        tasks: { orderBy: { order: 'asc' } },
      },
    });

    return ok(updated);
  } catch {
    return err('店舗の更新に失敗しました', 500);
  }
}

// DELETE /api/stores/[storeId] — 店舗削除（タスクはカスケード削除）
export async function DELETE(_req: Request, { params }: Ctx) {
  const { storeId } = await params;

  try {
    const existing = await prisma.store.findUnique({ where: { id: storeId } });
    if (!existing) return err('店舗が見つかりません', 404);

    await prisma.store.delete({ where: { id: storeId } });
    return ok({ message: '店舗を削除しました' });
  } catch {
    return err('店舗の削除に失敗しました', 500);
  }
}
