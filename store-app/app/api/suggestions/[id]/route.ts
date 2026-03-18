import { prisma } from '@/lib/prisma';
import { ok, err } from '@/lib/api';

type Ctx = { params: Promise<{ id: string }> };

const VALID_STATUSES = ['active', 'dismissed', 'done'] as const;

// PATCH /api/suggestions/[id] — ステータス更新（dismiss / done）
export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { status } = body;

    if (!(VALID_STATUSES as readonly string[]).includes(status)) {
      return err('status は active / dismissed / done のいずれかを指定してください');
    }

    const existing = await prisma.suggestion.findUnique({ where: { id } });
    if (!existing) return err('提案が見つかりません', 404);

    const updated = await prisma.suggestion.update({
      where: { id },
      data: { status },
    });

    return ok(updated);
  } catch {
    return err('提案の更新に失敗しました', 500);
  }
}
