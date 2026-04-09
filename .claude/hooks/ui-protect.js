#!/usr/bin/env node
/**
 * ui-protect.js — 既存UI保護フック
 * Claude Code PreToolUse フックとして動作
 * 保護対象ファイルへの編集時に警告メッセージを出力する（denyではなく警告）
 */

const filePath = process.argv[2] || '';
const toolName = process.argv[3] || '';

// 保護対象ファイル（既存UIの基盤）
const PROTECTED_FILES = [
  'aicare-stores.html',
  'aicare-lab-app.html',
  'aicare-projects.html',
  'aicare-schedule.html',
  'aicare-sitemap.html',
  'index.html',
];

// ファイル名だけ取り出す
const fileName = filePath.split('/').pop() || filePath;

const isProtected = PROTECTED_FILES.some(f => fileName === f || filePath.endsWith('/' + f));

if (isProtected) {
  // stderr に警告（Claude に見える）
  process.stderr.write(`
[UI保護フック] 保護対象ファイルへの編集検出
ファイル: ${filePath}
ツール: ${toolName}

このファイルは「基準版 ui-baseline-v1」で保護されています。
-------------------------------------------------------------
確認事項:
  1. この変更は既存UIを壊しませんか？
  2. 新規ファイルで対応できませんか？
  3. ユーザーから「全面改修OK」の明示指示はありますか？

→ 差分追加（既存構造を崩さない最小変更）のみ許可
→ 全面置き換え・レイアウト変更は原則禁止
-------------------------------------------------------------
`);
  // exit 0 = 警告のみ（blockしない）
  // exit 1 = deny（今は使わない）
  process.exit(0);
}

process.exit(0);
