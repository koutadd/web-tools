// server.js — Web Tools local dev server
// Serves static files, /api/diagnosis, and /api/lp-analyze (Playwright + Claude vision)
//
// Usage:
//   ANTHROPIC_API_KEY=sk-... node server.js
//   PORT=8080 ANTHROPIC_API_KEY=... node server.js   (default port: 3000)
//
// First run: npx playwright install chromium

import http  from 'node:http';
import https from 'node:https';
import fs    from 'node:fs';
import path  from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const client    = new Anthropic(); // reads ANTHROPIC_API_KEY from env

// ── Simple password auth ──────────────────────────────────────────
const AUTH_PASSWORD = process.env.AUTH_PASSWORD || '';
// token = base64(password) — stateless, no DB needed
const AUTH_TOKEN = AUTH_PASSWORD
  ? Buffer.from('aicare:' + AUTH_PASSWORD).toString('base64')
  : '';

function parseCookies(str = '') {
  return Object.fromEntries(
    str.split(';').map(c => {
      const i = c.indexOf('=');
      return i < 0 ? [c.trim(), ''] : [c.slice(0, i).trim(), c.slice(i + 1).trim()];
    })
  );
}

function isAuth(req) {
  if (!AUTH_PASSWORD) return true;
  return parseCookies(req.headers.cookie).auth_token === AUTH_TOKEN;
}

