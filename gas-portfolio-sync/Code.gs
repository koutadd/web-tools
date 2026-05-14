/**
 * ============================================================
 *  アイケアラボ 制作物PDF自動収集・ギャラリー連携システム
 *  Google Apps Script
 * ============================================================
 */

// ============================================================
//  設定オブジェクト  ← ★ ここを実際の環境に合わせて変更
// ============================================================
const CONFIG = {

  // ── シート名 ──────────────────────────────────────────────
  MANAGEMENT_SHEET: '管理シート',  // 制作物管理シートのシート名
  GALLERY_SHEET:    'gallery_data', // JSON出力先シートのシート名

  // ── 管理シートの行設定 ────────────────────────────────────
  HEADER_ROW:    1, // ヘッダー行の行番号
  DATA_START_ROW: 2, // データ開始行の行番号

  // ── 管理シートの列番号 (1始まり = A列が1) ─────────────────
  // ★ 実際の列順に合わせて変更してください
  MGMT_COL: {
    ITEM_ID:                1,  // A列: 制作物ID（一意キー）
    TITLE:                  2,  // B列: 制作物名
    CATEGORY:               3,  // C列: ジャンル
    STORE_NAME:             4,  // D列: 店舗名
    STATUS:                 5,  // E列: ステータス
    PRODUCTION_FOLDER_NAME: 6,  // F列: 制作物フォルダ名（例: 109_四ツ谷店_チラシ）
  },

  // ── Drive 設定 ────────────────────────────────────────────
  //
  // 【推奨】ROOT_FOLDER_ID に直接フォルダIDを設定する。
  //   Google Drive でフォルダを開いたときのURL末尾の文字列:
  //   https://drive.google.com/drive/folders/XXXXXXXXXXXXXXXX
  //                                          ↑ここをコピー
  //
  ROOT_FOLDER_ID: '', // ★ 02_クリエイティブ制作物 フォルダのIDを設定

  // ROOT_FOLDER_ID が空の場合のフォールバック（名前で順番に探索）
  ROOT_FOLDER_PATH: ['2.データ', '02_クリエイティブ制作物'],

  // アウトプットフォルダ名
  OUTPUT_FOLDER_NAME: 'アウトプット',

  // ── トリガー設定 ──────────────────────────────────────────
  TRIGGER_FUNCTION:       'refreshChangedItems',
  TRIGGER_INTERVAL_HOURS: 2,
};

// ============================================================
//  gallery_data シートの列ヘッダー定義（順序固定）
// ============================================================
const GALLERY_HEADERS = [
  'item_id',
  'title',
  'category',
  'store_name',
  'status',
  'production_folder_name',
  'source_folder_url',
  'output_folder_url',
  'pdf_name',
  'pdf_url',
  'pdf_updated_at',
  'last_synced_at',
  'sync_status',
  'sync_message',
];

// ============================================================
//  カスタムメニュー
// ============================================================
function onOpen() {
  SpreadsheetApp.getActiveSpreadsheet().addMenu('📁 PDFギャラリー', [
    { name: '▶ 初回全件同期',           functionName: 'syncAllItems'    },
    { name: '🔄 全件再同期',             functionName: 'syncAllItems'    },
    { name: '⏱ 2時間トリガー再作成',    functionName: 'setupTriggers'   },
    { name: '👁 JSON プレビュー',        functionName: 'previewJson'     },
    null,
    { name: '🗑 gallery_data クリア',    functionName: 'clearGalleryData'},
    { name: '🔍 ルートフォルダ確認',     functionName: 'testRootFolder'  },
  ]);
}

// ============================================================
//  Web App エンドポイント（doGet）
// ============================================================
/**
 * フロントエンドが fetch() で呼ぶ JSON API。
 * スクリプトをウェブアプリとしてデプロイ後に使用可能。
 *   GET https://script.google.com/macros/s/xxxx/exec
 *   → { ok: true, data: [...], count: N }
 *
 * クエリパラメータ（任意）:
 *   ?status=active       sync_status が ok の項目のみ返す
 *   ?category=チラシ      カテゴリで絞り込む
 */
