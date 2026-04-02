/**
 * ============================================================
 *  request_id 管理モジュール
 *  アイケアラボ 依頼管理システム
 *  ── 行番号依存を排除し、request_id を唯一の更新キーとする ──
 * ============================================================
 */

// ============================================================
//  設定
// ============================================================

const REQUEST_ID_CFG = {
  /** request_id を付与する対象シート名 */
  TARGET_SHEETS: ['依頼シート', '管理シート'],

  /** request_id 列のヘッダー名（統一） */
  REQUEST_ID_HEADER: 'request_id',

  /**
   * 有効行判定: いずれか1列でも値があれば有効行とみなす。
   * ヘッダー名が1つも見つからない場合は先頭列（A列）の値で判定（フォールバック）。
   */
  REQUIRED_FIELDS_MAP: {
    '依頼シート': ['店舗', '制作物'],
    // 管理シートは英語・日本語両方を列挙（実際のヘッダー名に合わせて調整）
    '管理シート': ['item_id', 'ITEM_ID', '制作物ID', 'title', 'store_name', '制作物名', '店舗名'],
  },

  /** ヘッダー行番号（依頼シートは行1が説明行のため行2がヘッダー） */
  HEADER_ROW: 2,

  /** データ開始行 */
  DATA_START_ROW: 3,
};

// ============================================================
//  request_id 生成
// ============================================================

/**
 * 衝突しにくい request_id を生成する。
 * 形式: req_ + 16桁ランダム英数字
 * 例:   req_a8f29c1d7b4e3f91
 * 禁止: 行番号・連番のみ・変動するID
 */
function generateRequestId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = 'req_';
  for (let i = 0; i < 16; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

// ============================================================
//  ヘッダー操作ユーティリティ
// ============================================================

/**
 * ヘッダー名 → 列インデックス（1始まり）を返す。
 * 見つからない場合は -1。
 */
function getColIndexByHeader_(sheet, headerName) {
  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) return -1;
  // HEADER_ROW を優先して検索、見つからなければ行1をフォールバック
  const headers = sheet.getRange(REQUEST_ID_CFG.HEADER_ROW, 1, 1, lastCol).getValues()[0];
  const idx = headers.findIndex(h => String(h).trim() === headerName);
  if (idx !== -1) return idx + 1;
  // フォールバック: 行1も検索（過去バージョンとの互換性）
  if (REQUEST_ID_CFG.HEADER_ROW !== 1) {
    const row1Headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const idx1 = row1Headers.findIndex(h => String(h).trim() === headerName);
    if (idx1 !== -1) return idx1 + 1;
  }
  return -1;
}

/**
 * シートのヘッダー名 → 列インデックス（1始まり）マップを返す。
 */
function getHeaderMap_(sheet) {
  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) return {};
  const headers = sheet.getRange(REQUEST_ID_CFG.HEADER_ROW, 1, 1, lastCol).getValues()[0];
  const map = {};
  headers.forEach((h, i) => {
    if (h) map[String(h).trim()] = i + 1;
  });
  return map;
}

// ============================================================
//  有効行判定
// ============================================================

/**
 * 指定行が「有効なデータ行」かどうかを判定する。
 * REQUIRED_FIELDS のいずれかに値があれば有効。
 * ステータス（完了等）は関係なく判定する。
 *
 * @param {Array}  rowValues  1行分の値配列
 * @param {Object} headerMap  ヘッダー名→列インデックスマップ
 * @param {string} sheetName  シート名（判定フィールドを切り替えるため）
 */
function isDataRow(rowValues, headerMap, sheetName) {
  const fields = REQUEST_ID_CFG.REQUIRED_FIELDS_MAP[sheetName]
    || REQUEST_ID_CFG.REQUIRED_FIELDS_MAP['依頼シート'];

  // ヘッダー名マッチで判定
  const matchedByHeader = fields.some(field => {
    const colIdx = headerMap[field];
    if (!colIdx) return false;
    const val = rowValues[colIdx - 1];
    return val !== null && val !== undefined && String(val).trim() !== '';
  });
  if (matchedByHeader) return true;

  // フォールバック: ヘッダー名が1つも見つからなかった場合、先頭列（A列）の値で判定
  const anyHeaderMatched = fields.some(f => !!headerMap[f]);
  if (!anyHeaderMatched) {
    const firstColVal = rowValues[0];
    return firstColVal !== null && firstColVal !== undefined && String(firstColVal).trim() !== '';
  }
  return false;
}

// ============================================================
//  request_id 列の確保
// ============================================================

/**
 * シートに request_id 列がなければ末尾に追加する。
 * 列インデックス（1始まり）を返す。
 */
