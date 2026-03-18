import { prisma } from '@/lib/prisma';
import { ok, err } from '@/lib/api';

type Ctx = { params: Promise<{ id: string }> };

const VALID_STATUSES = ['open', 'answered', 'closed'] as const;

// GET /api/consultations/[id]
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  try {
    const c = await prisma.consultation.findUnique({ where: { id } });
    if (!c) return err('相談が見つかりません', 404);
    return ok(c);
  } catch {
    return err('相談の取得に失敗しました', 500);
  }
}

// PATCH /api/consultations/[id] — 回答・ステータス更新
export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { answer, status } = body;

    if (answer !== undefined && typeof answer !== 'string') {
      return err('回答は文字列で指定してください');
    }
    if (status !== undefined && !(VALID_STATUSES as readonly string[]).includes(status)) {
      return err('ステータスは open / answered / closed のいずれかを指定してください');
    }

    const existing = await prisma.consultation.findUnique({ where: { id } });
    if (!existing) return err('相談が見つかりません', 404);

    const updated = await prisma.consultation.update({
      where: { id },
      data: {
        ...(answer !== undefined && { answer: answer.trim() }),
        ...(status !== undefined && { status }),
        // answered / closed の時点で resolvedAt を記録（未設定時のみ）
        ...(status !== undefined &&
          ['answered', 'closed'].includes(status) &&
          !existing.resolvedAt && { resolvedAt: new Date() }),
      },
    });

    // 回答時に通知イベントを積む
    if (status === 'answered') {
      const store = await prisma.store.findUnique({ where: { id: updated.storeId } });
      if (store) {
        await prisma.notificationEvent.create({
          data: {
            storeId:     updated.storeId,
            eventType:   'consultation_answered',
            payloadJson: JSON.stringify({
              consultationId: updated.id,
              storeName:      store.name,
              title:          updated.title,
              answer:         updated.answer,
            }),
            targetType: 'consultation',
            targetId:   updated.id,
          },
        });
      }
    }

    return ok(updated);
  } catch {
    return err('相談の更新に失敗しました', 500);
  }
}
