export type Phase = '企画' | 'デザイン' | '制作' | '納品';

export const PHASES: Phase[] = ['企画', 'デザイン', '制作', '納品'];

export type Task = {
  id: string;
  title: string;
  done: boolean;
  phase: Phase;
};

export type Store = {
  id: string;
  name: string;
  contactName: string;
  location: string;
  currentPhase: Phase;
  startDate: string;
  deadline: string;
  memo: string;
  tasks: Task[];
};

// ─── 一覧API レスポンス型（GET /api/stores が返す形）────────────────────────
// 一覧ではタスク全件の代わりに件数のみ返す（パフォーマンス配慮）
export type StoreListItem = {
  id: string;
  name: string;
  contactName: string;
  location: string;
  currentPhase: Phase;
  startDate: string;
  deadline: string;
  memo: string;
  taskCount: number;
  taskDoneCount: number;
};

export function getPhaseIndex(phase: Phase): number {
  return PHASES.indexOf(phase);
}

export function calcProgress(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  return Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100);
}
