/**
 * GET  /api/consultations/[id]/messages — メッセージ一覧
 * POST /api/consultations/[id]/messages — メッセージ送信
 *
 * POST body: { text: string, userType: 'owner'|'admin', authorName?: string }
 *
 * POST 時にサイドエフェクト（失敗しても本体は成功扱い）:
 *   - Slack Webhook 通知（SLACK_WEBHOOK_URL 設定時）
 *   - Google Sheets ログ追記（GOOGLE_SHEETS_CHAT_LOG_ID 設定時）
 */

import { prisma }       from '@/lib/prisma';
import { notifySlack }  from '@/lib/slack';
import { appendChatLog } from '@/lib/sheets';

type Ctx = { params: Promise<{ id: string }> };

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;

  const messages = await prisma.consultationMessage.findMany({
    where: { consultationId: id },
    orderBy: { createdAt: 'asc' },
  });

  return Response.json(messages);
}

// ─── POST ────────────────────────────────────────────────────────────────────

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;

  const consultation = await prisma.consultation.findUnique({
    where: { id },
    include: { store: { select: { name: true } } },
  });
  if (!consultation) {
    return Response.json({ error: 'スレッドが見つかりません' }, { status: 404 });
  }

  let body: { text?: string; userType?: string; authorName?: string } = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'リクエストが不正です' }, { status: 400 });
  }

  const text = body.text?.trim();
  if (!text) {
    return Response.json({ error: 'メッセージを入力してください' }, { status: 400 });
  }

  const userType   = body.userType   ?? 'owner';
  const authorName = body.authorName ?? '';

  const message = await prisma.consultationMessage.create({
    data: { consultationId: id, text, userType, authorName },
  });

  // ステータス更新（管理者返信 → answered / オーナー再質問 → open）
  if (userType === 'admin' && consultation.status === 'open') {
    await prisma.consultation.update({
      where: { id },
      data: { status: 'answered', answer: text, resolvedAt: new Date() },
    });
  } else if (userType === 'owner' && consultation.status === 'answered') {
    await prisma.consultation.update({ where: { id }, data: { status: 'open' } });
  }

  // サイドエフェクト（失敗しても本体には影響させない）
  const storeName = consultation.store.name;
  notifySlack(storeName, userType, authorName, text).catch(() => {});
  appendChatLog(storeName, userType, authorName, text).catch(() => {});

  return Response.json(message, { status: 201 });
}