const LOGIN_HTML = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>アイケアラボ — ログイン</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{min-height:100vh;display:flex;align-items:center;justify-content:center;
  background:#f0f5ff;font-family:'Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif}
.card{background:#fff;border-radius:18px;padding:44px 40px;width:340px;
  box-shadow:0 6px 32px rgba(0,0,0,.12)}
h1{font-size:1.25rem;font-weight:800;margin-bottom:28px;color:#1a1a2e;letter-spacing:.02em}
label{font-size:0.78rem;font-weight:600;color:#555;display:block;margin-bottom:6px}
input{width:100%;padding:11px 14px;border:1.5px solid #ccc;border-radius:9px;
  font-size:1rem;margin-bottom:22px;transition:border-color .15s}
input:focus{outline:none;border-color:#1a4fa8}
button{width:100%;padding:13px;background:#1a4fa8;color:#fff;border:none;
  border-radius:9px;font-size:1rem;font-weight:700;cursor:pointer;letter-spacing:.04em}
button:hover{background:#153d85}
.err{color:#e53935;font-size:0.8rem;margin-top:14px;text-align:center}
</style>
</head>
<body>
<div class="card">
  <h1>アイケアラボ</h1>
  <form method="POST" action="/login">
    <label>パスワード</label>
    <input type="password" name="password" autofocus placeholder="パスワードを入力">
    <button type="submit">ログイン</button>
    __ERR__
  </form>
</div>
</body>
</html>`;

// ── In-memory stores ─────────────────────────────────────────────
const store   = new Map();  // site-diagnosis results
const lpStore = new Map();  // lp-analyze results

// ── Label maps (site-diagnosis) ──────────────────────────────────
const INDUSTRY = {
  restaurant:  '飲食・カフェ',
  beauty:      '美容・ヘルスケア',
  medical:     '医療・クリニック',
  retail:      '小売・EC',
  service:     '士業・コンサルティング',
  education:   '教育・スクール',
  realestate:  '不動産',
  other:       'その他',
};
const GOAL = {
  reservation: '予約・申込を増やす',
  inquiry:     '問い合わせ・リードを増やす',
  recognition: 'ブランド認知・信頼性の向上',
};
const PROBLEM = {
  low_conversions: 'コンバージョンが低い',
  unclear_message: 'メッセージが伝わりにくい',
  weak_trust:      '信頼性のアピールが弱い',
  poor_design:     'デザインが古い・見づらい',
};

// ── Static file MIME types ───────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.woff2':'font/woff2',
};

// ── Site-diagnosis helpers ───────────────────────────────────────
async function fetchSiteSnippet(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SiteDiagnosis/1.0)' },
      signal: AbortSignal.timeout(8000),
    });
    const html = await res.text();
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? '';
    const descMatch =
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{1,200})["']/i) ??
      html.match(/<meta[^>]+content=["']([^"']{1,200})["'][^>]+name=["']description["']/i);
    const desc = descMatch?.[1]?.trim() ?? '';
    const bodyText = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 800);
    return { title, desc, bodyText };
  } catch {
    return null;
  }
}

async function runDiagnosis(data) {
  const industry = INDUSTRY[data.industry] ?? data.industry;
  const goal     = GOAL[data.goal]         ?? data.goal;
  const problems = (data.problems ?? []).map(p => PROBLEM[p] ?? p).join('、') || 'なし';
  const site = await fetchSiteSnippet(data.websiteUrl);
  const siteSection = site
    ? `\n【サイト情報（自動取得）】\nタイトル: ${site.title || '取得できず'}\nメタディスクリプション: ${site.desc || '取得できず'}\n本文テキスト抜粋:\n${site.bodyText || '取得できず'}\n`
    : '\n【サイト情報】URLへのアクセスに失敗したため、入力情報のみで診断しています。\n';

  const prompt = `あなたはWebサイト改善の専門家です。以下の情報をもとに、Webサイトの診断レポートを生成してください。

【入力情報】
会社名・店舗名: ${data.businessName}
サイトURL: ${data.websiteUrl}
業種: ${industry}
サイトの目的: ${goal}
現在の課題: ${problems}
${siteSection}
以下のJSON形式のみで返してください。説明文や前置きは一切不要です。

{
  "score": <0〜100の整数。コンバージョン最適化の現状レベル。課題が多いほど低い>,
  "improvements": [
    { "title": "<改善タイトル（15字以内）>", "summary": "<何が問題でなぜ重要か（40〜55字）。具体的な実装方法は含めない>" },
    { "title": "...", "summary": "..." },
    { "title": "...", "summary": "..." },
    { "title": "...", "summary": "..." },
    { "title": "...", "summary": "..." }
  ]
}

ルール:
- improvements は必ず5件、優先度の高い順に並べる
- summary は問題の核心と改善の方向性のみ。具体的な実装手順・詳細は含めない
- 業種・目的・課題に合わせた内容にする`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });
  const text  = message.content[0].text;
  const match = text.match(/\{[\s\S]+\}/);
  if (!match) throw new Error('診断レスポンスの解析に失敗しました');
  return JSON.parse(match[0]);
}

// ── LP analyze with Playwright + Claude vision ───────────────────
async function analyzeLpPage(url) {
  const { chromium } = await import('playwright');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
  } catch {
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(1000);
  }

  // Take screenshot of top 3000px
  const screenshotBuf = await page.screenshot({
    type: 'jpeg',
    quality: 72,
    clip: { x: 0, y: 0, width: 1280, height: 3000 },
  });
  const screenshotBase64 = screenshotBuf.toString('base64');

  // Extract DOM data
  const pageData = await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
      .slice(0, 15)
      .map(el => ({ tag: el.tagName.toLowerCase(), text: (el.innerText || '').trim().slice(0, 120) }))
      .filter(h => h.text.length > 0);

    const navLinks = Array.from(document.querySelectorAll('nav a, header a'))
      .slice(0, 15)
      .map(el => (el.innerText || '').trim())
      .filter(t => t.length > 0 && t.length < 40);

    const ctaButtons = Array.from(document.querySelectorAll('a, button'))
      .filter(el => {
        const cl = (el.className || '').toString();
        const text = (el.innerText || '').trim();
        return text.length > 0 && text.length < 50 &&
               (cl.includes('btn') || cl.includes('cta') || cl.includes('button') || el.tagName === 'BUTTON');
      })
      .slice(0, 15)
      .map(el => ({ text: (el.innerText || '').trim(), href: el.getAttribute('href') ?? '' }));

    const bodyText = (document.body.innerText || '').slice(0, 2000).trim();

    return {
      title: document.title,
      metaDesc: document.querySelector('meta[name="description"]')?.content ?? '',
      headings,
      navLinks,
      ctaButtons,
      bodyText,
    };
  });

  await browser.close();

  // Call Claude Sonnet with vision + DOM data
  const prompt = `You are an expert Next.js / React developer. Analyze this landing page screenshot and extracted data, then generate a complete, production-ready Next.js page.tsx that faithfully recreates the LP.

EXTRACTED PAGE DATA:
URL: ${url}
Title: ${pageData.title}
Meta description: ${pageData.metaDesc}

Headings found:
${pageData.headings.map(h => `${h.tag.toUpperCase()}: ${h.text}`).join('\n') || '(none)'}

Navigation items: ${pageData.navLinks.join(', ') || '(none detected)'}

CTA buttons:
${pageData.ctaButtons.map(b => `- "${b.text}"`).join('\n') || '(none detected)'}

Body text (excerpt):
${pageData.bodyText}

Respond with EXACTLY this format — no preamble, no trailing text:

===ANALYSIS===
{
  "summary": "LP purpose summary (max 100 chars)",
  "targetAudience": "target user (max 50 chars)",
  "mainCta": "primary CTA button text",
  "sections": ["Header/Nav", "Hero", "...other sections...", "Footer"],
  "colorScheme": "color scheme description",
  "tone": "page tone (e.g. professional, friendly)"
}
===CODE===
'use client'

import { useState } from 'react'

// ... complete Next.js page.tsx using Tailwind CSS v4 classes ...
// Requirements:
// - All real content from the page (no placeholders for text)
// - Responsive (sm: md: lg: prefixes)
// - Images: use https://placehold.co/WxH/color/white for any images
// - Include header/nav, hero, all main sections, footer
// - useState for any interactive elements (FAQ accordions, mobile menu, etc.)`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: 'image/jpeg', data: screenshotBase64 },
        },
        { type: 'text', text: prompt },
      ],
    }],
  });

  const responseText = message.content[0].text;

  // Parse delimited response
  const analysisMatch = responseText.match(/===ANALYSIS===\s*([\s\S]*?)===CODE===/);
  const codeMatch     = responseText.match(/===CODE===\s*([\s\S]*)$/);

  let analysis = {};
  try {
    if (analysisMatch) analysis = JSON.parse(analysisMatch[1].trim());
  } catch { /* fallback to empty */ }

  const nextjsCode = codeMatch ? codeMatch[1].trim() : '// Code generation failed — please retry';

  return { url, screenshot: screenshotBase64, analysis, nextjsCode };
}

