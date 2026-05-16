import { NextRequest, NextResponse } from 'next/server'
import { SearchParams, SiteResult } from '@/lib/types'

export const runtime = 'edge'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? ''
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`

function buildThumbUrls(url: string) {
  return {
    thumbnailUrl: `https://image.thum.io/get/width/1280/${url}`,
    thumbnailSpUrl: `https://image.thum.io/get/width/390/crop/844/${url}`,
  }
}

function buildPrompt(params: SearchParams): string {
  const sectionList =
    params.sections.length > 0
      ? params.sections.map((s, i) => `  ${i + 1}. ${s}`).join('\n')
      : '  (指定なし)'
  const required =
    params.requiredSections.length > 0 ? params.requiredSections.join('、') : 'なし'
  const excluded =
    params.excludeTypes.length > 0 ? params.excludeTypes.join('、') : 'なし'

  return `あなたは日本のWebデザインリサーチ専門家です。
以下の条件に合う日本の企業サイトを15件提案してください。

## 検索条件
- 業種: ${params.industry || '指定なし'}
- サイトタイプ: ${params.siteType || '指定なし'}
- トンマナ: ${params.tones.length > 0 ? params.tones.join('、') : '指定なし'}
- セクション構成（上から順番に）:
${sectionList}
- 必須セクション: ${required}
- 除外サイトタイプ: ${excluded}

## 絶対条件
- 日本企業の公式サイトのみ（海外サイト完全NG）
- 上場企業・大手企業・有名サービス企業を最優先
- 実在する本物のURL（404やドメイン失効NG）
- デザイン品質が高いこと
- 個人ブログ・アフィリエイト・まとめサイトはNG
- 必ず15件、重複URLなしで返すこと

## スコアリング基準
- companyScaleScore: 上場企業90+、大手有名企業80+、中堅60-79、中小40-59
- sectionMatchScore: 指定セクションのうち何割含まれているか（0-100）
- orderMatchScore: セクションの並び順がどれだけ一致しているか（0-100）
- designScore: デザイン品質の推定（プロ制作レベルなら80+）
- totalScore: (companyScaleScore×0.25 + sectionMatchScore×0.35 + orderMatchScore×0.15 + designScore×0.25)

## 返却フォーマット（JSONのみ、他テキスト不要）
[
  {
    "siteName": "企業名/サービス名",
    "url": "https://実際のURL",
    "industry": "業種",
    "siteType": "サービスサイト|採用サイト|ブランドサイト|LP等",
    "companyScaleScore": 85,
    "sectionMatchScore": 90,
    "orderMatchScore": 80,
    "designScore": 88,
    "totalScore": 87,
    "matchedSections": ["一致セクション1", "一致セクション2"],
    "toneTags": ["トンマナ1", "トンマナ2"],
    "reasons": {
      "sectionMatch": "セクション一致の説明（日本語1文、簡潔に）",
      "companyScale": "大手判定理由（日本語1文、簡潔に）",
      "toneMatch": "トンマナ一致の説明（日本語1文、簡潔に）",
      "overall": "総合推薦理由（日本語1文、簡潔に）"
    }
  }
]`
}

export async function POST(req: NextRequest) {
  try {
    const params: SearchParams = await req.json()
    const prompt = buildPrompt(params)

    // Build Gemini request parts
    type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } }
    const parts: GeminiPart[] = []

    if (params.uploadedImage) {
      const base64 = params.uploadedImage.replace(/^data:image\/\w+;base64,/, '')
      const mimeType =
        params.uploadedImage.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/png'
      parts.push({ inlineData: { mimeType, data: base64 } })
      parts.push({
        text: `上記の画像はユーザーが参考にしたい日本のWebサイトのスクリーンショットです。

## Step 1: 画像の詳細分析（内部処理）

以下を分析して頭に入れてください（出力には含めない）：

1. **セクション構成**: 上から順に全セクションを特定
   例: ヘッダーナビ → ファーストビュー（全幅背景画像＋中央テキスト） → 数字実績（3カラム） → 特徴紹介（交互レイアウト） → 事例スライダー → 料金表 → FAQ → フッター

2. **デザイン特徴**:
   - 配色（メインカラー/アクセントカラー/背景）
   - レイアウトスタイル（フルワイド/カード/グリッド/非対称など）
   - 余白の広さ・フォント印象
   - 全体トーン（高級/モダン/フレンドリーなど）

3. **各セクションのデザインパターン**: カード型かリスト型か全幅かなど

## Step 2: 類似サイトの提案

画像から分析したセクション構成・デザインパターンに最も似た日本のサイトを15件提案してください。

優先順位：
1. **セクション種類と順番**が最も一致するサイト
2. 各セクションで**同じデザインパターン**（カード/全幅/交互など）を使うサイト
3. **ビジュアルトーン**（配色・余白感・フォント）が近いサイト

matchedSectionsには「画像のどのセクションに対応するか」を記載してください。
reasons.sectionMatchには「画像の[セクション名]と[サイト名]の[セクション名]が○○の点で一致」という形で具体的に記載してください。

追加条件：
${prompt}`,
      })
    } else {
      parts.push({ text: prompt })
    }

    const geminiRes = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 16384,
          responseMimeType: 'application/json',
          // Disable thinking to prevent token budget exhaustion
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          thinkingConfig: { thinkingBudget: 0 } as any,
        },
      }),
    })

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text()
      return NextResponse.json({ error: `Gemini API error ${geminiRes.status}: ${errBody}` }, { status: 500 })
    }

    const geminiData = await geminiRes.json()
    const text: string = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    // With responseMimeType=application/json, text should be pure JSON
    // Fallback: extract array if there's any wrapping
    let raw: Array<Omit<SiteResult, 'id' | 'thumbnailUrl' | 'thumbnailSpUrl' | 'notes' | 'isFavorite'>>
    try {
      const parsed = JSON.parse(text)
      raw = Array.isArray(parsed) ? parsed : parsed.sites ?? []
    } catch {
      const match = text.match(/\[[\s\S]*\]/)
      if (!match) return NextResponse.json({ sites: [], error: 'No valid JSON in response' })
      raw = JSON.parse(match[0])
    }

    const sites: SiteResult[] = raw.map((site, i) => ({
      ...site,
      id: `${Date.now()}-${i}`,
      ...buildThumbUrls(site.url),
      notes: '',
      isFavorite: false,
    }))

    return NextResponse.json({ sites })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
