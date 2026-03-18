import { type Phase } from './data';

// ─── 型定義 ───────────────────────────────────────────────────────────────────

export type ProposalCategory = 'next' | 'good' | 'consult';

export type Proposal = {
  id: number;
  category: ProposalCategory;
  title: string;
  reason: string;       // オーナー向けの理由（平易な言葉）
  adminNote: string;    // 管理者向けメモ
  phase: Phase;
};

// ─── 分類ラベル・スタイル ──────────────────────────────────────────────────────

export const CATEGORY_META: Record<ProposalCategory, {
  label: string; icon: string; color: string; bg: string; border: string; desc: string;
}> = {
  next: {
    label: '次にやること',
    icon: '🔴',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
    desc: '今すぐ対応が必要です',
  },
  good: {
    label: 'やっておくと良いこと',
    icon: '🟡',
    color: '#b45309',
    bg: '#fffbeb',
    border: '#fde68a',
    desc: '余裕があれば検討してください',
  },
  consult: {
    label: '一緒に考えたいこと',
    icon: '🔵',
    color: '#1d4ed8',
    bg: '#eff6ff',
    border: '#bfdbfe',
    desc: '担当者に相談しましょう',
  },
};

// ─── 提案データ ───────────────────────────────────────────────────────────────

export const PROPOSALS: Proposal[] = [
  // ── 企画 ──
  {
    id: 1, category: 'next', phase: '企画',
    title: 'ヒアリングシートのご返送',
    reason: '返送いただくと制作をすぐに開始できます。現在この作業待ちの状態です。',
    adminNote: '未返送が続く場合は電話でフォローする',
  },
  {
    id: 2, category: 'good', phase: '企画',
    title: '好きなサイトを3件ほどご用意ください',
    reason: '参考デザインがあると、イメージのズレを防ぎ、満足度の高い仕上がりになります。',
    adminNote: 'PinterestやGoogleで競合検索をおすすめする',
  },
  {
    id: 3, category: 'consult', phase: '企画',
    title: 'どんなお客様に来てほしいか',
    reason: 'ターゲット像を整理すると、サイト全体のメッセージが統一されます。一緒に考えましょう。',
    adminNote: 'ペルソナ設計の話題へ誘導。A4 1枚のワークシートを活用',
  },

  // ── デザイン ──
  {
    id: 4, category: 'next', phase: 'デザイン',
    title: 'デザイン案のご確認とご意見',
    reason: 'デザイン案をお送りしました。ご意見をいただけると制作工程に進めます。',
    adminNote: '期限3日を設けてリマインドする',
  },
  {
    id: 5, category: 'good', phase: 'デザイン',
    title: '店内・外観の写真をご用意ください',
    reason: '実際の写真があるとサイトの信頼感が上がり、来店につながりやすくなります。スマホ撮影でも大丈夫です。',
    adminNote: '撮影ガイドPDFを同封して送付する',
  },
  {
    id: 6, category: 'consult', phase: 'デザイン',
    title: '一番伝えたいキャッチコピー',
    reason: '「どんな店か」を一言で表す言葉があると、お客様の印象に残ります。一緒に考えましょう。',
    adminNote: 'コピー案を3パターン準備して提案',
  },

  // ── 制作 ──
  {
    id: 7, category: 'next', phase: '制作',
    title: 'テストサイトの内容チェック',
    reason: 'テスト用URLをお送りしました。住所・電話・営業時間に誤りがないかご確認ください。',
    adminNote: 'チェックシートを添付。2週間以内に返答もらう',
  },
  {
    id: 8, category: 'good', phase: '制作',
    title: 'Googleマイビジネスへの登録',
    reason: '地図アプリに表示されるようになり、近くにいる新規のお客様が来やすくなります。',
    adminNote: '登録代行サービスとして有償提案可能',
  },
  {
    id: 9, category: 'consult', phase: '制作',
    title: 'オンライン予約の導入について',
    reason: '「電話が繋がらなかった」という理由で予約を逃すケースを減らせます。費用・運用方法を相談しましょう。',
    adminNote: 'LINE公式・ホットペッパー・自社フォームの3択を提示',
  },

  // ── 納品 ──
  {
    id: 10, category: 'next', phase: '納品',
    title: '公開前の最終確認と承認',
    reason: '承認をいただければ本番公開できます。問題ない場合は「確認しました」とご連絡ください。',
    adminNote: '承認メール文面のテンプレートを送付',
  },
  {
    id: 11, category: 'good', phase: '納品',
    title: 'SNSリンクの最終確認',
    reason: 'InstagramやLINEのリンクが正しく動作しているか、スマホで確認してみてください。',
    adminNote: 'OGP画像・ファビコン確認も合わせて',
  },
  {
    id: 12, category: 'consult', phase: '納品',
    title: '公開後の更新・集客サポート',
    reason: '公開してからが本番です。定期更新や集客の方法について、一緒に計画を立てましょう。',
    adminNote: '保守プランの提案タイミング。月額プランの資料を用意',
  },
];

export function getProposalsByPhase(phase: Phase): Proposal[] {
  return PROPOSALS.filter((p) => p.phase === phase);
}

// ─── 相談ダミーデータ（管理側表示用） ─────────────────────────────────────────

export type ConsultRecord = {
  id: number;
  storeName: string;
  text: string;
  date: string;
  status: '未対応' | '対応中' | '回答済み';
  reply?: string;
};

export const DUMMY_CONSULTS: ConsultRecord[] = [
  {
    id: 1,
    storeName: 'アイケアラボ 駒込店',
    text: 'トップページの写真を変更したいのですが、どのくらいの費用がかかりますか？',
    date: '2026-03-17',
    status: '未対応',
  },
  {
    id: 2,
    storeName: 'アイケアラボ 渋谷店',
    text: '営業時間が変わりました。土日の時間を修正してほしいです。',
    date: '2026-03-16',
    status: '対応中',
    reply: '内容確認しました。本日中に反映します。',
  },
  {
    id: 3,
    storeName: 'アイケアラボ 池袋店',
    text: 'LINEの友だち追加ボタンをトップに追加できますか？',
    date: '2026-03-15',
    status: '回答済み',
    reply: 'かしこまりました。次の更新時に追加いたします。',
  },
];
