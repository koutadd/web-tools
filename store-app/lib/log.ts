// ─── クライアントイベントログ ─────────────────────────────────────────────────
// 現在は console + localStorage に保存。将来は API 送信や analytics に差し替え可能。

export type LogEventName =
  | 'required_item_opened'
  | 'required_item_started'
  | 'consultation_opened'
  | 'consultation_created'
  | 'photo_guide_viewed'
  | 'task_completed';

export type LogEvent = {
  event: LogEventName;
  storeId?: string;
  itemId?: number | string;
  itemTitle?: string;
  ts: number;
};

const MAX_ENTRIES = 200;
const KEY = 'app_event_log';

export function logEvent(name: LogEventName, meta?: Omit<LogEvent, 'event' | 'ts'>) {
  if (typeof window === 'undefined') return;

  const entry: LogEvent = { event: name, ts: Date.now(), ...meta };

  // コンソール出力（開発確認用）
  console.debug('[log]', entry);

  // localStorage に積む
  try {
    const raw = localStorage.getItem(KEY);
    const arr: LogEvent[] = raw ? JSON.parse(raw) : [];
    arr.push(entry);
    if (arr.length > MAX_ENTRIES) arr.splice(0, arr.length - MAX_ENTRIES);
    localStorage.setItem(KEY, JSON.stringify(arr));
  } catch {
    // localStorage が使えない環境ではスキップ
  }
}

/** ログ一覧を取得（管理画面ログサマリ用） */
export function getEventLog(): LogEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** 指定イベント名の件数をカウント */
export function countEvents(name: LogEventName, log: LogEvent[]): number {
  return log.filter((e) => e.event === name).length;
}

/** 項目IDごとの相談数をカウント */
export function countByItem(name: LogEventName, log: LogEvent[]): Record<string, number> {
  return log
    .filter((e) => e.event === name && e.itemTitle)
    .reduce<Record<string, number>>((acc, e) => {
      const key = e.itemTitle!;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
}
