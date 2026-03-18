/**
 * suggestionEngine.ts
 * ルールベース提案エンジン
 *
 * 役割:
 *   1. static rules（lib/suggestionRules.ts）→ DB upsert（呼び出し側が実施）
 *   2. dynamic alerts → 毎リクエスト計算（DBに保存しない）
 *      - 未完了タスク先頭 (next_action)
 *      - upload_destination 未設定 (missing_info_alert)
 *      - required_items 未提出 (missing_info_alert)
 *      - open consultations (consultation_prompt)
 */

export type DynamicAlert = {
  alertType: 'next_action' | 'missing_info_alert' | 'consultation_prompt';
  audience: 'owner' | 'admin';
  title: string;
  description: string;
  reason: string;
  priority: number;
  dueLabel: string;
  // 関連データへのリンク情報
  ref?: { type: string; id: string };
};

export type SuggestionEngineInput = {
  store: {
    id: string;
    name: string;
    currentPhase: string;
    memo: string;
  };
  tasks: {
    id: string;
    title: string;
    done: boolean;
    phase: string;
  }[];
  requiredItems: {
    id: string;
    label: string;
    category: string;
    requiredPhase: string;
    status: string;
    whoWaiting: string;
  }[];
  uploadDestination: { isConfigured: boolean } | null;
  consultations: { id: string; status: string }[];
};

/**
 * 現在の状態から動的アラートを生成する純粋関数
 * DB へのアクセスはしない
 */
export function computeDynamicAlerts(input: SuggestionEngineInput): DynamicAlert[] {
  const { store, tasks, requiredItems, uploadDestination, consultations } = input;
  const phase = store.currentPhase;
  const alerts: DynamicAlert[] = [];

  // ─── 1. 未完了タスク先頭（次にやること）───────────────────────────

  const nextTask = tasks.find((t) => !t.done);
  if (nextTask) {
    alerts.push({
      alertType: 'next_action',
      audience: 'admin',
      title: `次の作業: ${nextTask.title}`,
      description: `フェーズ「${nextTask.phase}」の未完了タスクが残っています。`,
      reason: 'これが現在の最優先作業です。',
      priority: 0,
      dueLabel: '今すぐ',
      ref: { type: 'task', id: nextTask.id },
    });
  }

  // ─── 2. ファイル保存先 未設定（管理者向け）──────────────────────────

  if (!uploadDestination || !uploadDestination.isConfigured) {
    alerts.push({
      alertType: 'missing_info_alert',
      audience: 'admin',
      title: 'ファイル保存先が未設定です',
      description:
        'Google Drive等の保存先フォルダURLを設定してください。' +
        '設定が完了すると、提出ファイルの管理場所がオーナーと共有されます。',
      reason: '保存先未設定のままでは、提出ファイルの管理場所が不明確になります。',
      priority: 1,
      dueLabel: '早急に対応',
    });
  }

  // ─── 3. required_items 未提出（現在フェーズ分をオーナーに通知）───────

  const pendingItems = requiredItems.filter(
    (item) =>
      item.status === 'pending' &&
      item.requiredPhase === phase &&
      item.whoWaiting === 'owner',
  );

  for (const item of pendingItems.slice(0, 3)) {
    alerts.push({
      alertType: 'missing_info_alert',
      audience: 'owner',
      title: `未提出: 「${item.label}」`,
      description: `現在フェーズ（${phase}）に必要な「${item.label}」がまだ提出されていません。`,
      reason: 'この情報がないと次の工程に進めない可能性があります。',
      priority: 2,
      dueLabel: `${phase}中に提出`,
      ref: { type: 'required_item', id: item.id },
    });
  }

  // ─── 4. 未回答の相談（管理者向け）──────────────────────────────────

  const openConsultations = consultations.filter((c) => c.status === 'open');
  if (openConsultations.length > 0) {
    alerts.push({
      alertType: 'consultation_prompt',
      audience: 'admin',
      title: `未回答の相談が ${openConsultations.length} 件あります`,
      description: 'オーナーからの相談に未回答のものがあります。早めに対応してください。',
      reason: '相談への対応が遅れるとオーナーの信頼に影響します。',
      priority: 3,
      dueLabel: '優先対応',
    });
  }

  // ─── 5. memo 未入力（管理者向け）────────────────────────────────────

  if (!store.memo || store.memo.trim() === '') {
    alerts.push({
      alertType: 'missing_info_alert',
      audience: 'admin',
      title: '店舗メモが未入力です',
      description: 'クライアント固有の要望や注意点をメモに記入してください。',
      reason: 'メモがないと担当者が変わったときに引き継ぎが困難になります。',
      priority: 4,
      dueLabel: '早めに記入',
    });
  }

  return alerts;
}

/**
 * 保存先が設定済みかどうかを判定するユーティリティ
 * GET /api/stores/[storeId]/upload-destination で使用
 */
export function isUploadConfigured(dest: { isConfigured: boolean } | null): boolean {
  return dest?.isConfigured === true;
}
