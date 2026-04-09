# 保守・復旧ガイド — AICARE web-tools

## 基準版情報
| 項目 | 内容 |
|------|------|
| タグ | `ui-baseline-v1` / `app-baseline-v1` |
| 作成日 | 2026-04-09 |
| 説明 | 現行UIの基準スナップショット |

---

## 基準版に完全に戻す（全体）

```bash
# ローカルの全変更を基準版に戻す（未コミット変更は消える）
git checkout ui-baseline-v1
# または特定ブランチに戻す
git checkout main
git reset --hard ui-baseline-v1
```

---

## 特定ファイルだけ基準版に戻す

```bash
# 例: aicare-stores.html だけ戻す
git restore --source=ui-baseline-v1 aicare-stores.html

# 例: 複数ファイルを戻す
git restore --source=ui-baseline-v1 aicare-stores.html aicare-projects.html

# コミット済みのHEADに戻す（タグ前でもOK）
git restore aicare-stores.html
```

---

## 直近の変更だけ打ち消す（revert）

```bash
# 直近1コミットを打ち消す（履歴は残る）
git revert HEAD

# 特定コミットを打ち消す
git revert <commit-hash>
```

---

## 現在のタグ一覧確認

```bash
git tag -l
git show ui-baseline-v1 --stat
```

---

## feature ブランチ運用フロー

```bash
# 新機能作業開始
git checkout -b feature/store-new-function

# 作業・確認後
git add .
git commit -m "feat: ○○機能を追加"

# main にマージ（確認後）
git checkout main
git merge feature/store-new-function
git push origin main
```

---

## UI を崩したい場合の正式依頼方法

Claude Code に以下を明示的に伝えること:

> 「全面改修OK。○○ページのUIを作り直してください。」

これがない限り、Claude Code は既存UIを維持したまま差分追加のみ行います。

---

## 保護対象ファイル一覧

| ファイル | 説明 |
|---------|------|
| aicare-stores.html | 出店管理メインUI |
| aicare-lab-app.html | 出店管理（旧Lab）UI |
| aicare-projects.html | プロジェクト管理UI |
| aicare-schedule.html | スケジュールUI |
| aicare-sitemap.html | サイトマップ |
| index.html | トップページ |

---

## 事故防止チェックリスト

変更前:
- [ ] 編集対象ファイルが保護対象でないか確認
- [ ] 既存UIを壊さない変更か確認
- [ ] 新規ファイル追加で対応できないか検討

変更後:
- [ ] ブラウザで動作確認
- [ ] `vercel --prod` でデプロイ
- [ ] 本番URLで目視確認

---

## Vercel デプロイ

```bash
# 本番デプロイ
vercel --prod

# URL確認
open https://web-tools-black-iota.vercel.app/
```