function ensureRequestIdColumn_(sheet) {
  let colIdx = getColIndexByHeader_(sheet, REQUEST_ID_CFG.REQUEST_ID_HEADER);
  if (colIdx !== -1) return colIdx;

  const newColIdx = sheet.getLastColumn() + 1;
  const headerCell = sheet.getRange(REQUEST_ID_CFG.HEADER_ROW, newColIdx);
  headerCell.setValue(REQUEST_ID_CFG.REQUEST_ID_HEADER);
  headerCell.setFontWeight('bold');
  headerCell.setBackground('#fef3c7'); // 視認性のため黄色背景
  Logger.log(`[request_id] "${sheet.getName()}" に request_id 列を追加しました (列${newColIdx})`);
  return newColIdx;
}

// ============================================================
//  1行への request_id 付与
// ============================================================

/**
 * 指定行に request_id を付与する（既存IDは絶対に変更しない）。
 *
 * @param  {Sheet}  sheet
 * @param  {number} rowNum           対象行番号（1始まり）
 * @param  {number} requestIdColIdx  request_id 列インデックス（1始まり）
 * @returns {string|null}  付与したID / スキップ時はnull
 */
function ensureRequestIdForRow(sheet, rowNum, requestIdColIdx) {
  const cell = sheet.getRange(rowNum, requestIdColIdx);
  const existing = String(cell.getValue() || '').trim();
  if (existing) return null; // 既存IDは絶対に変更しない

  const newId = generateRequestId();
  cell.setValue(newId);
  return newId;
}

// ============================================================
//  バックフィル（既存行への一括付与）
// ============================================================

/**
 * 指定シートの全データ行に request_id を付与する（冪等・再実行安全）。
 * - 完了行も含む
 * - 既存IDは変更しない
 * - 完全空行はスキップ
 *
 * @param  {Sheet}   sheet
 * @returns {Object}  実行結果サマリ
 */
function backfillRequestIds(sheet) {
  const sheetName = sheet.getName();
  const lastRow = sheet.getLastRow();

  if (lastRow < REQUEST_ID_CFG.DATA_START_ROW) {
    Logger.log(`[backfill] "${sheetName}" にデータ行がありません`);
    return { sheet: sheetName, total: 0, added: 0, skipped: 0, empty: 0, errors: 0 };
  }

  const requestIdColIdx = ensureRequestIdColumn_(sheet);
  const headerMap = getHeaderMap_(sheet);

  const numRows = lastRow - REQUEST_ID_CFG.DATA_START_ROW + 1;
  const numCols = sheet.getLastColumn();
  const allValues = sheet
    .getRange(REQUEST_ID_CFG.DATA_START_ROW, 1, numRows, numCols)
    .getValues();

  let added = 0, skipped = 0, empty = 0, errors = 0;

  for (let i = 0; i < allValues.length; i++) {
    const rowNum = i + REQUEST_ID_CFG.DATA_START_ROW;
    const rowValues = allValues[i];

    try {
      // 完全空行はスキップ（完了行もここでは除外しない）
      if (!isDataRow(rowValues, headerMap, sheetName)) {
        empty++;
        continue;
      }

      // 既存IDがあればスキップ（絶対に変更しない）
      const existingId = String(rowValues[requestIdColIdx - 1] || '').trim();
      if (existingId) {
        skipped++;
        continue;
      }

      // 新規付与
      const newId = generateRequestId();
      sheet.getRange(rowNum, requestIdColIdx).setValue(newId);
      added++;
      Logger.log(`[backfill] "${sheetName}" 行${rowNum}: ${newId} を付与`);

      // API制限回避（大量行の場合）
      if (added % 50 === 0) Utilities.sleep(300);

    } catch (e) {
      errors++;
      Logger.log(`[backfill] "${sheetName}" 行${rowNum} エラー: ${e.message}`);
    }
  }

  const result = { sheet: sheetName, total: numRows, added, skipped, empty, errors };
  Logger.log(`[backfill] "${sheetName}" 完了: ${JSON.stringify(result)}`);
  return result;
}

/**
 * 全対象シートをバックフィルする（カスタムメニューから実行）。
 * 完了行を含む全行が対象。
 */
function backfillAllSheets() {
  const ss = SpreadsheetApp.openById('14o-3G_-30qi4NCw-XhR4FaGGFNJhrlJF8ktL3DA7CJQ');
  const results = [];

  for (const sheetName of REQUEST_ID_CFG.TARGET_SHEETS) {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      Logger.log(`[backfill] シート "${sheetName}" が見つかりません`);
      results.push({ sheet: sheetName, error: 'シートが見つかりません' });
      continue;
    }
    results.push(backfillRequestIds(sheet));
  }

  Logger.log('=== backfillAllSheets 完了 ===\n' + JSON.stringify(results, null, 2));

  const summary = results.map(r =>
    r.error
      ? `❌ ${r.sheet}: ${r.error}`
      : `✅ ${r.sheet}: 付与${r.added}件 / 既存維持${r.skipped}件 / 空行スキップ${r.empty}件 / エラー${r.errors}件 (計${r.total}行)`
  ).join('\n');

  SpreadsheetApp.openById('14o-3G_-30qi4NCw-XhR4FaGGFNJhrlJF8ktL3DA7CJQ').toast(summary, '🔑 request_id バックフィル完了', 12);
  SpreadsheetApp.getUi().alert('バックフィル完了\n\n' + summary);
}

