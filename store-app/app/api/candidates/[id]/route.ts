import { prisma } from '@/lib/prisma';
import { ok, err } from '@/lib/api';

type Ctx = { params: Promise<{ id: string }> };

const VALID_STATUSES = ['pending', 'selected', 'rejected'] as const;

// PATCH /api/candidates/[id] — スコア・ステータス・各フィールド更新
export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { score, status, name, url, summary, pros, cons, price, contact } = body;

    if (score !== undefined && (typeof score !== 'number' || score < 0 || score > 100)) {
      return err('スコアは0〜100の数値で指定してください');
    }
    if (status !== undefined && !(VALID_STATUSES as readonly string[]).includes(status)) {
      return err('ステータスは pending / selected / rejected のいずれかを指定してください');
    }

    const existing = await prisma.candidate.findUnique({ where: { id } });
    if (!existing) return err('候補が見つかりません', 404);

    const updated = await prisma.candidate.update({
      where: { id },
      data: {
        ...(score   !== undefined && { score }),
        ...(status  !== undefined && { status }),
        ...(name    !== undefined && { name:    String(name).trim() }),
        ...(url     !== undefined && { url:     String(url).trim() }),
        ...(summary !== undefined && { summary: String(summary).trim() }),
        ...(pros    !== undefined && { pros:    String(pros).trim() }),
        ...(cons    !== undefined && { cons:    String(cons).trim() }),
        ...(price   !== undefined && { price:   String(price).trim() }),
        ...(contact !== undefined && { contact: String(contact).trim() }),
      },
    });

    return ok(updated);
  } catch {
    return err('候補の更新に失敗しました', 500);
  }
}

// DELETE /api/candidates/[id]
export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  try {
    const existing = await prisma.candidate.findUnique({ where: { id } });
    if (!existing) return err('候補が見つかりません', 404);
    await prisma.candidate.delete({ where: { id } });
    return ok({ message: '候補を削除しました' });
  } catch {
    return err('候補の削除に失敗しました', 500);
  }
}
