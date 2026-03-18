import { prisma } from '@/lib/prisma';
import { ok, err } from '@/lib/api';

const VALID_TARGET_TYPES          = ['required_item', 'task', 'general'] as const;
const VALID_CREATED_BY            = ['owner', 'admin'] as const;
const VALID_CONSULTATION_CATEGORIES = ['photo', 'design', 'schedule', 'cost', 'other'] as const;

// POST /api/consultations — 相談作成
// 項目単位（targetType + targetId）で相談を紐づけられる
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { storeId, title, message, targetType, targetId, createdBy, consultationCategory } = body;

    if (!storeId || typeof storeId !== 'string') {
      return err('店舗IDは必須です');
    }
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return err('タイトルは必須です');
    }
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return err('相談内容は必須です');
    }
    if (
      targetType !== undefined &&
      !(VALID_TARGET_TYPES as readonly string[]).includes(targetType)
    ) {
      return err('targetType は required_item / task / general のいずれかを指定してください');
    }
    if (
      createdBy !== undefined &&
      !(VALID_CREATED_BY as readonly string[]).includes(createdBy)
    ) {
      return err('createdBy は owner / admin のいずれかを指定してください');
    }
    if (
      consultationCategory !== undefined &&
      !(VALID_CONSULTATION_CATEGORIES as readonly string[]).includes(consultationCategory)
    ) {
      return err('consultationCategory は photo / design / schedule / cost / other のいずれかを指定してください');
    }

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return err('店舗が見つかりません', 404);

    const consultation = await prisma.consultation.create({
      data: {
        storeId,
        title:      title.trim(),
        message:    message.trim(),
        targetType:           typeof targetType           === 'string' ? targetType           : 'general',
        targetId:             typeof targetId             === 'string' ? targetId             : '',
        createdBy:            typeof createdBy            === 'string' ? createdBy            : 'owner',
        consultationCategory: typeof consultationCategory === 'string' ? consultationCategory : '',
      },
    });

    // 通知イベントを積む（Slack連携の準備）
    await prisma.notificationEvent.create({
      data: {
        storeId,
        eventType:   'consultation_created',
        payloadJson: JSON.stringify({
          consultationId: consultation.id,
          storeName:      store.name,
          title:          consultation.title,
          createdBy:      consultation.createdBy,
        }),
        targetType: 'consultation',
        targetId:   consultation.id,
      },
    });

    return ok(consultation, 201);
  } catch {
    return err('相談の作成に失敗しました', 500);
  }
}