/**
 * 未採番行を監査する（採番なしで確認のみ）。
 */
function auditMissingIds() {
  const ss = SpreadsheetApp.openById('14o-3G_-30qi4NCw-XhR4FaGGFNJhrlJF8ktL3DA7CJQ');
  let report = '';

  for (const sheetName of REQUEST_ID_CFG.TARGET_SHEETS) {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) { report += `❌ シート "${sheetName}" が見つかりません\n`; continue; }

    const requestIdColIdx = getColIndexByHeader_(sheet, REQUEST_ID_CFG.REQUEST_ID_HEADER);
    const headerMap = getHeaderMap_(sheet);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) { report += `⚠ "${sheetName}" データなし\n`; continue; }

    const numRows = lastRow - 2 + 1;
    const numCols = sheet.getLastColumn();
    const values = sheet.getRange(2, 1, numRows, numCols).getValues();
    let missing = 0, total = 0;

    values.forEach((row, i) => {
      if (!isDataRow(row, headerMap, sheetName)) return;
      total++;
      const existingId = requestIdColIdx !== -1
        ? String(row[requestIdColIdx - 1] || '').trim()
        : '';
      if (!existingId) {
        missing++;
        Logger.log(`[audit] "${sheetName}" 行${i + 2}: request_id 未付与`);
      }
    });

    report += `📊 "${sheetName}": ${total} 有効行中 ${missing} 行が未採番\n`;
  }

  Logger.log('[audit] 結果:\n' + report);
  SpreadsheetApp.getUi().alert('監査結果\n\n' + report);
}

// ============================================================
//  onEdit トリガー（即時補完）
// ============================================================

/**
 * セル編集時に request_id が未付与なら即時付与する。
 * - 既存IDは上書きしない
 * - 有効行でなければ何もしない
 * - 二重採番防止（既存チェックで防止済み）
 */
function onEdit(e) {
  if (!e || !e.range) return;

  const sheet = e.range.getSheet();
  const sheetName = sheet.getName();

  // 対象シートのみ処理
  if (!REQUEST_ID_CFG.TARGET_SHEETS.includes(sheetName)) return;

  const editedRow = e.range.getRow();
  if (editedRow < REQUEST_ID_CFG.DATA_START_ROW) return; // ヘッダー行は無視

  const headerMap = getHeaderMap_(sheet);
  const numCols = sheet.getLastColumn();
  const rowValues = sheet.getRange(editedRow, 1, 1, numCols).getValues()[0];

  // 有効行でなければ何もしない
  if (!isDataRow(rowValues, headerMap, sheetName)) return;

  const requestIdColIdx = ensureRequestIdColumn_(sheet);

  // 既存IDがあればスキップ（二重採番防止）
  const existingId = String(
    sheet.getRange(editedRow, requestIdColIdx).getValue() || ''
  ).trim();
  if (existingId) return;

  const newId = generateRequestId();
  sheet.getRange(editedRow, requestIdColIdx).setValue(newId);
  Logger.log(`[onEdit] "${sheetName}" 行${editedRow}: ${newId} を自動付与`);
}

// ============================================================
//  定期補完トリガー（取りこぼし救済）
// ============================================================

/**
 * 定期実行: 未採番行を補完する。
 * onEdit だけでは取りこぼす追加方法（コピペ一括追加等）を救済。
 */