function doGet(e) {
  try {
    let data = getGalleryJson_();

    // クエリパラメータによる絞り込み
    if (e && e.parameter) {
      if (e.parameter.status === 'active') {
        data = data.filter(d => d.sync_status === 'ok');
      }
      if (e.parameter.category) {
        data = data.filter(d => d.category === e.parameter.category);
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, data: data, count: data.length }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================
//  主要関数
// ============================================================

/**
 * 全件バックフィル同期（初回実行・全件再同期用）
 * 管理シートの全行を走査し gallery_data を生成／更新する。
 * 冪等性あり: 何度実行しても同じ結果になる。
 */
function syncAllItems() {
  const startTime = new Date();
  Logger.log(`=== syncAllItems 開始 [${startTime.toISOString()}] ===`);

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const mgmtSheet = ss.getSheetByName(CONFIG.MANAGEMENT_SHEET);
  if (!mgmtSheet) {
    throw new Error(`管理シート "${CONFIG.MANAGEMENT_SHEET}" が見つかりません`);
  }

  const rows = getManagementRows_(mgmtSheet);
  Logger.log(`対象行数: ${rows.length}`);

  let successCount = 0;
  let errorCount   = 0;
  let skippedCount = 0;

  for (const rowData of rows) {
    try {
      const result = syncSingleItem(rowData);
      if      (result.sync_status === 'ok')      successCount++;
      else if (result.sync_status === 'skipped') skippedCount++;
      else                                        errorCount++;
    } catch (e) {
      // 予期しないエラーが発生しても他の行の処理は継続する
      Logger.log(`UNEXPECTED ERROR [${rowData.item_id}]: ${e.message}\n${e.stack}`);
      errorCount++;
      updateGalleryData_({
        ...rowData,
        production_folder_name: resolveFolderName_(rowData),
        source_folder_url: '',
        output_folder_url: '',
        pdf_name:          '',
        pdf_url:           '',
        pdf_updated_at:    '',
        last_synced_at:    new Date().toISOString(),
        sync_status:  'error',
        sync_message: `予期しないエラー: ${e.message}`,
      });
    }
  }

  const elapsed = ((new Date() - startTime) / 1000).toFixed(1);
  Logger.log(`=== syncAllItems 完了 (成功:${successCount} / スキップ:${skippedCount} / エラー:${errorCount} / ${elapsed}秒) ===`);

  SpreadsheetApp.getActiveSpreadsheet().toast(
    `完了: 成功 ${successCount} 件 / エラー ${errorCount} 件 / スキップ ${skippedCount} 件 (${elapsed}秒)`,
    '📁 PDF同期完了', 6
  );
}

/**
 * 1行分の制作物を同期する。
 * Drive を走査し、最新 PDF を gallery_data に書き込む。
 *
 * @param  {Object} rowData  管理シートから読んだ1行データ
 * @returns {Object}         gallery_data に書き込んだ結果オブジェクト
 */
function syncSingleItem(rowData) {
  const folderName = resolveFolderName_(rowData);

  // gallery_data に書き込む結果オブジェクトの初期値
  const result = {
    item_id:               rowData.item_id,
    title:                 rowData.title,
    category:              rowData.category,
    store_name:            rowData.store_name,
    status:                rowData.status,
    production_folder_name: folderName,
    source_folder_url:     '',
    output_folder_url:     '',
    pdf_name:              '',
    pdf_url:               '',
    pdf_updated_at:        '',
    last_synced_at:        new Date().toISOString(),
    sync_status:           '',
    sync_message:          '',
  };

  // フォルダ名が空 → スキップ
  if (!folderName) {
    result.sync_status  = 'skipped';
    result.sync_message = 'フォルダ名が未設定のためスキップ';
    Logger.log(`SKIP [${rowData.item_id}]: フォルダ名未設定`);
    updateGalleryData_(result);
    return result;
  }

  Logger.log(`同期開始: [${rowData.item_id}] ${folderName}`);

  // ① ルートフォルダを取得
  const rootFolder = getRootFolder_();
  if (!rootFolder) {
    result.sync_status  = 'error';
    result.sync_message = 'ルートフォルダが取得できません (ROOT_FOLDER_ID または ROOT_FOLDER_PATH を確認)';
    updateGalleryData_(result);
    return result;
  }

  // ② 制作物フォルダを検索
  const productionFolder = findSubFolderByName_(rootFolder, folderName);
  if (!productionFolder) {
    result.sync_status  = 'missing_folder';
    result.sync_message = `制作物フォルダ "${folderName}" が見つかりません`;
    Logger.log(`MISSING_FOLDER [${rowData.item_id}]: ${folderName}`);
    updateGalleryData_(result);
    return result;
  }
  result.source_folder_url = productionFolder.getUrl();

  // ③ アウトプットフォルダを検索
  const outputFolder = findSubFolderByName_(productionFolder, CONFIG.OUTPUT_FOLDER_NAME);
  if (!outputFolder) {
    result.sync_status  = 'missing_output_folder';
    result.sync_message = `"${CONFIG.OUTPUT_FOLDER_NAME}" フォルダが見つかりません`;
    Logger.log(`MISSING_OUTPUT [${rowData.item_id}]`);
    updateGalleryData_(result);
    return result;
  }
  result.output_folder_url = outputFolder.getUrl();

  // ④ 最新 PDF を取得（更新日時が最新の1件）
  const latestPdf = getLatestPdf_(outputFolder);
  if (!latestPdf) {
    result.sync_status  = 'missing_pdf';
    result.sync_message = `"${CONFIG.OUTPUT_FOLDER_NAME}" 内に PDF がありません`;
    Logger.log(`MISSING_PDF [${rowData.item_id}]`);
    updateGalleryData_(result);
    return result;
  }

  result.pdf_name       = latestPdf.getName();
  result.pdf_url        = latestPdf.getUrl();
  result.pdf_updated_at = latestPdf.getLastUpdated().toISOString();
  result.sync_status    = 'ok';
  result.sync_message   = '';

  updateGalleryData_(result);
  Logger.log(`OK [${rowData.item_id}]: ${latestPdf.getName()}`);
  return result;
}

/**
 * 差分巡回（2時間ごとの定期実行）
 * トリガーからこの関数が呼ばれる。冪等性あり。
 */
function refreshChangedItems() {
  Logger.log(`=== refreshChangedItems 開始 [${new Date().toISOString()}] ===`);
  syncAllItems();
}

// ============================================================
//  トリガー管理
// ============================================================

/**
 * 2時間ごとのトリガーを設定する。
 * 同名のトリガーが既存の場合は削除してから再作成（重複防止）。
 */
function setupTriggers() {
  const funcName = CONFIG.TRIGGER_FUNCTION;

  // 既存の同名トリガーを削除
  const triggers = ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === funcName);
  triggers.forEach(t => ScriptApp.deleteTrigger(t));
  if (triggers.length > 0) {
    Logger.log(`既存トリガー ${triggers.length} 件を削除しました`);
  }

  ScriptApp.newTrigger(funcName)
    .timeBased()
    .everyHours(CONFIG.TRIGGER_INTERVAL_HOURS)
    .create();

  Logger.log(`トリガー設定完了: ${funcName} を ${CONFIG.TRIGGER_INTERVAL_HOURS}時間ごとに実行`);
  SpreadsheetApp.getActiveSpreadsheet().toast(
    `${CONFIG.TRIGGER_INTERVAL_HOURS} 時間ごとに自動実行するトリガーを設定しました`,
    '⏱ トリガー設定完了', 4
  );
}

// ============================================================
//  Drive ヘルパー関数
// ============================================================

/**
 * ルートフォルダ（02_クリエイティブ制作物）を返す。
 * CONFIG.ROOT_FOLDER_ID が設定されていればそれを優先。
 * 未設定の場合は ROOT_FOLDER_PATH を順番に辿る。
 *
 * @returns {Folder|null}
 */
function getRootFolder_() {
  if (CONFIG.ROOT_FOLDER_ID) {
    try {
      return DriveApp.getFolderById(CONFIG.ROOT_FOLDER_ID);
    } catch (e) {
      Logger.log(`ROOT_FOLDER_ID "${CONFIG.ROOT_FOLDER_ID}" でフォルダを取得できません: ${e.message}`);
      return null;
    }
  }

  // フォールバック: パス名で探索
  Logger.log('ROOT_FOLDER_ID 未設定 → ROOT_FOLDER_PATH で探索します');
  let current = null;

  for (const name of CONFIG.ROOT_FOLDER_PATH) {
    if (!current) {
      // 最初のフォルダは DriveApp.getFoldersByName で検索
      const iter = DriveApp.getFoldersByName(name);
      if (!iter.hasNext()) {
        Logger.log(`フォルダ "${name}" が見つかりません`);
        return null;
      }
      current = iter.next();
    } else {
      current = findSubFolderByName_(current, name);
      if (!current) {
        Logger.log(`サブフォルダ "${name}" が見つかりません`);
        return null;
      }
    }
  }

  return current;
}

/**
 * 親フォルダ直下から指定名のサブフォルダを1件返す。
 *
 * @param  {Folder}      parentFolder
 * @param  {string}      name  フォルダ名（完全一致）
 * @returns {Folder|null}
 */
function findSubFolderByName_(parentFolder, name) {
  try {
    const iter = parentFolder.getFoldersByName(name);
    return iter.hasNext() ? iter.next() : null;
  } catch (e) {
    Logger.log(`findSubFolderByName_ エラー (name="${name}"): ${e.message}`);
    return null;
  }
}

/**
 * フォルダ内の PDF のうち、更新日時が最新の1件を返す。
 *
 * @param  {Folder}    folder
 * @returns {File|null}
 */
function getLatestPdf_(folder) {
  try {
    const iter = folder.getFilesByType(MimeType.PDF);
    let latest     = null;
    let latestTime = 0;

    while (iter.hasNext()) {
      const file    = iter.next();
      const updated = file.getLastUpdated().getTime();
      if (updated > latestTime) {
        latestTime = updated;
        latest     = file;
      }
    }
    return latest;
  } catch (e) {
    Logger.log(`getLatestPdf_ エラー: ${e.message}`);
    return null;
  }
}

/**
 * 管理シート1行から制作物フォルダ名を解決する。
 * production_folder_name 列に値があればそれを返す。
 * ない場合は他フィールドから組み立てる（要カスタマイズ）。
 *
 * @param  {Object} rowData
 * @returns {string}  フォルダ名、未解決の場合は空文字
 */
function resolveFolderName_(rowData) {
  if (rowData.production_folder_name) {
    return String(rowData.production_folder_name).trim();
  }

  // ── フォールバック: 他列から組み立て ──────────────────────
  // 例: item_id + store_name + category → "109_四ツ谷店_チラシ"
  // 実際のネーミングルールに合わせて変更してください。
  if (rowData.item_id && rowData.store_name && rowData.category) {
    return `${rowData.item_id}_${rowData.store_name}_${rowData.category}`;
  }

  return '';
}

// ============================================================
//  Spreadsheet ヘルパー関数
// ============================================================

/**
 * 管理シートから全データ行を読み込み、オブジェクト配列で返す。
 * item_id が空の行はスキップする。
 *
 * @param  {Sheet}     sheet  管理シート
 * @returns {Object[]}
 */
function getManagementRows_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < CONFIG.DATA_START_ROW) return [];

  const numRows = lastRow - CONFIG.DATA_START_ROW + 1;
  const numCols = sheet.getLastColumn();
  const values  = sheet.getRange(CONFIG.DATA_START_ROW, 1, numRows, numCols).getValues();
  const cols    = CONFIG.MGMT_COL;

  return values
    .filter(row => {
      const id = row[cols.ITEM_ID - 1];
      return id !== null && id !== undefined && String(id).trim() !== '';
    })
    .map(row => ({
      item_id:                String(row[cols.ITEM_ID                - 1] || '').trim(),
      title:                  String(row[cols.TITLE                  - 1] || '').trim(),
      category:               String(row[cols.CATEGORY               - 1] || '').trim(),
      store_name:             String(row[cols.STORE_NAME             - 1] || '').trim(),
      status:                 String(row[cols.STATUS                 - 1] || '').trim(),
      production_folder_name: String(row[cols.PRODUCTION_FOLDER_NAME - 1] || '').trim(),
    }));
}

