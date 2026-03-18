/**
 * POST /api/review-logout
 *
 * review_access Cookie を削除してログアウトする。
 */

export async function POST() {
  const headers = new Headers();
  headers.set(
    'Set-Cookie',
    'review_access=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
  );
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers,
  });
}
