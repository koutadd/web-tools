import { prisma } from '@/lib/prisma';
import { ok, err } from '@/lib/api';

type Ctx = { params: Promise<{ id: string }> };

const VALID_STATUSES = ['pending', 'approved', 'rejected'] as const;

// PATCH /api/submissions/[id] — 承認 / 却下（管理側）
export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { status, rejectedReason } = body;

    if (!(VALID_STATUSES as readonly string[]).includes(status)) {
      return err('ステータスは pending / approved / rejected のいずれかを指定してください');
    }
    if (status === 'rejected' && (!rejectedReason || typeof rejectedReason !== 'string' || rejectedReason.trim() === '')) {
      return err('却下理由（rejectedReason）は却下時に必須です');
    }

    const existing = await prisma.submission.findUnique({
      where: { id },
      include: { requiredItem: true },
    });
    if (!existing) return err('提出データが見つかりません', 404);

    const updated = await prisma.submission.update({
      where: { id },
      data: {
        status,
        rejectedReason: status === 'rejected' ? String(rejectedReason).trim() : '',
        checkedAt:      new Date(),
      },
    });

    const item = existing.requiredItem;

    // 承認 → required_item を approved + whoWaiting=none
    // 却下 → required_item を rejected + whoWaiting=owner（再提出待ち）
    if (status === 'approved') {
      await prisma.requiredItem.update({
        where: { id: item.id },
        data: { status: 'approved', whoWaiting: 'none' },
      });
    } else if (status === 'rejected') {
      await prisma.requiredItem.update({
        where: { id: item.id },
        data: { status: 'rejected', whoWaiting: 'owner' },
      });
    }

    // EventLog
    const eventType = status === 'approved' ? 'required_item_approved' : 'required_item_rejected';
    await prisma.eventLog.create({
      data: {
        storeId:    item.storeId,
        actorType:  'admin',
        eventType,
        targetType: 'required_item',
        targetId:   item.id,
        phase:      item.requiredPhase,
        metaJson:   JSON.stringify({
          submissionId:   id,
          rejectedReason: status === 'rejected' ? rejectedReason : null,
        }),
      },
    });

    // NotificationEvent
    await prisma.notificationEvent.create({
      data: {
        storeId:     item.storeId,
        eventType,
        payloadJson: JSON.stringify({
          requiredItemId: item.id,
          label:          item.label,
          submissionId:   id,
          rejectedReason: status === 'rejected' ? rejectedReason : null,
        }),
        targetType: 'required_item',
        targetId:   item.id,
      },
    });

    return ok(updated);
  } catch {
    return err('提出データの更新に失敗しました', 500);
  }
}