/**
 * gallery_data シートを upsert する。
 * item_id をキーとして既存行があれば更新、なければ末尾に追加。
 *
 * @param {Object} data  GALLERY_HEADERS のキーを持つオブジェクト
 */
function updateGalleryData_(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.GALLERY_SHEET);

  // シートがなければ作成
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.GALLERY_SHEET);
    initGallerySheet_(sheet);
  } else if (sheet.getLastRow() === 0) {
    initGallerySheet_(sheet);
  }

  // item_id 列のインデックスを取得
  const headers    = getGalleryHeaders_(sheet);
  const idColIdx   = headers.indexOf('item_id'); // 0-indexed
  if (idColIdx === -1) throw new Error('gallery_data に item_id 列がありません');

  // 書き込む行データを GALLERY_HEADERS の順番で作成
  const rowValues = GALLERY_HEADERS.map(h => (data[h] !== undefined ? data[h] : ''));

  // 既存行を item_id で検索
  const lastRow  = sheet.getLastRow();
  let targetRow  = -1;

  if (lastRow >= 2) {
    const idValues = sheet
      .getRange(2, idColIdx + 1, lastRow - 1, 1)
      .getValues()
      .flat()
      .map(String);
    const foundIdx = idValues.indexOf(String(data.item_id));
    if (foundIdx !== -1) {
      targetRow = foundIdx + 2; // 2 = ヘッダー行(1) + 1-indexed補正
    }
  }

  if (targetRow === -1) {
    sheet.appendRow(rowValues);
  } else {
    sheet.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues]);
  }
}

