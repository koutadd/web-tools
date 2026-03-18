import { prisma } from '@/lib/prisma';
import { ok, err } from '@/lib/api';

// POST /api/submissions — 提出データ登録（オーナー側）
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { requiredItemId, textValue, fileUrl, fileName } = body;

    if (!requiredItemId || typeof requiredItemId !== 'string') {
      return err('requiredItemId は必須です');
    }
    if (
      (!textValue || textValue.trim() === '') &&
      (!fileUrl   || fileUrl.trim()   === '')
    ) {
      return err('テキストまたはファイルURLのいずれかは必須です');
    }

    const item = await prisma.requiredItem.findUnique({ where: { id: requiredItemId } });
    if (!item) return err('必要項目が見つかりません', 404);

    const submission = await prisma.submission.create({
      data: {
        requiredItemId,
        textValue: typeof textValue === 'string' ? textValue.trim() : '',
        fileUrl:   typeof fileUrl   === 'string' ? fileUrl.trim()   : '',
        fileName:  typeof fileName  === 'string' ? fileName.trim()  : '',
      },
    });

    // 提出後: required_item の status を 'submitted' + whoWaiting を 'admin' へ
    const prevStatus     = item.status;
    const prevWhoWaiting = item.whoWaiting;
    await prisma.requiredItem.update({
      where: { id: requiredItemId },
      data: { status: 'submitted', whoWaiting: 'admin' },
    });

    // EventLog: 提出イベント
    await prisma.eventLog.create({
      data: {
        storeId:    item.storeId,
        actorType:  'owner',
        eventType:  'required_item_submitted',
        targetType: 'required_item',
        targetId:   item.id,
        phase:      item.requiredPhase,
        metaJson:   JSON.stringify({
          prevStatus,
          prevWhoWaiting,
          hasFile: !!fileUrl,
          hasText: !!textValue,
        }),
      },
    });

    // whoWaiting が変わった場合は変更ログも記録
    if (prevWhoWaiting !== 'admin') {
      await prisma.eventLog.create({
        data: {
          storeId:    item.storeId,
          actorType:  'system',
          eventType:  'who_waiting_changed',
          targetType: 'required_item',
          targetId:   item.id,
          phase:      item.requiredPhase,
          metaJson:   JSON.stringify({ from: prevWhoWaiting, to: 'admin' }),
        },
      });
    }

    // NotificationEvent 積む
    await prisma.notificationEvent.create({
      data: {
        storeId:     item.storeId,
        eventType:   'required_item_submitted',
        payloadJson: JSON.stringify({
          requiredItemId: item.id,
          label:          item.label,
          submissionId:   submission.id,
        }),
        targetType: 'required_item',
        targetId:   item.id,
      },
    });

    return ok(submission, 201);
  } catch {
    return err('提出データの作成に失敗しました', 500);
  }
}
