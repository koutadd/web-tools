/**
 * POST /api/review-auth
 *
 * リクエスト body: { passcode: string }
 * 成功: 200 + Set-Cookie: review_access={passcode}; HttpOnly; Path=/; SameSite=Lax
 * 失敗: 401 + { error: string }
 */

import { type NextRequest } from 'next/server';

const COOKIE_NAME = 'review_access';

export async function POST(req: NextRequest) {
  const passcode = process.env.REVIEW_PASSCODE?.trim();
  if (!passcode) {
    // 環境変数未設定時はそもそも保護なし → 成功扱い
    return Response.json({ ok: true });
  }

  let body: { passcode?: string } = {};
  try {
    body = (await req.json()) as { passcode?: string };
  } catch {
    return Response.json({ error: 'リクエストが不正です' }, { status: 400 });
  }

  if (!body.passcode || body.passcode !== passcode) {
    return Response.json(
      { error: 'パスコードが違います。確認してもう一度お試しください。' },
      { status: 401 },
    );
  }

  // Cookie を発行（HttpOnly で JS から読めないようにする）
  const res = Response.json({ ok: true });
  const cookieOptions = [
    `${COOKIE_NAME}=${passcode}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    // 本番 HTTPS 環境では Secure を付与
    ...(process.env.NODE_ENV === 'production' ? ['Secure'] : []),
    // 7日間有効
    'Max-Age=604800',
  ].join('; ');

  const headers = new Headers(res.headers);
  headers.set('Set-Cookie', cookieOptions);

  return new Response(res.body, { status: 200, headers });
}
