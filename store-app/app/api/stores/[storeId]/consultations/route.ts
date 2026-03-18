import { prisma }       from '@/lib/prisma';
import { ok, err }      from '@/lib/api';
import { notifySlack }  from '@/lib/slack';
import { appendChatLog } from '@/lib/sheets';

type Ctx = { params: Promise<{ storeId: string }> };

// GET /api/stores/[storeId]/consultations — 相談一覧
export async function GET(_req: Request, { params }: Ctx) {
  const { storeId } = await params;
  try {
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return err('店舗が見つかりません', 404);

    const consultations = await prisma.consultation.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
    });

    return ok(consultations);
  } catch {
    return err('相談一覧の取得に失敗しました', 500);
  }
}

// POST /api/stores/[storeId]/consultations — 相談作成
export async function POST(req: Request, { params }: Ctx) {
  const { storeId } = await params;
  try {
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return err('店舗が見つかりません', 404);

    const body = await req.json();
    const { title, message, createdBy, targetType, targetId, consultationCategory } = body;

    if (!title || typeof title !== 'string') {
      return err('タイトルは必須です');
    }
    if (!message || typeof message !== 'string') {
      return err('メッセージは必須です');
    }

    const text        = String(message).trim();
    const authorName  = String(body.authorName ?? '').trim();
    const createdByFinal = createdBy ?? 'owner';

    const consultation = await prisma.consultation.create({
      data: {
        storeId,
        title: String(title).trim(),
        message: text,
        createdBy: createdByFinal,
        targetType: targetType ?? 'general',
        targetId: targetId ?? '',
        consultationCategory: consultationCategory ?? '',
      },
    });

    // 初回メッセージを ConsultationMessage にも記録（チャット UI 用）
    await prisma.consultationMessage.create({
      data: {
        consultationId: consultation.id,
        text,
        userType:   createdByFinal,
        authorName,
      },
    });

    // サイドエフェクト
    notifySlack(store.name, createdByFinal, authorName, text).catch(() => {});
    appendChatLog(store.name, createdByFinal, authorName, text).catch(() => {});

    return ok(consultation, 201);
  } catch {
    return err('相談の作成に失敗しました', 500);
  }
}