function periodicBackfill() {
  Logger.log(`[periodicBackfill] 開始 ${new Date().toISOString()}`);
  const ss = SpreadsheetApp.openById('14o-3G_-30qi4NCw-XhR4FaGGFNJhrlJF8ktL3DA7CJQ');

  for (const sheetName of REQUEST_ID_CFG.TARGET_SHEETS) {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) continue;

    const requestIdColIdx = ensureRequestIdColumn_(sheet);
    const headerMap = getHeaderMap_(sheet);
    const lastRow = sheet.getLastRow();
    if (lastRow < REQUEST_ID_CFG.DATA_START_ROW) continue;

    const numRows = lastRow - REQUEST_ID_CFG.DATA_START_ROW + 1;
    const numCols = sheet.getLastColumn();
    const values = sheet
      .getRange(REQUEST_ID_CFG.DATA_START_ROW, 1, numRows, numCols)
      .getValues();
    let filled = 0;

    for (let i = 0; i < values.length; i++) {
      const rowNum = i + REQUEST_ID_CFG.DATA_START_ROW;
      const rowValues = values[i];

      if (!isDataRow(rowValues, headerMap, sheetName)) continue;
      const existingId = String(rowValues[requestIdColIdx - 1] || '').trim();
      if (existingId) continue;

      const newId = generateRequestId();
      sheet.getRange(rowNum, requestIdColIdx).setValue(newId);
      filled++;
      Logger.log(`[periodicBackfill] "${sheetName}" 行${rowNum}: ${newId}`);
    }

    if (filled > 0) {
      Logger.log(`[periodicBackfill] "${sheetName}": ${filled} 行に付与完了`);
    }
  }

  Logger.log(`[periodicBackfill] 完了 ${new Date().toISOString()}`);
}

// ============================================================
//  request_id による行番号検索
// ============================================================

/**
 * request_id からシートの行番号（1始まり）を返す。
 * 見つからない場合は null。
 *
 * 重要:
 * - request_id が見つからない場合は rowIndex を使って勝手に代替更新しない
 * - 「近い行」へフォールバック更新しない
 * - 安全優先で fail closed
 */
function findRowByRequestId_(sheet, requestId) {
  if (!requestId || String(requestId).trim() === '') return null;

  const requestIdColIdx = getColIndexByHeader_(sheet, REQUEST_ID_CFG.REQUEST_ID_HEADER);
  if (requestIdColIdx === -1) {
    Logger.log(`[findRow] "${sheet.getName()}" に request_id 列がありません`);
    return null;
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;

  const ids = sheet
    .getRange(2, requestIdColIdx, lastRow - 1, 1)
    .getValues()
    .flat()
    .map(String);

  const foundIdx = ids.indexOf(String(requestId).trim());
  if (foundIdx === -1) {
    Logger.log(`[findRow] request_id "${requestId}" が "${sheet.getName()}" に見つかりません`);
    return null;
  }
  return foundIdx + 2; // 2 = ヘッダー行(1) + 1始まり補正
}

// ============================================================
//  トリガー設定
// ============================================================

/**
 * 定期補完トリガーを設定する。
 * onEdit は installable trigger として別途設定が必要。
 */
function setupRequestIdTriggers() {
  const SS_ID = '14o-3G_-30qi4NCw-XhR4FaGGFNJhrlJF8ktL3DA7CJQ';

  // 既存の periodicBackfill / onEdit トリガーを削除（重複防止）
  ScriptApp.getProjectTriggers()
    .filter(t => ['periodicBackfill', 'onEdit'].includes(t.getHandlerFunction()))
    .forEach(t => { ScriptApp.deleteTrigger(t); Logger.log(`[setupTriggers] 削除: ${t.getHandlerFunction()}`); });

  // 1時間ごとに periodicBackfill を実行
  ScriptApp.newTrigger('periodicBackfill')
    .timeBased()
    .everyHours(1)
    .create();
  Logger.log('[setupTriggers] periodicBackfill: 1時間ごとのトリガーを設定しました');

  // スプレッドシート onEdit トリガー（スタンドアロン用にSSを明示）
  ScriptApp.newTrigger('onEdit')
    .forSpreadsheet(SS_ID)
    .onEdit()
    .create();
  Logger.log('[setupTriggers] onEdit: スプレッドシートトリガーを設定しました');
}

// ============================================================
//  カスタムメニュー追加（onOpen 呼び出し側から追記）
// ============================================================

/**
 * onOpen から呼ぶことでカスタムメニューに request_id 操作を追加する。
 * Code.gs の onOpen から: addRequestIdMenuItems(ui) を呼ぶこと。
 */
function addRequestIdMenuItems(menu) {
  menu.addSeparator()
    .addItem('🔑 request_id バックフィル（全シート）', 'backfillAllSheets')
    .addItem('🔍 未採番行の監査',                      'auditMissingIds')
    .addItem('⏱ 定期補完トリガー設定',                 'setupRequestIdTriggers')
    .addItem('🧪 ID生成テスト（10件）',                'testGenerateIds');
  return menu;
}

// ============================================================
//  テスト
// ============================================================

/**
 * generateRequestId のテスト（10件出力してログ確認）
 */
function testGenerateIds() {
  const ids = [];
  for (let i = 0; i < 10; i++) {
    ids.push(generateRequestId());
  }
  Logger.log('生成ID:\n' + ids.join('\n'));
  const unique = new Set(ids).size === ids.length;
  SpreadsheetApp.getUi().alert(
    `ID生成テスト完了 (重複なし: ${unique})\n\n${ids.join('\n')}`
  );
}
