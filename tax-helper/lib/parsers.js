/**
 * lib/parsers.js — カード別CSVパーサー
 * 対応: 楽天, エポス, 三井住友(Vpass), PayPayカード
 *
 * CSVファイルは csv/ フォルダに以下の名前で保存:
 *   csv/rakuten_*.csv
 *   csv/epos_*.csv
 *   csv/smbc_*.csv
 *   csv/paypay_*.csv
 */
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import iconv from 'iconv-lite';

/**
 * 共通の明細フォーマット:
 * { date: 'YYYY-MM-DD', description: string, amount: number, source: string }
 */

function readFile(filePath, encoding = 'shift_jis') {
  const buf = fs.readFileSync(filePath);
  return iconv.decode(buf, encoding);
}

function parseDate(str) {
  if (!str) return null;
  // YYYY/MM/DD → YYYY-MM-DD
  const m = str.trim().match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (m) return `${m[1]}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`;
  return str.trim();
}

function parseAmount(str) {
  if (!str) return 0;
  return parseInt(str.replace(/[¥,\s]/g, ''), 10) || 0;
}

// ─────────────────────────────────────────
// 楽天カード
// 列: 利用日, 利用店名・商品名, 利用者, 支払方法, 利用金額, 支払金額
// エンコード: Shift-JIS
// ─────────────────────────────────────────
export function parseRakuten(filePath) {
  const content = readFile(filePath, 'shift_jis');
  // ヘッダー行を探す（「利用日」が含まれる行から）
  const lines = content.split('\n');
  const headerIdx = lines.findIndex(l => l.includes('利用日') && l.includes('利用店名'));
  if (headerIdx < 0) throw new Error(`楽天CSVのヘッダーが見つかりません: ${filePath}`);

  const csv = lines.slice(headerIdx).join('\n');
  const records = parse(csv, { columns: true, skip_empty_lines: true, relax_quotes: true });

  return records.map(r => ({
    date: parseDate(r['利用日']),
    description: (r['利用店名・商品名'] || r['利用店名'] || '').trim(),
    amount: parseAmount(r['利用金額']),
    source: '楽天カード',
  })).filter(r => r.date && r.amount > 0);
}

// ─────────────────────────────────────────
// エポスカード
// 列: 年月日, ご利用内容, ご利用金額（円）, お支払い区分, お支払い回数, 今回お支払い金額
// エンコード: Shift-JIS
// ─────────────────────────────────────────
export function parseEpos(filePath) {
  const content = readFile(filePath, 'shift_jis');
  const lines = content.split('\n');
  const headerIdx = lines.findIndex(l => l.includes('年月日') || l.includes('ご利用内容'));
  if (headerIdx < 0) throw new Error(`エポスCSVのヘッダーが見つかりません: ${filePath}`);

  const csv = lines.slice(headerIdx).join('\n');
  const records = parse(csv, { columns: true, skip_empty_lines: true, relax_quotes: true });

  return records.map(r => ({
    date: parseDate(r['年月日']),
    description: (r['ご利用内容'] || '').trim(),
    amount: parseAmount(r['ご利用金額（円）'] || r['ご利用金額']),
    source: 'エポスカード',
  })).filter(r => r.date && r.amount > 0);
}

// ─────────────────────────────────────────
// 三井住友カード（Vpass）
// 列: お支払い日, ご利用日, ご利用店名, 支払い区分, ご利用金額(円), ...
// エンコード: Shift-JIS
// ─────────────────────────────────────────
export function parseSmbc(filePath) {
  const content = readFile(filePath, 'shift_jis');
  const lines = content.split('\n');
  const headerIdx = lines.findIndex(l => l.includes('ご利用日') || l.includes('ご利用店名'));
  if (headerIdx < 0) throw new Error(`三井住友CSVのヘッダーが見つかりません: ${filePath}`);

  const csv = lines.slice(headerIdx).join('\n');
  const records = parse(csv, { columns: true, skip_empty_lines: true, relax_quotes: true });

  return records.map(r => ({
    date: parseDate(r['ご利用日']),
    description: (r['ご利用店名'] || '').trim(),
    amount: parseAmount(r['ご利用金額(円)'] || r['ご利用金額（円）'] || r['ご利用金額']),
    source: '三井住友カード',
  })).filter(r => r.date && r.amount > 0);
}

// ─────────────────────────────────────────
// PayPayカード
// 列: 利用日, 利用店名, 利用金額（円）, 支払方法, 還元予定ポイント数
// エンコード: UTF-8
// ─────────────────────────────────────────
export function parsePaypay(filePath) {
  const content = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''); // BOM除去
  const lines = content.split('\n');
  const headerIdx = lines.findIndex(l => l.includes('利用日') && l.includes('利用店名'));
  if (headerIdx < 0) throw new Error(`PayPayカードCSVのヘッダーが見つかりません: ${filePath}`);

  const csv = lines.slice(headerIdx).join('\n');
  const records = parse(csv, { columns: true, skip_empty_lines: true, relax_quotes: true });

  return records.map(r => ({
    date: parseDate(r['利用日']),
    description: (r['利用店名'] || '').trim(),
    amount: parseAmount(r['利用金額（円）'] || r['利用金額']),
    source: 'PayPayカード',
  })).filter(r => r.date && r.amount > 0);
}
