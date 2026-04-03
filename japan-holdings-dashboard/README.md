# 日本のホールディングス・グループ企業ダッシュボード

社名に「ホールディングス」または「グループ」を含む日本の主要企業50社をまとめた一覧ダッシュボードです。

## 機能

- **検索**: 会社名・かな・業種でリアルタイム絞り込み
- **フィルター**: すべて / ホールディングス / グループ で切り替え
- **並び替え**: 優先順位順 / 会社名順

## セットアップ

```bash
npm install
npm run collect   # data/companies.json を生成
npm run dev       # 開発サーバー起動 (http://localhost:3000)
```

## データ

`data/companies.json` に50社分のデータが格納されています。`npm run collect` を実行すると `scripts/collect-companies.ts` からデータが生成されます。

## 技術スタック

- Next.js 14 (App Router)
- React 18
- TypeScript
