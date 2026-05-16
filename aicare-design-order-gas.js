// ============================================================
// アイケアラボ デザイン発注システム — GAS バックエンド
// スプレッドシートID: 1EFfcYr1NhG7aZFKKUqUa_rf88f7ZqeXkLQBfU3Gx_xo
// ============================================================

const SPREADSHEET_ID = '1EFfcYr1NhG7aZFKKUqUa_rf88f7ZqeXkLQBfU3Gx_xo';
const SHEET_NAME = '発注データ';
const COLS = [
  'id','orderNo','requester','projectName','client',
  'type','sizeFormat','deadline','priority',
  'brief','reference','status','createdAt','updatedAt'
];

function getSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(COLS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, COLS.length).setFontWeight('bold');
  }
  return sheet;
}

function doGet(e) {
  const action = (e.parameter && e.parameter.action) || 'list';
  try {
    if (action === 'list') {
      return jsonResponse(getAllOrders());
    }
    if (action === 'create') {
      const order = JSON.parse(decodeURIComponent(e.parameter.data));
      return jsonResponse(createOrder(order));
    }
    if (action === 'updateStatus') {
      return jsonResponse(updateStatus(e.parameter.id, e.parameter.status));
    }
    if (action === 'delete') {
      return jsonResponse(deleteOrderById(e.parameter.id));
    }
    return jsonResponse({ error: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse({ error: err.toString() });
  }
}

function getAllOrders() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  return data.slice(1)
    .filter(row => row[0])
    .map(row => {
      const obj = {};
      COLS.forEach((col, i) => { obj[col] = String(row[i] ?? ''); });
      return obj;
    })
    .reverse(); // 新しい順
}

function createOrder(order) {
  const sheet = getSheet();
  sheet.appendRow(COLS.map(col => order[col] || ''));
  return { success: true };
}

function updateStatus(id, status) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const statusCol   = COLS.indexOf('status') + 1;
  const updatedCol  = COLS.indexOf('updatedAt') + 1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.getRange(i + 1, statusCol).setValue(status);
      sheet.getRange(i + 1, updatedCol).setValue(new Date().toISOString());
      return { success: true };
    }
  }
  return { success: false, error: 'Not found' };
}

function deleteOrderById(id) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, error: 'Not found' };
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
