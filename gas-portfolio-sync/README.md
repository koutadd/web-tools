# アイケアラボ 制作物PDF自動収集システム

## 概要

管理シートに登録された制作物フォルダを巡回し、`アウトプット` フォルダ内の最新PDFを自動収集して `gallery_data` シートに同期する Google Apps Script。

---

## フォルダ階層の前提

```
共有アイテム
 └── 2.データ
      └── 02_クリエイティブ制作物   ← ROOT_FOLDER_ID に設定するフォルダ
           ├── 109_四ツ谷店_チラシ
           │    └── アウトプット
           │         └── ○○チラシ_v3.pdf  ← 最新1件を採用
           ├── 110_新宿店_のぼり
           │    └── アウトプット
           └── ...
```

---

## 初回セットアップ手順

### 1. Google Apps Script プロジェクトを作成

1. 対象のスプレッドシートを開く
2. メニュー「拡張機能」→「Apps Script」をクリック
3. `Code.gs` の内容を貼り付けて保存（Ctrl+S）

### 2. `ROOT_FOLDER_ID` を設定する

```javascript
// Code.gs の CONFIG オブジェクト内
ROOT_FOLDER_ID: '1AbCdEfGhIjKlMnOpQrStUvWxYz', // ★ ここを変更
```

**取得方法:**
Google Drive で `02_クリエイティブ制作物` フォルダを開く
→ URL の末尾が ID: `https://drive.google.com/drive/folders/【ここをコピー】`

### 3. 管理シートの列番号を設定する

```javascript
MGMT_COL: {
  ITEM_ID:                1,  // A列
  TITLE:                  2,  // B列
  CATEGORY:               3,  // C列
  STORE_NAME:             4,  // D列
  STATUS:                 5,  // E列
  PRODUCTION_FOLDER_NAME: 6,  // F列  ← 実際の列に合わせる
},
```

### 4. 権限を承認する

Apps Script エディタで任意の関数（例: `testRootFolder`）を実行
→ 権限確認ダイアログが表示されるので「許可」する

必要な権限:
- Google ドライブの読み取り
- スプレッドシートの読み書き
- スクリプトのトリガー作成

### 5. ルートフォルダの疎通確認

スプレッドシートのカスタムメニュー「📁 PDFギャラリー」→「🔍 ルートフォルダ確認」
→ 「✅ ルートフォルダ確認OK」が表示されれば OK

### 6. 初回全件同期

メニュー「📁 PDFギャラリー」→「▶ 初回全件同期」
→ 管理シートの全行を走査し、`gallery_data` シートに反映される

### 7. 2時間トリガーを設定する

メニュー「📁 PDFギャラリー」→「⏱ 2時間トリガー再作成」
→ 以後は2時間ごとに自動で `refreshChangedItems` が実行される

### 8. Web App としてデプロイ（フロントエンド連携用）

1. Apps Script エディタ「デプロイ」→「新しいデプロイ」
2. 種類: 「ウェブアプリ」
3. 実行するユーザー: 「自分」
4. アクセスできるユーザー: 「全員」（社内公開の場合は組織内に限定）
5. デプロイ後に表示される URL を控える

---

## 運用手順

### 通常運用

特に何もしなくてよい。2時間ごとに自動で差分同期される。

### 新しい制作物を追加した場合

管理シートに行を追加するだけ。次の自動巡回（最大2時間後）で反映される。
すぐ反映したい場合はメニュー「🔄 全件再同期」を実行。

### PDFを差し替えた場合

`アウトプット` フォルダ内のPDFを差し替えると、次の巡回時に自動で最新版に更新される（更新日時が最新のPDFを採用するため）。

### トリガーが消えた場合

メニュー「⏱ 2時間トリガー再作成」を実行。

---

## gallery_data シートの列一覧

| 列名 | 内容 |
|---|---|
| item_id | 制作物ID（一意キー）|
| title | 制作物名 |
| category | ジャンル |
| store_name | 店舗名 |
| status | ステータス |
| production_folder_name | 制作物フォルダ名 |
| source_folder_url | 制作物フォルダのURL |
| output_folder_url | アウトプットフォルダのURL |
| pdf_name | PDFファイル名 |
| pdf_url | PDFのGoogle DriveのURL |
| pdf_updated_at | PDFの最終更新日時 (ISO 8601) |
| last_synced_at | 最終同期日時 (ISO 8601) |
| sync_status | 同期ステータス（下表参照）|
| sync_message | エラーメッセージ等 |