// ── Static file handler ──────────────────────────────────────────
function serveFile(req, res) {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.resolve(__dirname, `.${urlPath}`);
  if (!filePath.startsWith(__dirname + path.sep) && filePath !== __dirname) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' });
    res.end(data);
  });
}

// ── HTTP server ──────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const urlPath = req.url.split('?')[0];

  // ── Auth: /login GET (ログインページ表示) ──────────────────────
  if (req.method === 'GET' && urlPath === '/login') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(LOGIN_HTML.replace('__ERR__', ''));
    return;
  }

  // ── Auth: /login POST (パスワード検証) ────────────────────────
  if (req.method === 'POST' && urlPath === '/login') {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => {
      const params = new URLSearchParams(body);
      const pw = params.get('password') || '';
      if (AUTH_PASSWORD && pw === AUTH_PASSWORD) {
        const isSecure = req.headers['x-forwarded-proto'] === 'https';
        const cookieFlags = `auth_token=${AUTH_TOKEN}; HttpOnly; SameSite=Strict; Path=/${isSecure ? '; Secure' : ''}`;
        // リダイレクト先: 元のページ or aicare-portfolio.html
        const redirectTo = params.get('next') || '/aicare-portfolio.html';
        res.writeHead(302, { 'Set-Cookie': cookieFlags, Location: redirectTo });
        res.end();
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(LOGIN_HTML.replace('__ERR__', '<div class="err">パスワードが違います</div>'));
      }
    });
    return;
  }

  // ── Auth: /logout ─────────────────────────────────────────────
  if (urlPath === '/logout') {
    res.writeHead(302, {
      'Set-Cookie': 'auth_token=; Max-Age=0; Path=/',
      Location: '/login',
    });
    res.end();
    return;
  }

  // ── Auth guard: 未認証は /login へリダイレクト ────────────────
  if (AUTH_PASSWORD && !isAuth(req)) {
    // API は 401 を返す
    if (urlPath.startsWith('/api/')) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    // 静的ファイル・ページは /login へ
    const next = encodeURIComponent(req.url);
    res.writeHead(302, { Location: `/login?next=${next}` });
    res.end();
    return;
  }

  // ── Site diagnosis ─────────────────────────────────────────────
  if (req.method === 'POST' && req.url === '/api/diagnosis') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const diagnosis = await runDiagnosis(data);
        const id = Date.now().toString(36);
        store.set(id, diagnosis);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ id }));
      } catch (err) {
        console.error('[diagnosis error]', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  const diagIdMatch = req.method === 'GET' && req.url.match(/^\/api\/diagnosis\/([a-z0-9]+)/);
  if (diagIdMatch) {
    const result = store.get(diagIdMatch[1]);
    if (result) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'report not found' }));
    }
    return;
  }

  // ── LP analyze ─────────────────────────────────────────────────
  if (req.method === 'POST' && req.url === '/api/lp-analyze') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { url } = JSON.parse(body);
        if (!url || !/^https?:\/\//.test(url)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '有効なURLを入力してください' }));
          return;
        }
        console.log(`[lp-analyze] starting: ${url}`);
        const result = await analyzeLpPage(url);
        const id = Date.now().toString(36);
        lpStore.set(id, result);
        console.log(`[lp-analyze] done: ${id}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ id }));
      } catch (err) {
        console.error('[lp-analyze error]', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  const lpIdMatch = req.method === 'GET' && req.url.match(/^\/api\/lp-analyze\/([a-z0-9]+)/);
  if (lpIdMatch) {
    const result = lpStore.get(lpIdMatch[1]);
    if (result) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'result not found' }));
    }
    return;
  }

  // ── GAS proxy ──────────────────────────────────────────────────
  if (req.url.startsWith('/api/gas-proxy')) {
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbzdTSBlUR7RAkYvjLi6SQb9aFvfPvCW0dNIGqmul7-HYn2TXlS9dL0Z__pU1ZcooBjZfQ/exec';
    const urlObj = new URL(req.url, 'http://localhost');
    const qs = urlObj.search; // e.g. ?mode=requests
    try {
      if (req.method === 'GET') {
        const r = await fetch(GAS_URL + qs, { redirect: 'follow', signal: AbortSignal.timeout(20000) });
        const text = await r.text();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(text);
      } else if (req.method === 'POST') {
        let body = '';
        req.on('data', c => { body += c; });
        await new Promise(resolve => req.on('end', resolve));
        const r = await fetch(GAS_URL, {
          method: 'POST', redirect: 'follow',
          headers: { 'Content-Type': 'application/json' },
          body,
          signal: AbortSignal.timeout(60000),
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(await r.text().catch(() => '{"ok":true}'));
      }
    } catch (e) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // ── Slack Webhook proxy ────────────────────────────────────────
  if (req.method === 'POST' && req.url === '/api/slack-send') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { webhookUrl, text } = JSON.parse(body);
        if (!webhookUrl || !text) { res.writeHead(400); res.end(JSON.stringify({ error: 'missing params' })); return; }
        const wUrl = new URL(webhookUrl);
        const payload = JSON.stringify({ text });
        const options = {
          hostname: wUrl.hostname, path: wUrl.pathname + wUrl.search,
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
        };
        const https = require('https');
        const pr = https.request(options, sr => {
          let d = '';
          sr.on('data', c => d += c);
          sr.on('end', () => {
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ ok: sr.statusCode === 200, status: sr.statusCode, body: d }));
          });
        });
        pr.on('error', e => { res.writeHead(500); res.end(JSON.stringify({ error: e.message })); });
        pr.write(payload);
        pr.end();
      } catch(e) { res.writeHead(500); res.end(JSON.stringify({ error: e.message })); }
    });
    return;
  }

  // ── Static files ───────────────────────────────────────────────
  serveFile(req, res);
});

const PORT = Number(process.env.PORT ?? 3000);
server.listen(PORT, () => {
  console.log(`Web Tools running at http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('Warning: ANTHROPIC_API_KEY is not set — API calls will fail');
  }
});
