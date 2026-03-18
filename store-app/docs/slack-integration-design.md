# Slack連携 設計メモ

> 現時点では Slack への送信は未実装。
> `notification_events` テーブルに `status='pending'` のレコードを積むのみ。
> 将来ワーカー（cron job / background job）が `pending` を消費して Slack に送信する。

---

## 1. どのイベントを notification_events に積むか

| eventType                     | トリガー                          | 送信先想定              |
|-------------------------------|-----------------------------------|-------------------------|
| `required_item_submitted`     | オーナーが素材を提出した           | 管理者 Slack チャンネル |
| `required_item_approved`      | 管理者が提出を承認した             | オーナー Slack DM       |
| `required_item_rejected`      | 管理者が提出を却下した             | オーナー Slack DM       |
| `consultation_created`        | オーナーが相談を投稿した           | 管理者 Slack チャンネル |
| `consultation_answered`       | 管理者が相談に回答した             | オーナー Slack DM       |
| `who_waiting_changed`         | 誰待ち状態が変化した               | 担当者 Slack DM         |
| `task_completed`              | タスクが完了した                   | 管理者 Slack チャンネル |
| `deadline_overdue`            | 期限を超過した（日次バッチで検出） | 管理者 Slack チャンネル |

---

## 2. consultation と Slack thread の対応方針

- `Consultation.externalThreadKey` に Slack の `thread_ts`（スレッドID）を保存する
- 相談が作成された時点で Slack チャンネルに投稿 → レスポンスの `ts` を `externalThreadKey` に保存
- 管理者が回答した時点で、同 thread に返信（`thread_ts` を使用）
- `Consultation.status = 'closed'` になったら Slack スレッドに解決マークを付ける（絵文字リアクション等）

### フロー例

```
1. オーナー → POST /api/consultations
   → NotificationEvent: consultation_created (status=pending)
   
2. ワーカーが pending を検出 → Slack #admin-channel に投稿
   → Slackレスポンス: { ts: "1234567890.123456" }
   → PATCH /api/consultations/{id} で externalThreadKey="1234567890.123456" を保存

3. 管理者が回答 → PATCH /api/consultations/{id} (status=answered)
   → NotificationEvent: consultation_answered (status=pending)
   
4. ワーカーが pending を検出 → Slack の thread_ts に返信
   → オーナーに DM 通知
```

---

## 3. owner/admin と Slack user/channel の将来マッピング方針

現時点では `Store` に Slack ユーザー/チャンネルの情報は持っていない。
将来的には以下のいずれかを追加する:

### 案 A: Store に直接持つ（シンプル）

```sql
-- Store テーブルに追加
slackOwnerUserId  String @default("")  -- オーナーの Slack user ID
slackAdminChannel String @default("")  -- 管理者通知チャンネル
```

### 案 B: 別テーブルで管理（拡張性高い）

```sql
model StoreSlackConfig {
  id                String @id @default(cuid())
  storeId           String @unique
  ownerSlackUserId  String @default("")   -- オーナーの Slack user_id
  adminSlackChannel String @default("")   -- 管理者通知先チャンネル ID
  botTokenKey       String @default("")   -- Vault/環境変数キー（トークン本体は保存しない）
}
```

**推奨: 案 B**（複数店舗で異なる Slack ワークスペースに対応できる）

---

## 4. notification_events の destinationKey

- `destinationKey` フィールドに Slack channel ID または user ID を保存する
- ワーカーはこのフィールドを見て送信先を判断する
- 未設定（空文字）の場合はデフォルトの管理者チャンネルに送信する

---

## 5. payloadJson フォーマット（Slack Block Kit）

```json
{
  "text": "【アイケアラボ 駒込店】店舗外観写真 が提出されました",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*【アイケアラボ 駒込店】*\n店舗外観写真 が提出されました。確認してください。"
      }
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": { "type": "plain_text", "text": "確認する" },
          "url": "https://yourapp.example/admin/stores/{storeId}/required-items/{itemId}"
        }
      ]
    }
  ]
}
```

---

## 6. 実装順序（将来）

1. `StoreSlackConfig` テーブル追加 + 管理画面で Slack 設定 UI
2. Slack Bot Token を環境変数（`SLACK_BOT_TOKEN`）で管理
3. ワーカー関数: `lib/slackWorker.ts` → pending な NotificationEvent を取得 → Slack API 呼び出し
4. cron job または Vercel Cron で定期実行（5〜10分間隔）
5. `Consultation.externalThreadKey` を利用したスレッド返信実装

---

## 7. 取らないイベント（ログ過多防止）

- 全キー入力・マウス移動・hover
- ページ内スクロール量
- 毎秒の滞在時間
- 自動保存のたびのログ

意味のある節目（提出・承認・却下・相談・解決・誰待ち変更）のみを記録する。
