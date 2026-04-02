/**
 * Google Drive 重複フォルダ統合 Web UI サーバー
 * ポート 3000 で起動。
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { runScan, runDryRun, runApply } from './index.js';
import { log } from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const TOKEN_PATH = path.join(__dirname, 'token.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ===== ヘルパー =====

function asyncHandler(fn) {
  return (req, res) => {
    fn(req, res).catch((err) => {
      log.error(`API エラー: ${err.message}`);
      // エラーメッセージを日本語に変換
      const msg = translateError(err.message);
      res.status(500).json({ error: msg, detail: err.message });
    });
  };
}

/** 技術的エラーメッセージを日本語に変換 */
function translateError(msg) {
  if (msg.includes('credentials.json')) return 'credentials.json がありません。Google Cloud Console で OAuth2 クライアント ID を作成し、このフォルダに保存してください。';
  if (msg.includes('token.json') || msg.includes('invalid_grant')) return 'OAuth 認証がまだ完了していません。「npm run auth」を実行してください。';
  if (msg.includes('invalid_client')) return 'credentials.json の内容が正しくありません。OAuth2 クライアント ID を確認してください。';
  if (msg.includes('ENOENT')) return 'ファイルが見つかりません。';
  if (msg.includes('folder')) return 'フォルダが見つかりません。フォルダ ID または URL を確認してください。';
  return msg;
}

/** Google Drive URL または ID からフォルダ ID を抽出 */
function extractFolderId(input) {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // URL パターン: /folders/<id> を抽出
  const urlMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (urlMatch) return urlMatch[1];

  // 直接 ID（英数字・ハイフン・アンダースコア、20文字以上）
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) return trimmed;

  return null; // 不正
}

/** リクエストからフォルダ ID を取得（URL も受け付ける） */
function rootId(req) {
  const raw = req.body?.rootFolderId?.trim();
  if (!raw) return null;
  return extractFolderId(raw);
}

/** 認証状態チェック */
function getAuthStatus() {
  const credentialsExists = fs.existsSync(CREDENTIALS_PATH);
  const tokenExists = fs.existsSync(TOKEN_PATH);
  return {
    credentialsExists,
    tokenExists,
    authReady: credentialsExists && tokenExists,
    appRoot: __dirname,
    credentialsPath: CREDENTIALS_PATH,
    tokenPath: TOKEN_PATH,
  };
}

/** 認証チェックミドルウェア */
function requireAuth(req, res, next) {
  const { credentialsExists, tokenExists } = getAuthStatus();
  if (!credentialsExists) {
    return res.status(401).json({ error: 'credentials.json がありません。Google Cloud Console で OAuth2 クライアント ID を作成し、このフォルダに保存してください。' });
  }
  if (!tokenExists) {
    return res.status(401).json({ error: 'OAuth 認証が完了していません。ターミナルで「npm run auth」を実行してください。' });
  }
  next();
}

// ===== API エンドポイント =====

/** GET /health — 死活確認 */
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

/** GET /status — 認証状態確認 */
app.get('/status', (req, res) => {
  res.json(getAuthStatus());
});

/**
 * POST /validate-folder
 * 入力値（URL or ID）を検証してフォルダ ID を返す
 */
app.post('/validate-folder', (req, res) => {
  const raw = req.body?.input?.trim() || '';
  if (!raw) return res.json({ ok: true, folderId: null, message: '空欄 = My Drive 直下を検索します' });

  const id = extractFolderId(raw);
  if (!id) {
    return res.status(400).json({
      ok: false,
      error: 'フォルダ ID または Google Drive フォルダ URL を入力してください。\n例: https://drive.google.com/drive/folders/1AbCd... または 1AbCd...',
    });
  }
  res.json({ ok: true, folderId: id });
});

/**
 * POST /scan
 * 重複フォルダ一覧を返す（移動なし）
 */
app.post('/scan', requireAuth, asyncHandler(async (req, res) => {
  const id = rootId(req);
  log.info(`POST /scan folderId=${id ?? '(未指定)'}`);
  const groups = await runScan(id);
  res.json({ groups });
}));

/**
 * POST /dry-run
 * 移動予定アクション一覧を返す（移動なし）
 */
app.post('/dry-run', requireAuth, asyncHandler(async (req, res) => {
  const id = rootId(req);
  log.info(`POST /dry-run folderId=${id ?? '(未指定)'}`);
  const result = await runDryRun(id);
  res.json(result);
}));

/**
 * POST /apply
 * 実際にファイルを移動する
 */
app.post('/apply', requireAuth, asyncHandler(async (req, res) => {
  const id = rootId(req);
  log.info(`POST /apply folderId=${id ?? '(未指定)'}`);
  const result = await runApply(id);
  res.json(result);
}));

// ===== 起動 =====

app.listen(PORT, () => {
  const status = getAuthStatus();
  console.log('='.repeat(50));
  console.log('  Google Drive 重複フォルダ統合 Web UI');
  console.log(`  http://localhost:${PORT}`);
  console.log('='.repeat(50));
  console.log(`  credentials.json: ${status.credentialsExists ? '✅ あり' : '❌ なし'}`);
  console.log(`  token.json:       ${status.tokenExists ? '✅ あり' : '❌ なし（npm run auth を実行）'}`);
  console.log('='.repeat(50));
});
