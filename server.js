// server.js — Web Tools local dev server
// Serves static files and provides /api/diagnosis (Claude-powered)
//
// Usage:
//   ANTHROPIC_API_KEY=sk-... node server.js
//   PORT=8080 ANTHROPIC_API_KEY=... node server.js   (default port: 3000)

import http from 'node:http';
import fs   from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const client    = new Anthropic(); // reads ANTHROPIC_API_KEY from env

// ── In-memory report store ──────────────────────────────────────
// Maps report ID → diagnosis object.
// Cleared on server restart — use a DB for persistence.
const store = new Map();

// ── Label maps (matches form values in index.html) ──────────────
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

// ── Static file MIME types ──────────────────────────────────────
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

// ── Fetch a snippet of the target site ─────────────────────────
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

// ── Claude diagnosis ────────────────────────────────────────────
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
    { "title": "<改善タイトル（15字以内）>", "body": "<説明（80〜120字）。現状の問題と改善方向を含める>" },
    { "title": "...", "body": "..." },
    { "title": "...", "body": "..." }
  ],
  "beforeAfter": [
    { "before": "<改善前の状態（40〜60字）>", "after": "<改善後の状態（40〜60字）>" },
    { "before": "...", "after": "..." },
    { "before": "...", "after": "..." }
  ]
}

ルール:
- improvements と beforeAfter はそれぞれ必ず3件
- beforeAfter は improvements の各項目と対応させる
- 業種・目的・課題に合わせた具体的な内容にする
- 改善後は「〜するようになる」という表現を使う`;

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

// ── Static file handler ─────────────────────────────────────────
function serveFile(req, res) {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';

  // Prevent path traversal
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

// ── HTTP server ─────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {

  // POST /api/diagnosis — run diagnosis and store result
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

  // GET /api/diagnosis/:id — fetch stored result
  const idMatch = req.method === 'GET' && req.url.match(/^\/api\/diagnosis\/([a-z0-9]+)/);
  if (idMatch) {
    const result = store.get(idMatch[1]);
    if (result) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'report not found' }));
    }
    return;
  }

  // Static files
  serveFile(req, res);
});

const PORT = Number(process.env.PORT ?? 3000);
server.listen(PORT, () => {
  console.log(`Web Tools running at http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('Warning: ANTHROPIC_API_KEY is not set — diagnosis calls will fail');
  }
});
