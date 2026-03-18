/**
 * Slack Webhook ヘルパー
 *
 * SLACK_WEBHOOK_URL 環境変数が設定されていない場合は何もしない（エラーにならない）
 */

export async function notifySlack(
  storeName: string,
  userType: string,
  authorName: string,
  text: string,
): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const who = userType === 'owner'
    ? `オーナー${authorName ? ` (${authorName})` : ''}`
    : `管理者${authorName ? ` (${authorName})` : ''}`;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `*${storeName}* / ${who}\n${text}`,
      }),
    });
  } catch {
    // Slack 通知失敗はサイレントエラー（メッセージ保存には影響させない）
    console.warn('[slack] 通知失敗（続行）');
  }
}
