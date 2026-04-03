# 日本のホールディングス・グループ企業ロゴダッシュボード

日本の主要ホールディングス・グループ企業50社のロゴを一覧表示するダッシュボード。

## セットアップ

```bash
npm install
npm run setup:all   # データ検証 + ロゴ収集
npm run dev          # 開発サーバー起動 (http://localhost:3000)
```

## スクリプト

- `npm run collect` - companies.json の検証
- `npm run collect:logos` - 各社公式サイトからロゴを自動収集
- `npm run enrich:top20` - TOP20グループの子会社・ブランドロゴを収集
- `npm run verify:assets` - 収集済みアセットの存在確認・JSON更新
