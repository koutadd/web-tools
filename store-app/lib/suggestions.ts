import { ValidPhase } from './api';

// ─── 型定義 ──────────────────────────────────────────────

/** フェーズ別のアドバイス */
export type PhaseTip = string;

/** おすすめ購入品・導入ツール */
export type RecommendedItem = {
  id: string;
  name: string;
  reason: string;        // なぜ今必要か
  category: string;      // 'ツール' | 'サービス' | 'ライセンス' | '素材' など
  priceRange?: string;   // 参考価格帯（任意）
};

/** リサーチ候補 */
export type ResearchCandidate = {
  id: string;
  title: string;
  description: string;
  category: 'competitor' | 'trend' | 'tool'; // 競合 / トレンド / ツール調査
};

/** Taskの最小型（DBから取得した形そのまま受け取れるよう緩く定義） */
export type TaskLike = {
  id: string;
  title: string;
  done: boolean;
  phase: string;
};

/** suggestions APIのレスポンス型 */
export type SuggestionResult = {
  storeId: string;
  storeName: string;
  currentPhase: ValidPhase;
  /** 未完了の先頭タスク。全完了なら null */
  nextTask: { id: string; title: string; phase: string } | null;
  /** フェーズ固有のアドバイス */
  phaseTips: PhaseTip[];
  /** おすすめ購入品・ツール */
  recommendations: RecommendedItem[];
  /** リサーチ候補 */
  researchCandidates: ResearchCandidate[];
};

// ─── フェーズ別ルール ─────────────────────────────────────

export const PHASE_TIPS: Record<ValidPhase, PhaseTip[]> = {
  企画: [
    '初回ヒアリングでは「目的・ターゲット・予算・期限」の4点を必ず確認してください。',
    '要件定義書はクライアントに署名してもらってから次フェーズへ進むと認識齟齬が減ります。',
    'サイトマップを1ページ図で共有すると、ページ構成の認識合わせがしやすいです。',
  ],
  デザイン: [
    'デザインカンプはA案・B案の2パターン提示すると承認スピードが上がります。',
    'フォントは本文用・見出し用の2種類以内に絞ると統一感が出やすいです。',
    'カラーパレットをコンポーネント単位で定義しておくと、制作フェーズの手戻りを防げます。',
  ],
  制作: [
    'スマートフォン表示（375px〜）から先にコーディングする「モバイルファースト」を意識してください。',
    '問い合わせフォームのサンクスページ・エラーメッセージも必ずテストしてください。',
    'ページ速度（Core Web Vitals）は公開前にPageSpeed Insightsで確認することを推奨します。',
  ],
  納品: [
    '本番公開前に「404ページ・リンク切れ・フォーム送信」の3点を最終確認してください。',
    'Googleアナリティクス・サーチコンソールの設定をクライアントに引き渡してください。',
    '公開後1ヶ月の保守サポート範囲を事前に明文化しておくとトラブルを防げます。',
  ],
};

// ─── ダミー: おすすめ購入品・ツール ─────────────────────────

const RECOMMENDATIONS: Record<ValidPhase, RecommendedItem[]> = {
  企画: [
    {
      id: 'rec-hearing-template',
      name: 'ヒアリングシートテンプレート（Notion）',
      reason: '企画フェーズでは抜け漏れのないヒアリングが品質を左右します。',
      category: 'ツール',
      priceRange: '無料〜¥1,650/月',
    },
    {
      id: 'rec-project-tool',
      name: 'プロジェクト管理ツール（Linear / Backlog）',
      reason: 'タスクと期日を一元管理することでフェーズ遅延を早期に検知できます。',
      category: 'ツール',
      priceRange: '¥0〜¥900/月',
    },
    {
      id: 'rec-e-sign',
      name: '電子契約サービス（freeeサイン / CloudSign）',
      reason: '要件定義書・契約書の締結をオンラインで完結させると手戻りが減ります。',
      category: 'サービス',
      priceRange: '¥1,000〜¥5,000/月',
    },
  ],
  デザイン: [
    {
      id: 'rec-font-license',
      name: '商用フォントライセンス（TypeBank / モリサワ等）',
      reason: 'Webサイトに組み込む日本語フォントは商用ライセンスの確認が必要です。',
      category: 'ライセンス',
      priceRange: '¥5,500〜¥33,000/年',
    },
    {
      id: 'rec-stock-photo',
      name: '写真素材サービス（Adobe Stock / Shutterstock）',
      reason: 'デザインカンプ段階から実素材を使うとクライアントの承認が取りやすくなります。',
      category: '素材',
      priceRange: '¥3,828〜¥10,000/月',
    },
    {
      id: 'rec-figma',
      name: 'Figma（デザイン・プロトタイプ）',
      reason: 'クライアントとのデザインレビューをブラウザ上で完結でき、コメント管理も楽です。',
      category: 'ツール',
      priceRange: '¥0〜¥1,800/月',
    },
  ],
  制作: [
    {
      id: 'rec-hosting',
      name: 'レンタルサーバー（Xserver / ConoHa WING）',
      reason: '制作完了後すぐ本番公開できるよう、サーバーを事前に契約しておくと安心です。',
      category: 'サービス',
      priceRange: '¥660〜¥1,650/月',
    },
    {
      id: 'rec-ssl',
      name: 'SSL証明書（Let\'s Encrypt / 独自SSL）',
      reason: 'HTTPSは現在の標準仕様です。公開前に必ず設定してください。',
      category: 'サービス',
      priceRange: '無料〜¥16,500/年',
    },
    {
      id: 'rec-browserstack',
      name: 'ブラウザ互換テストツール（BrowserStack）',
      reason: '主要ブラウザ＋スマートフォンの表示確認を効率よく行えます。',
      category: 'ツール',
      priceRange: '¥5,400〜/月',
    },
  ],
  納品: [
    {
      id: 'rec-analytics',
      name: 'Googleアナリティクス 4（GA4）',
      reason: 'サイト公開と同時にアクセス計測を開始することを強く推奨します。',
      category: 'ツール',
      priceRange: '無料',
    },
    {
      id: 'rec-search-console',
      name: 'Googleサーチコンソール',
      reason: '検索からの流入確認・エラー検知に必須です。クライアントに引き渡してください。',
      category: 'ツール',
      priceRange: '無料',
    },
    {
      id: 'rec-backup',
      name: 'バックアップサービス（JetBackup / UpdraftPlus）',
      reason: '納品後の想定外の障害に備え、定期バックアップの仕組みを整えておきましょう。',
      category: 'サービス',
      priceRange: '¥0〜¥1,100/月',
    },
  ],
};

