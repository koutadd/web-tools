import { prisma } from '@/lib/prisma';
import { ok, err } from '@/lib/api';

// 保存対象の意味のあるイベント種別（過剰なログは取らない）
const VALID_EVENT_TYPES = [
  'screen_viewed',
  'suggestion_viewed',
  'required_item_opened',
  'required_item_started',
  'required_item_submitted',
  'required_item_approved',
  'required_item_rejected',
  'consultation_opened',
  'consultation_created',
  'consultation_resolved',
  'who_waiting_changed',
  'deadline_overdue',
  'upload_destination_checked',
  'upload_destination_configured',
  'task_completed',
  'photo_guide_viewed',
] as const;

const VALID_ACTOR_TYPES = ['owner', 'admin', 'system'] as const;

// POST /api/event-logs — イベントログ記録
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      storeId, actorType, actorName,
      eventType, targetType, targetId, phase, metaJson,
    } = body;

    if (!storeId || typeof storeId !== 'string') {
      return err('storeId は必須です');
    }
    if (!(VALID_ACTOR_TYPES as readonly string[]).includes(actorType)) {
      return err('actorType は owner / admin / system のいずれかを指定してください');
    }
    if (!(VALID_EVENT_TYPES as readonly string[]).includes(eventType)) {
      return err(`eventType が不正です: ${eventType}`);
    }

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return err('店舗が見つかりません', 404);

    const log = await prisma.eventLog.create({
      data: {
        storeId,
        actorType,
        actorName:  typeof actorName  === 'string' ? actorName.trim() : '',
        eventType,
        targetType: typeof targetType === 'string' ? targetType       : '',
        targetId:   typeof targetId   === 'string' ? targetId         : '',
        phase:      typeof phase      === 'string' ? phase            : store.currentPhase,
        metaJson:   typeof metaJson   === 'string' ? metaJson         : '{}',
      },
    });

    return ok(log, 201);
  } catch {
    return err('イベントログの記録に失敗しました', 500);
  }
}
