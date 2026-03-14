// server.js — Web Tools local dev server
// Serves static files, /api/diagnosis, and /api/lp-analyze (Playwright + Claude vision)
//
// Usage:
//   ANTHROPIC_API_KEY=sk-... node server.js
//   PORT=8080 ANTHROPIC_API_KEY=... node server.js   (default port: 3000)
//
// First run: npx playwright install chromium

import http from 'node:http';
import fs   from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const client    = new Anthropic(); // reads ANTHROPIC_API_KEY from env

// ── In-memory stores ─────────────────────────────────────────────
const store   = new Map();  // site-diagnosis results
const lpStore = new Map();  // lp-analyze results

// ── Projects data store ───────────────────────────────────────────
const dataDir      = path.join(__dirname, 'data');
const projectsFile = path.join(dataDir, 'projects.json');
fs.mkdirSync(dataDir, { recursive: true });

// ── Image watch (SSE for dashboard) ──────────────────────────────
const imageWatchClients = new Set();
const imgWatchDir = path.join(__dirname, 'image', 'projects');
fs.mkdirSync(imgWatchDir, { recursive: true });
fs.watch(imgWatchDir, (eventType, filename) => {
  if (!filename || !/\.(png|jpe?g|webp|gif)$/i.test(filename)) return;
  const slug    = filename.replace(/\.[^.]+$/, '');
  const payload = JSON.stringify({ slug, filename, ts: Date.now() });
  for (const client of imageWatchClients) {
    try { client.write(`data: ${payload}\n\n`); } catch { /* ignore */ }
  }
});

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

  // ── Google Sheets CSV fetch ────────────────────────────────────
  if (req.method === 'POST' && req.url === '/api/fetch-sheet') {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', async () => {
      try {
        const { url } = JSON.parse(body);
        const match = url.match(/spreadsheets\/d\/([^/]+)/);
        if (!match) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '有効なスプレッドシートURLではありません' }));
          return;
        }
        const id = match[1];
        const gidMatch = url.match(/[#&?]gid=(\d+)/);
        const gid = gidMatch ? `&gid=${gidMatch[1]}` : '';
        const csvUrl = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv${gid}`;
        const r = await fetch(csvUrl, { signal: AbortSignal.timeout(12000) });
        if (!r.ok) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `シートを取得できませんでした (${r.status})。「リンクを知っている全員が閲覧可」に設定してください。` }));
          return;
        }
        const csv = await r.text();
        // Simple CSV parse — extract all cells that look like URLs
        const cells = [];
        csv.split('\n').forEach((line, rowIdx) => {
          // handle quoted fields
          const fields = [];
          let cur = '', inQ = false;
          for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') { inQ = !inQ; }
            else if (ch === ',' && !inQ) { fields.push(cur.trim()); cur = ''; }
            else { cur += ch; }
          }
          fields.push(cur.trim());
          fields.forEach((val, colIdx) => {
            const v = val.replace(/^"|"$/g, '').trim();
            if (/^https?:\/\//i.test(v)) cells.push({ row: rowIdx + 1, col: colIdx + 1, value: v });
          });
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ cells }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // ── Projects CRUD ──────────────────────────────────────────────
  if (req.method === 'GET' && req.url === '/api/projects') {
    try {
      const data = fs.existsSync(projectsFile) ? fs.readFileSync(projectsFile, 'utf8') : '[]';
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
    } catch (err) {
      res.writeHead(500); res.end('[]');
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/api/projects') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        JSON.parse(body); // validate JSON
        fs.writeFileSync(projectsFile, body, 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"ok":true}');
      } catch (err) {
        res.writeHead(400); res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // ── Dashboard image watch SSE ───────────────────────────────────
  if (req.method === 'GET' && req.url === '/api/watch-images') {
    res.writeHead(200, {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    res.write(': connected\n\n');
    imageWatchClients.add(res);
    const ping = setInterval(() => {
      try { res.write(': ping\n\n'); } catch { clearInterval(ping); }
    }, 25000);
    req.on('close', () => {
      imageWatchClients.delete(res);
      clearInterval(ping);
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
