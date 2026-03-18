/**
 * レビュー用パスコード保護 Middleware
 *
 * 保護対象: /, /stores/*, /owner/*
 * 除外:    /review-login, /api/*, /_next/*, favicon.ico, etc.
 *
 * Cookie: review_access
 *   値 = REVIEW_PASSCODE 環境変数と一致するかチェック
 *   未設定時（REVIEW_PASSCODE が空）は保護を完全スキップ
 */

import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'review_access';

/** 保護するパスのプレフィックス一覧 */
const PROTECTED_PREFIXES = ['/', '/stores', '/owner'];

/** 保護スキップするパスのプレフィックス一覧 */
const PUBLIC_PREFIXES = [
  '/review-login',
  '/api/',
  '/_next/',
  '/favicon.ico',
];

function isProtected(pathname: string): boolean {
  // Public パスは除外
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return false;
  // 保護対象パスに一致するか
  return PROTECTED_PREFIXES.some((p) =>
    p === '/' ? pathname === '/' : pathname.startsWith(p),
  );
}

export function middleware(req: NextRequest) {
  const passcode = process.env.REVIEW_PASSCODE?.trim();

  // REVIEW_PASSCODE 未設定の場合は保護なし（ローカル開発等）
  if (!passcode) return NextResponse.next();

  if (!isProtected(req.nextUrl.pathname)) return NextResponse.next();

  const cookie = req.cookies.get(COOKIE_NAME);
  if (cookie?.value === passcode) return NextResponse.next();

  // 未認証 → /review-login へリダイレクト
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = '/review-login';
  loginUrl.searchParams.set('from', req.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /*
     * / と /stores/* と /owner/* にのみ適用。
     * /_next/static, /_next/image, /api/* は除外。
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
