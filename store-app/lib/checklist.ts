import { type Phase } from './data';

// ─── 型定義 ───────────────────────────────────────────────────────────────────

export type ChecklistStatus = '未提出' | '提出済み' | '確認中' | '不要';
export type ChecklistAssignee = 'オーナー' | '担当者';

export type ChecklistItem = {
  id: number;
  phase: Phase;
  title: string;
  reason: string;
  status: ChecklistStatus;
  assignee: ChecklistAssignee;
  deadline?: string;
  uploadable: boolean;
  acceptTypes?: string;
};

// ─── ステータス表示スタイル ───────────────────────────────────────────────────

export const STATUS_META: Record<ChecklistStatus, {
  label: string; bg: string; text: string; border: string;
}> = {
  未提出: { label: '未提出',  bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
  提出済み: { label: '提出済み', bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' },
  確認中: { label: '確認中',  bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
  不要:   { label: '不要',   bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' },
};

// ─── チェックリストデータ ─────────────────────────────────────────────────────

export const CHECKLIST_ITEMS: ChecklistItem[] = [
  // ── 企画 ──
  {
    id: 1, phase: '企画',
    title: 'ヒアリングシート',
    reason: '制作の方向性を決めるために必要です。返送いただくと作業をすぐに開始できます。',
    status: '未提出', assignee: 'オーナー', deadline: '2026-03-20',
    uploadable: true, acceptTypes: '.pdf,.docx',
  },
  {
    id: 2, phase: '企画',
    title: '参考サイトURL（3件程度）',
    reason: 'デザインイメージのズレを防ぐため、好みのサイトをご連絡ください。',
    status: '未提出', assignee: 'オーナー',
    uploadable: false,
  },
  {
    id: 3, phase: '企画',
    title: 'ロゴデータ（PNG / AI）',
    reason: 'ヘッダーやファビコンに使用します。なければ担当者が作成します。',
    status: '提出済み', assignee: 'オーナー',
    uploadable: true, acceptTypes: '.png,.jpg,.ai,.svg',
  },

  // ── デザイン ──
  {
    id: 4, phase: 'デザイン',
    title: '店内・外観写真（3〜5枚）',
    reason: '実際の雰囲気が伝わると来店率が上がります。スマホ撮影でも大丈夫です。',
    status: '未提出', assignee: 'オーナー', deadline: '2026-03-25',
    uploadable: true, acceptTypes: 'image/*',
  },
  {
    id: 5, phase: 'デザイン',
    title: 'スタッフ紹介文・写真',
    reason: '「どんなスタッフがいるか」が見えると予約率が上がります。',
    status: '確認中', assignee: 'オーナー',
    uploadable: true, acceptTypes: 'image/*',
  },
  {
    id: 6, phase: 'デザイン',
    title: '公式SNSアカウントURL',
    reason: 'InstagramやLINEのリンクをサイトに設置します。',
    status: '提出済み', assignee: 'オーナー',
    uploadable: false,
  },

  // ── 制作 ──
  {
    id: 7, phase: '制作',
    title: 'Googleマイビジネス管理者権限',
    reason: '地図表示・レビュー管理のために必要です。担当者がサポートします。',
    status: '未提出', assignee: 'オーナー', deadline: '2026-04-01',
    uploadable: false,
  },
  {
    id: 8, phase: '制作',
    title: '営業時間・定休日（最新版）',
    reason: '公開直前に変更があると修正費用が発生します。正確な情報をご確認ください。',
    status: '提出済み', assignee: 'オーナー',
    uploadable: false,
  },

  // ── 納品 ──
  {
    id: 9, phase: '納品',
    title: '公開前の最終確認・承認',
    reason: '承認いただければ即日公開できます。問題なければ「確認しました」とご連絡ください。',
    status: '未提出', assignee: 'オーナー', deadline: '2026-04-10',
    uploadable: false,
  },
  {
    id: 10, phase: '納品',
    title: 'DNS設定情報（独自ドメイン移管先）',
    reason: '独自ドメインを使う場合のみ必要です。担当者が手順を案内します。',
    status: '不要', assignee: '担当者',
    uploadable: false,
  },
];

// ─── ユーティリティ ───────────────────────────────────────────────────────────

export function getChecklistByPhase(phase: Phase): ChecklistItem[] {
  return CHECKLIST_ITEMS.filter((c) => c.phase === phase);
}

export function getPendingOwnerItems(phase: Phase): ChecklistItem[] {
  return CHECKLIST_ITEMS.filter(
    (c) => c.phase === phase && c.assignee === 'オーナー' && c.status === '未提出'
  );
}

export function getWaitingStatus(phase: Phase): 'owner' | 'admin' {
  const pending = getPendingOwnerItems(phase);
  return pending.length > 0 ? 'owner' : 'admin';
}

// ─── 期限バッジ ───────────────────────────────────────────────────────────────

export function getDeadlineMeta(deadline: string): {
  label: string; color: string; bg: string; border: string;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(deadline);
  due.setHours(0, 0, 0, 0);
  const diff = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diff < 0)  return { label: '期限超過',  color: '#fff',    bg: '#dc2626', border: '#b91c1c' };
  if (diff === 0) return { label: '今日中',    color: '#fff',    bg: '#dc2626', border: '#b91c1c' };
  if (diff === 1) return { label: '明日まで',  color: '#fff',    bg: '#c2410c', border: '#9a3412' };
  if (diff <= 7)  return { label: '今週中',    color: '#92400e', bg: '#fef3c7', border: '#fde68a' };
  return                 { label: '余裕あり',  color: '#065f46', bg: '#d1fae5', border: '#a7f3d0' };
}