/**
 * gallery_data シートにヘッダー行を書き込む。
 *
 * @param {Sheet} sheet
 */
function initGallerySheet_(sheet) {
  sheet.getRange(1, 1, 1, GALLERY_HEADERS.length).setValues([GALLERY_HEADERS]);
  sheet.getRange(1, 1, 1, GALLERY_HEADERS.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  Logger.log('gallery_data シートを初期化しました');
}

/**
 * gallery_data のヘッダー行を配列で返す。
 *
 * @param  {Sheet}    sheet
 * @returns {string[]}
 */
function getGalleryHeaders_(sheet) {
  if (sheet.getLastColumn() === 0) return [...GALLERY_HEADERS];
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
}

/**
 * gallery_data の内容をオブジェクト配列（JSON用）で返す。
 *
 * @returns {Object[]}
 */
function getGalleryJson_() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.GALLERY_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return [];

  const headers  = getGalleryHeaders_(sheet);
  const dataRows = sheet
    .getRange(2, 1, sheet.getLastRow() - 1, headers.length)
    .getValues();

  return dataRows
    .filter(row => row[0] !== null && row[0] !== undefined && String(row[0]).trim() !== '')
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i]; });
      return obj;
    });
}

// ============================================================
//  ユーティリティ / デバッグ
// ============================================================