### sync_status の値

| 値 | 意味 |
|---|---|
| `ok` | 正常に PDF を取得できた |
| `skipped` | フォルダ名が未設定のためスキップ |
| `missing_folder` | 制作物フォルダが見つからない |
| `missing_output_folder` | アウトプットフォルダが見つからない |
| `missing_pdf` | PDF が見つからない |
| `error` | 予期しないエラー |

---

## Web App の JSON レスポンス形式

```json
{
  "ok": true,
  "count": 42,
  "data": [
    {
      "item_id": "109",
      "title": "四ツ谷店チラシ",
      "category": "チラシ",
      "store_name": "四ツ谷店",
      "status": "active",
      "production_folder_name": "109_四ツ谷店_チラシ",
      "pdf_name": "四ツ谷店チラシ_v3.pdf",
      "pdf_url": "https://drive.google.com/file/d/xxx/view",
      "pdf_updated_at": "2026-03-10T12:34:56.000Z",
      "last_synced_at": "2026-03-11T08:00:00.000Z",
      "sync_status": "ok",
      "sync_message": ""
    }
  ]
}
```

クエリパラメータ:
- `?status=active` → `sync_status` が `ok` のみ返す
- `?category=チラシ` → カテゴリで絞り込む

---

## 想定エラーと対処法

| エラー | 原因 | 対処法 |
|---|---|---|
| `ROOT_FOLDER_ID でフォルダを取得できません` | IDが間違っている、またはアクセス権なし | フォルダIDを再確認、スクリプト実行者をフォルダ共有に追加 |
| `管理シート "xxx" が見つかりません` | シート名の不一致 | `CONFIG.MANAGEMENT_SHEET` を実際のシート名に合わせる |
| `制作物フォルダ "xxx" が見つかりません` | フォルダ名の表記ゆれ | 管理シートの `production_folder_name` と Drive のフォルダ名を一致させる |
| `"アウトプット" フォルダが見つかりません` | フォルダ未作成、または名前が違う | Driveに「アウトプット」フォルダを作成する |
| `PDF が見つかりません` | PDFが未格納 | アウトプットフォルダにPDFを入れる |
| `予期しないエラー` | Drive API の一時的なエラー等 | しばらく待って再実行。繰り返す場合はログを確認 |
| トリガーが実行されない | トリガーが削除されている | 「2時間トリガー再作成」を実行 |

---

## テスト手順

### Step 1: ルートフォルダ確認

```
メニュー「🔍 ルートフォルダ確認」→ Apps Script ログを確認
```
- ✅ フォルダ名とIDが表示される → OK
- ❌ エラー → `ROOT_FOLDER_ID` を確認

### Step 2: 1件だけテスト同期

Code.gs の `testSyncOne()` 関数内の `ITEM_ID_TO_TEST` を実際の item_id に書き換えて実行。

```javascript
function testSyncOne() {
  const ITEM_ID_TO_TEST = '109'; // ← 変更
  ...
}
```

ログで結果を確認:
```
OK [109]: 四ツ谷店チラシ_v3.pdf
```

### Step 3: 全件バックフィル

```
メニュー「▶ 初回全件同期」→ gallery_data シートを確認
```

- `sync_status` が `ok` の行が想定件数あれば OK
- エラー行は `sync_message` を確認して個別対処

### Step 4: Web App 疎通確認

デプロイ後の URL をブラウザで開いて JSON が返ることを確認:
```
https://script.google.com/macros/s/xxxx/exec
```

---

## 共有ドライブ対応について

現在の実装は標準 `DriveApp` を使用しており、共有ドライブ（Shared Drive / Teamdrive）の場合は `ROOT_FOLDER_ID` を直接指定することで動作します。

`DriveApp.getFoldersByName()` による名前検索は「マイドライブ」のみ対象のため、共有ドライブ配下は **ROOT_FOLDER_ID を必ず設定**してください。
