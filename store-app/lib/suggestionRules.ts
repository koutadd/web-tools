import { ValidPhase } from './api';

// ─── 型定義 ────────────────────────────────────────────────

export type SuggestionAudience = 'owner' | 'admin';
export type SuggestionCategory =
  | 'next_action'
  | 'recommendation'
  | 'consultation_prompt'
  | 'missing_info_alert';

export type SuggestionRule = {
  ruleId: string;
  phase: ValidPhase;
  audience: SuggestionAudience;
  category: SuggestionCategory;
  title: string;
  description: string;  // 詳細説明
  reason: string;       // なぜ今必要か（表示用）
  priority: number;     // 小さいほど優先
  dueLabel: string;     // 期限ラベル（例: 「デザイン開始前に」）
  link: string;         // 参考リンク（Amazon等ダミー可）
};

// ─── 静的ルール定義（フェーズ × audience × category）────────
// DB upsert 時に storeId + sourceType='rule' + sourceRef=ruleId で一意管理

export const SUGGESTION_RULES: SuggestionRule[] = [

  // ════════════ 企画フェーズ: オーナー向け ════════════

  {
    ruleId: 'owner-planning-next-hearing',
    phase: '企画',
    audience: 'owner',
    category: 'next_action',
    title: 'ヒアリングシートをご返送ください',
    description: '現在、制作開始のためヒアリングシートのご返送をお待ちしている状態です。',
    reason: 'ご返送いただくことで制作をすぐに開始できます。現在この作業が止まっています。',
    priority: 0,
    dueLabel: '今すぐ',
    link: '',
  },
  {
    ruleId: 'owner-planning-good-reference',
    phase: '企画',
    audience: 'owner',
    category: 'recommendation',
    title: '参考にしたいWebサイトを3件ほど選んでおいてください',
    description: '好きなデザイン・雰囲気のサイトを事前にご用意いただくと、イメージのズレを防げます。',
    reason: '参考サイトがあると、デザインの方向性を早く決めることができます。',
    priority: 1,
    dueLabel: '企画フェーズ中に',
    link: '',
  },
  {
    ruleId: 'owner-planning-consult-target',
    phase: '企画',
    audience: 'owner',
    category: 'consultation_prompt',
    title: '「どんなお客様に来てほしいか」を一緒に考えましょう',
    description: 'ターゲット像を整理すると、サイト全体のメッセージが統一されます。',
    reason: '担当者と一緒に考えることで、あなたの想いをサイトに正確に反映できます。',
    priority: 2,
    dueLabel: '企画フェーズ中に',
    link: '',
  },

  // ════════════ 企画フェーズ: 管理者向け ════════════

  {
    ruleId: 'admin-planning-rec-esign',
    phase: '企画',
    audience: 'admin',
    category: 'recommendation',
    title: '電子契約サービスの導入（freeeサイン / CloudSign）',
    description: '要件定義書・制作契約書をオンラインで締結でき、手戻りと認識齟齬を防げます。',
    reason: '紙契約による往復コストと、認識齟齬による後半の手戻りを同時に解消できます。',
    priority: 1,
    dueLabel: '契約前に',
    link: 'https://www.amazon.co.jp/s?k=電子契約+ビジネス',
  },
  {
    ruleId: 'admin-planning-rec-projecttool',
    phase: '企画',
    audience: 'admin',
    category: 'recommendation',
    title: 'プロジェクト管理ツールの設定（Backlog / Notion）',
    description: 'タスクと期日の一元管理でフェーズ遅延を早期に検知できます。',
    reason: 'メールやチャットで管理すると抜け漏れが起きやすいため、専用ツールを推奨します。',
    priority: 2,
    dueLabel: '着手前に',
    link: '',
  },
  {
    ruleId: 'admin-planning-consult-persona',
    phase: '企画',
    audience: 'admin',
    category: 'consultation_prompt',
    title: 'ペルソナ・ターゲット設計のヒアリングを実施してください',
    description: 'A4 1枚のターゲットシートをオーナーと共同で作成することを推奨します。',
    reason: 'ここで方向性が定まらないと、デザインフェーズでの手戻りリスクが高まります。',
    priority: 0,
    dueLabel: 'フェーズ終了前に',
    link: '',
  },

  // ════════════ デザインフェーズ: オーナー向け ════════════

  {
    ruleId: 'owner-design-next-feedback',
    phase: 'デザイン',
    audience: 'owner',
    category: 'next_action',
    title: 'デザイン案のご確認とフィードバックをお願いします',
    description: 'デザイン案をお送りしました。ご意見をいただけると制作工程に進めます。',
    reason: 'フィードバックをいただけないと、制作が止まってしまいます。',
    priority: 0,
    dueLabel: '3日以内に',
    link: '',
  },
  {
    ruleId: 'owner-design-good-photos',
    phase: 'デザイン',
    audience: 'owner',
    category: 'recommendation',
    title: '店舗・スタッフの写真をご用意ください',
    description: '実際の写真があるとサイトの信頼感が上がり、来店につながりやすくなります。スマホ撮影でも大丈夫です。',
    reason: 'プロ写真でなくても、実際の雰囲気が伝わる写真はお客様の安心につながります。',
    priority: 1,
    dueLabel: 'デザイン確定前に',
    link: '',
  },
  {
    ruleId: 'owner-design-consult-copy',
    phase: 'デザイン',
    audience: 'owner',
    category: 'consultation_prompt',
    title: '一番伝えたいキャッチコピーを一緒に考えましょう',
    description: '「どんな店か」を一言で表す言葉があると、お客様の印象に残ります。',
    reason: 'キャッチコピーはサイト全体の印象を決める重要な要素です。',
    priority: 2,
    dueLabel: 'デザイン確定前に',
    link: '',
  },

  // ════════════ デザインフェーズ: 管理者向け ════════════

  {
    ruleId: 'admin-design-rec-font',
    phase: 'デザイン',
    audience: 'admin',
    category: 'recommendation',
    title: '商用Webフォントライセンスの取得（モリサワ TypeSquare）',
    description: '¥5,500〜¥33,000/年。Webサイトに組み込む日本語フォントには商用ライセンスが必要です。',
    reason: '無断使用は著作権侵害になります。デザイン確定前に取得してください。',
    priority: 0,
    dueLabel: 'デザイン確定前に',
    link: 'https://www.amazon.co.jp/s?k=商用フォント+Webフォント',
  },
  {
    ruleId: 'admin-design-rec-stock',
    phase: 'デザイン',
    audience: 'admin',
    category: 'recommendation',
    title: '写真素材サービスへの加入（Adobe Stock）',
    description: '月額¥3,828〜。デザインカンプに実素材を使うとクライアント承認が早くなります。',
    reason: 'ダミー画像でのプレゼンは承認率が低いです。実素材で提示することを推奨します。',
    priority: 1,
    dueLabel: 'デザインカンプ作成前に',
    link: 'https://www.amazon.co.jp/s?k=Adobe+Stock+写真素材',
  },
  {
    ruleId: 'admin-design-rec-accessibility',
    phase: 'デザイン',
    audience: 'admin',
    category: 'recommendation',
    title: 'アクセシビリティ基準（WCAG 2.1 AA）の確認',
    description: 'コントラスト比4.5:1以上・タップ領域44px以上を設計段階で確認してください。',
    reason: '医療系サイトは高齢者ユーザーも多く、アクセシビリティ対応が特に重要です。',
    priority: 2,
    dueLabel: 'コーディング前に',
    link: '',
  },

  // ════════════ 制作フェーズ: オーナー向け ════════════

  {
    ruleId: 'owner-production-next-testcheck',
    phase: '制作',
    audience: 'owner',
    category: 'next_action',
    title: 'テストサイトの内容をご確認ください',
    description: 'テスト用URLをお送りしました。住所・電話番号・営業時間に誤りがないかご確認ください。',
    reason: 'この確認が完了しないと本番公開に進めません。',
    priority: 0,
    dueLabel: '2週間以内に',
    link: '',
  },
  {
    ruleId: 'owner-production-good-gmb',
    phase: '制作',
    audience: 'owner',
    category: 'recommendation',
    title: 'Googleマイビジネスへの登録',
    description: '地図アプリに表示されるようになり、近くにいる新規のお客様が来やすくなります。',
    reason: 'ローカル検索（「近くのコンタクト屋」等）で上位に表示されるようになります。',
    priority: 1,
    dueLabel: '公開前に',
    link: '',
  },
  {
    ruleId: 'owner-production-consult-reservation',
    phase: '制作',
    audience: 'owner',
    category: 'consultation_prompt',
    title: 'オンライン予約の導入について相談しましょう',
    description: '「電話が繋がらなかった」という理由で予約を逃すケースを減らせます。',
    reason: 'LINE・ホットペッパー・自社フォームの3択で費用・運用方法が違います。一緒に選びましょう。',
    priority: 2,
    dueLabel: '公開前に',
    link: '',
  },

  // ════════════ 制作フェーズ: 管理者向け ════════════

  {
    ruleId: 'admin-production-rec-hosting',
    phase: '制作',
    audience: 'admin',
    category: 'recommendation',
    title: 'レンタルサーバーの事前契約（Xserver ビジネス）',
    description: '¥1,100〜/月。転送量無制限・自動バックアップ・SSL無料付き。',
    reason: '制作完了後すぐ公開できるよう、サーバーを事前に契約しておくことを推奨します。',
    priority: 0,
    dueLabel: '制作開始時に',
    link: 'https://www.amazon.co.jp/s?k=レンタルサーバー+ビジネス',
  },
  {
    ruleId: 'admin-production-rec-seo',
    phase: '制作',
    audience: 'admin',
    category: 'recommendation',
    title: 'SEOキーワード調査（地域×業種）',
    description: '「地域名＋コンタクト」「地域名＋眼科」の検索ボリュームを把握してコンテンツに活かします。',
    reason: 'コーディング後のSEO対策は効果が半減します。制作段階で実施してください。',
    priority: 1,
    dueLabel: '制作開始時に',
    link: '',
  },

  // ════════════ 納品フェーズ: オーナー向け ════════════

  {
    ruleId: 'owner-delivery-next-final',
    phase: '納品',
    audience: 'owner',
    category: 'next_action',
    title: '公開前の最終確認と承認をお願いします',
    description: '承認をいただければ本番公開できます。問題ない場合は「確認しました」とご連絡ください。',
    reason: 'この承認が最後のステップです。ご確認後すぐに公開いたします。',
    priority: 0,
    dueLabel: '今すぐ',
    link: '',
  },
  {
    ruleId: 'owner-delivery-good-sns',
    phase: '納品',
    audience: 'owner',
    category: 'recommendation',
    title: 'SNSリンクの最終確認をしてください',
    description: 'InstagramやLINEのリンクが正しく動作しているか、スマホでご確認ください。',
    reason: '公開後にリンク切れが発覚すると、お客様に不信感を与えてしまいます。',
    priority: 1,
    dueLabel: '公開前に',
    link: '',
  },
  {
    ruleId: 'owner-delivery-consult-maintenance',
    phase: '納品',
    audience: 'owner',
    category: 'consultation_prompt',
    title: '公開後の更新・集客サポートについて',
    description: '公開してからが本番です。定期更新や集客の方法について一緒に計画を立てましょう。',
    reason: 'サイトは公開して終わりではなく、継続的な更新・改善が集客につながります。',
    priority: 2,
    dueLabel: '公開前後に',
    link: '',
  },

  // ════════════ 納品フェーズ: 管理者向け ════════════

  {
    ruleId: 'admin-delivery-rec-analytics',
    phase: '納品',
    audience: 'admin',
    category: 'recommendation',
    title: 'Googleアナリティクス4 / サーチコンソールの設定と引き渡し',
    description: '公開と同時にアクセス計測を開始しないと初動データが取れません。',
    reason: '設定後、クライアントのGoogleアカウントに権限を引き渡してください。',
    priority: 0,
    dueLabel: '公開前に',
    link: 'https://www.amazon.co.jp/s?k=Googleアナリティクス+入門',
  },
  {
    ruleId: 'admin-delivery-rec-backup',
    phase: '納品',
    audience: 'admin',
    category: 'recommendation',
    title: '自動バックアップの設定',
    description: '週次・日次のバックアップを自動取得し、復元手順もクライアントに共有してください。',
    reason: '納品後の想定外の障害・改ざんに備えるための最低限の安全策です。',
    priority: 1,
    dueLabel: '公開前に',
    link: 'https://www.amazon.co.jp/s?k=WordPressバックアップ+プラグイン',
  },
  {
    ruleId: 'admin-delivery-consult-maintenance-plan',
    phase: '納品',
    audience: 'admin',
    category: 'consultation_prompt',
    title: '保守サポート契約の提案タイミングです',
    description: '公開後の修正範囲・対応期間・月額費用を明文化してクライアントに提案してください。',
    reason: 'このタイミングで提案しないと、無償対応の範囲が曖昧になりトラブルの元になります。',
    priority: 0,
    dueLabel: '公開前後に',
    link: '',
  },
];

export function getRulesForPhase(phase: ValidPhase): SuggestionRule[] {
  return SUGGESTION_RULES.filter((r) => r.phase === phase);
}

export function getRulesForAudience(
  phase: ValidPhase,
  audience: SuggestionAudience,
): SuggestionRule[] {
  return SUGGESTION_RULES.filter((r) => r.phase === phase && r.audience === audience);
}
