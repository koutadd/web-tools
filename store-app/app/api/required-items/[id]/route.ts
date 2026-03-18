import { prisma } from '@/lib/prisma';
import { ok, err } from '@/lib/api';

type Ctx = { params: Promise<{ id: string }> };

const VALID_STATUSES       = ['pending', 'submitted', 'approved', 'rejected'] as const;
const VALID_WHO_WAITING    = ['owner', 'admin', 'system', 'none'] as const;
const VALID_ASSIGNEE_TYPES = ['owner', 'admin', 'system'] as const;

// PATCH /api/required-items/[id]
export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  try {
    const body = await request.json();
    const {
      label, description, assigneeType, assigneeName,
      ownerResponsibleName, adminResponsibleName,
      whoWaiting, dueLabel, reason, sortOrder, status,
      isPhotoRequired, guideTitle, guideDescription,
      guideChecklistJson, guideExampleImageKey,
    } = body;

    if (status !== undefined && !(VALID_STATUSES as readonly string[]).includes(status)) {
      return err('ステータスは pending / submitted / approved / rejected のいずれかを指定してください');
    }
    if (whoWaiting !== undefined && !(VALID_WHO_WAITING as readonly string[]).includes(whoWaiting)) {
      return err('whoWaiting は owner / admin / system / none のいずれかを指定してください');
    }
    if (assigneeType !== undefined && !(VALID_ASSIGNEE_TYPES as readonly string[]).includes(assigneeType)) {
      return err('assigneeType は owner / admin / system のいずれかを指定してください');
    }

    const existing = await prisma.requiredItem.findUnique({ where: { id } });
    if (!existing) return err('必要項目が見つかりません', 404);

    const prevWhoWaiting = existing.whoWaiting;

    const updated = await prisma.requiredItem.update({
      where: { id },
      data: {
        ...(label                !== undefined && { label:                String(label).trim() }),
        ...(description         !== undefined && { description:          String(description).trim() }),
        ...(assigneeType        !== undefined && { assigneeType }),
        ...(assigneeName        !== undefined && { assigneeName:         String(assigneeName).trim() }),
        ...(ownerResponsibleName !== undefined && { ownerResponsibleName: String(ownerResponsibleName).trim() }),
        ...(adminResponsibleName !== undefined && { adminResponsibleName: String(adminResponsibleName).trim() }),
        ...(whoWaiting          !== undefined && { whoWaiting }),
        ...(dueLabel            !== undefined && { dueLabel:             String(dueLabel).trim() }),
        ...(reason              !== undefined && { reason:               String(reason).trim() }),
        ...(sortOrder           !== undefined && { sortOrder:            Number(sortOrder) }),
        ...(status              !== undefined && { status }),
        ...(isPhotoRequired     !== undefined && { isPhotoRequired:      Boolean(isPhotoRequired) }),
        ...(guideTitle          !== undefined && { guideTitle:           String(guideTitle).trim() }),
        ...(guideDescription    !== undefined && { guideDescription:     String(guideDescription).trim() }),
        ...(guideChecklistJson  !== undefined && { guideChecklistJson:   String(guideChecklistJson) }),
        ...(guideExampleImageKey !== undefined && { guideExampleImageKey: String(guideExampleImageKey).trim() }),
      },
    });

    // whoWaiting 変更時に EventLog を記録
    if (whoWaiting !== undefined && whoWaiting !== prevWhoWaiting) {
      await prisma.eventLog.create({
        data: {
          storeId:    updated.storeId,
          actorType:  'system',
          eventType:  'who_waiting_changed',
          targetType: 'required_item',
          targetId:   updated.id,
          phase:      updated.requiredPhase,
          metaJson:   JSON.stringify({ from: prevWhoWaiting, to: whoWaiting }),
        },
      });
    }

    return ok(updated);
  } catch {
    return err('必要項目の更新に失敗しました', 500);
  }
}

// DELETE /api/required-items/[id]
export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  try {
    const existing = await prisma.requiredItem.findUnique({ where: { id } });
    if (!existing) return err('必要項目が見つかりません', 404);
    await prisma.requiredItem.delete({ where: { id } });
    return ok({ message: '必要項目を削除しました' });
  } catch {
    return err('必要項目の削除に失敗しました', 500);
  }
}
