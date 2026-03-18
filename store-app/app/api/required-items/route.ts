import { prisma } from '@/lib/prisma';
import { ok, err } from '@/lib/api';

const VALID_CATEGORIES   = ['photo', 'logo', 'document', 'access', 'sns', 'other'] as const;
const VALID_PHASES       = ['企画', 'デザイン', '制作', '納品'] as const;
const VALID_ASSIGNEE_TYPES = ['owner', 'admin', 'system'] as const;

// POST /api/required-items — 必要項目作成（管理側）
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      storeId, category, label, description,
      requiredPhase, assigneeType, assigneeName,
      ownerResponsibleName, adminResponsibleName,
      dueLabel, reason, sortOrder,
      isPhotoRequired, guideTitle, guideDescription,
      guideChecklistJson, guideExampleImageKey,
    } = body;

    if (!storeId || typeof storeId !== 'string') {
      return err('店舗IDは必須です');
    }
    if (!(VALID_CATEGORIES as readonly string[]).includes(category)) {
      return err('カテゴリは photo / logo / document / access / sns / other のいずれかを指定してください');
    }
    if (!label || typeof label !== 'string' || label.trim() === '') {
      return err('項目名は必須です');
    }
    if (!(VALID_PHASES as readonly string[]).includes(requiredPhase)) {
      return err('requiredPhase は 企画 / デザイン / 制作 / 納品 のいずれかを指定してください');
    }
    if (assigneeType !== undefined && !(VALID_ASSIGNEE_TYPES as readonly string[]).includes(assigneeType)) {
      return err('assigneeType は owner / admin / system のいずれかを指定してください');
    }

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return err('店舗が見つかりません', 404);

    const item = await prisma.requiredItem.create({
      data: {
        storeId,
        category,
        label: label.trim(),
        description:          typeof description          === 'string' ? description.trim()          : '',
        requiredPhase,
        assigneeType:         typeof assigneeType         === 'string' ? assigneeType                : 'owner',
        assigneeName:         typeof assigneeName         === 'string' ? assigneeName.trim()         : '',
        ownerResponsibleName: typeof ownerResponsibleName === 'string' ? ownerResponsibleName.trim() : '',
        adminResponsibleName: typeof adminResponsibleName === 'string' ? adminResponsibleName.trim() : '',
        dueLabel:             typeof dueLabel             === 'string' ? dueLabel.trim()             : '',
        reason:               typeof reason               === 'string' ? reason.trim()               : '',
        sortOrder:            typeof sortOrder            === 'number' ? sortOrder                   : 0,
        isPhotoRequired:      typeof isPhotoRequired      === 'boolean' ? isPhotoRequired            : false,
        guideTitle:           typeof guideTitle           === 'string' ? guideTitle.trim()           : '',
        guideDescription:     typeof guideDescription     === 'string' ? guideDescription.trim()     : '',
        guideChecklistJson:   typeof guideChecklistJson   === 'string' ? guideChecklistJson          : '[]',
        guideExampleImageKey: typeof guideExampleImageKey === 'string' ? guideExampleImageKey.trim() : '',
      },
    });

    return ok(item, 201);
  } catch {
    return err('必要項目の作成に失敗しました', 500);
  }
}