// ─── ダミー: リサーチ候補 ────────────────────────────────────

const RESEARCH_CANDIDATES: Record<ValidPhase, ResearchCandidate[]> = {
  企画: [
    {
      id: 'research-competitor-basic',
      title: '競合店舗のWeb施策調査',
      description: '同業他社（眼科・コンタクト販売）のWebサイト構成・訴求ポイント・予約導線を確認する。',
      category: 'competitor',
    },
    {
      id: 'research-user-need',
      title: 'ターゲット顧客のニーズ調査',
      description: '「コンタクトレンズ 購入」「眼科 予約」などのキーワードで検索意図を把握する。',
      category: 'trend',
    },
    {
      id: 'research-sitemap-tool',
      title: 'サイトマップ作成ツール選定',
      description: 'Miro・FigJam・Whimsical などクライアントと共有しやすいツールを比較する。',
      category: 'tool',
    },
  ],
  デザイン: [
    {
      id: 'research-medical-design-trend',
      title: '医療・ヘルスケア系サイトのデザイントレンド調査',
      description: '清潔感・信頼感を重視したカラーパレットとレイアウトの最新事例を確認する。',
      category: 'trend',
    },
    {
      id: 'research-competitor-design',
      title: '競合店舗のデザイン・UI比較',
      description: '競合上位5サイトのヘッダー・ファーストビュー・CTA配置をスクリーンショットで記録・比較する。',
      category: 'competitor',
    },
    {
      id: 'research-accessibility',
      title: 'アクセシビリティ基準（WCAG 2.1）の確認',
      description: '医療系サイトは高齢者ユーザーも多いため、文字サイズ・コントラスト比の基準を事前に把握しておく。',
      category: 'tool',
    },
  ],
  制作: [
    {
      id: 'research-seo-keyword',
      title: 'SEOキーワード調査',
      description: '「地域名 + コンタクト」「地域名 + 眼科」など集客に繋がるキーワードのボリュームと難易度を調査する。',
      category: 'trend',
    },
    {
      id: 'research-cwv',
      title: 'Core Web Vitals の基準値確認',
      description: 'LCP・FID・CLSの目標値を確認し、コーディング段階から意識した実装を行う。',
      category: 'tool',
    },
    {
      id: 'research-competitor-contact',
      title: '競合サイトの問い合わせ・予約フロー調査',
      description: '競合上位サイトの予約・問い合わせ導線をユーザー視点でトレースし、UX改善ポイントを洗い出す。',
      category: 'competitor',
    },
  ],
  納品: [
    {
      id: 'research-post-launch-monitoring',
      title: '公開後モニタリング指標の設定',
      description: 'GA4でのコンバージョン設定（予約完了・問い合わせ送信）と計測基準をクライアントと合意する。',
      category: 'tool',
    },
    {
      id: 'research-search-trend',
      title: '公開後の検索順位モニタリングツール調査',
      description: 'GRC・Ahrefs・SearchAtlas などのランクトラッキングツールを比較し、クライアントに提案できる候補を用意する。',
      category: 'tool',
    },
    {
      id: 'research-competitor-post',
      title: '公開後の競合比較レポート作成',
      description: '本番公開から1ヶ月後を目処に、競合サイトとの差分（SEO・UX）を改めて比較・報告する。',
      category: 'competitor',
    },
  ],
};

// ─── 提案ロジック ─────────────────────────────────────────

/**
 * Store + Task一覧からSuggestionResultを組み立てる純粋関数。
 * DB アクセスはしない。API Routeで呼び出す。
 */
export function buildSuggestions(
  store: { id: string; name: string; currentPhase: string },
  tasks: TaskLike[],
): SuggestionResult {
  const phase = store.currentPhase as ValidPhase;

  // 未完了の先頭タスク（orderで昇順ソート済みであることを前提）
  const nextTask = tasks.find((t) => !t.done) ?? null;

  return {
    storeId: store.id,
    storeName: store.name,
    currentPhase: phase,
    nextTask: nextTask
      ? { id: nextTask.id, title: nextTask.title, phase: nextTask.phase }
      : null,
    phaseTips: PHASE_TIPS[phase] ?? [],
    recommendations: RECOMMENDATIONS[phase] ?? [],
    researchCandidates: RESEARCH_CANDIDATES[phase] ?? [],
  };
}
