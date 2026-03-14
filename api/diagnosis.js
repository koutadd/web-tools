// api/diagnosis.js — Vercel serverless function
// POST /api/diagnosis → runs Claude diagnosis, returns full result

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const diagnosis = await runDiagnosis(data);
    const id = Date.now().toString(36);
    res.status(200).json({ id, ...diagnosis });
  } catch (err) {
    console.error('[diagnosis error]', err.message);
    res.status(500).json({ error: err.message });
  }
}