/**
 * JSON プレビュー（カスタムメニューから実行）
 */
function previewJson() {
  const data    = getGalleryJson_();
  const ui      = SpreadsheetApp.getUi();
  const preview = JSON.stringify(data.slice(0, 3), null, 2);
  ui.alert(
    `JSON プレビュー (先頭3件 / 全${data.length}件)`,
    preview,
    ui.ButtonSet.OK
  );
}

/**
 * gallery_data シートのデータ行をすべて削除する（ヘッダーは残す）。
 */
function clearGalleryData() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.GALLERY_SHEET);
  if (!sheet || sheet.getLastRow() < 2) {
    SpreadsheetApp.getUi().alert('gallery_data にデータがありません');
    return;
  }

  const ui       = SpreadsheetApp.getUi();
  const response = ui.alert('確認', 'gallery_data のデータをすべて削除しますか？', ui.ButtonSet.YES_NO);
  if (response !== ui.Button.YES) return;

  sheet.deleteRows(2, sheet.getLastRow() - 1);
  Logger.log('gallery_data をクリアしました');
}

/**
 * ルートフォルダの疎通確認（カスタムメニューから実行）
 * ログにフォルダ名・ID・直下サブフォルダ一覧を出力する。
 */
function testRootFolder() {
  const folder = getRootFolder_();
  if (!folder) {
    Logger.log('❌ ルートフォルダが見つかりません');
    SpreadsheetApp.getUi().alert('❌ ルートフォルダが見つかりません\nログを確認してください');
    return;
  }

  Logger.log(`✅ ルートフォルダ確認OK: "${folder.getName()}" (ID: ${folder.getId()})`);

  const subs = folder.getFolders();
  let count  = 0;
  while (subs.hasNext() && count < 20) {
    Logger.log(`  サブフォルダ: ${subs.next().getName()}`);
    count++;
  }

  SpreadsheetApp.getUi().alert(
    `✅ ルートフォルダ確認OK\n\n名前: ${folder.getName()}\nID: ${folder.getId()}\n\nサブフォルダ ${count} 件を確認（ログ参照）`
  );
}

/**
 * 単体テスト用: 特定の item_id を1件だけ同期して動作確認。
 * ITEM_ID_TO_TEST を書き換えてから実行する。
 */
function testSyncOne() {
  const ITEM_ID_TO_TEST = '001'; // ★ テストしたい item_id に変更

  const ss        = SpreadsheetApp.getActiveSpreadsheet();
  const mgmtSheet = ss.getSheetByName(CONFIG.MANAGEMENT_SHEET);
  if (!mgmtSheet) throw new Error(`管理シート "${CONFIG.MANAGEMENT_SHEET}" が見つかりません`);

  const rows   = getManagementRows_(mgmtSheet);
  const target = rows.find(r => r.item_id === ITEM_ID_TO_TEST);

  if (!target) {
    Logger.log(`item_id "${ITEM_ID_TO_TEST}" が管理シートに見つかりません`);
    return;
  }

  const result = syncSingleItem(target);
  Logger.log('テスト結果:\n' + JSON.stringify(result, null, 2));
}
