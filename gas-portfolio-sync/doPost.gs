/**
 * ============================================================
 *  doPost — 依頼管理・ファイルアップロード ハンドラー
 *  ※ このコードを Google Apps Script エディタに追加してください
 *  ※ 追加後、「デプロイ」→「デプロイを管理」→ 新バージョンで再デプロイ
 * ============================================================
 */

function doPost(e) {
  try {
    const data   = JSON.parse(e.postData.contents);
    const action = data.action;

    // ── ファイルアップロード（小ファイル: base64）────────────
    if (action === 'uploadFile') {
      const folder   = DriveApp.getFolderById(data.folderId);
      const decoded  = Utilities.base64Decode(data.base64Data);
      const blob     = Utilities.newBlob(decoded, data.mimeType || 'application/octet-stream', data.fileName);
      const file     = folder.createFile(blob);
      return json_({ ok: true, fileId: file.getId(), fileName: file.getName() });
    }

    // ── 大ファイル: Resumableアップロードセッション作成 ──────
    if (action === 'createUploadSession') {
      const token    = ScriptApp.getOAuthToken();
      const mimeType = data.mimeType || 'application/octet-stream';
      const metadata = JSON.stringify({ name: data.fileName, parents: [data.folderId] });
      const res = UrlFetchApp.fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json; charset=UTF-8',
            'X-Upload-Content-Type': mimeType,
          },
          payload: metadata,
          muteHttpExceptions: true,
        }
      );
      const uploadUrl = res.getHeaders()['Location'];
      if (!uploadUrl) return json_({ ok: false, error: 'uploadUrl取得失敗: ' + res.getContentText().slice(0, 200) });
      return json_({ ok: true, uploadUrl });
    }

    // ── ステータス更新 ───────────────────────────────────────
    if (action === 'updateStatus') {
      const ss    = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName('依頼シート');
      if (!sheet) return json_({ ok: false, error: '依頼シートが見つかりません' });
      const row = findReqRow_(sheet, data.rowId);
      if (!row) return json_({ ok: false, error: '行が見つかりません: ' + data.rowId });
      sheet.getRange(row, 12).setValue(data.status); // L列
      return json_({ ok: true });
    }

    // ── コメント追加 ─────────────────────────────────────────
    if (action === 'sendComment') {
      const ss    = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName('依頼管理ログ') || ss.insertSheet('依頼管理ログ');
      const now   = new Date().toISOString();
      sheet.appendRow([data.rowId, now, data.author || '', data.comment]);
      return json_({ ok: true });
    }

    // ── 新規依頼作成 ─────────────────────────────────────────
    if (action === 'createRequest') {
      const ss    = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName('依頼シート');
      if (!sheet) return json_({ ok: false, error: '依頼シートが見つかりません' });
      const lastRow = sheet.getLastRow();
      const newId   = String(lastRow); // row番号をIDとして使用
      const d       = data.fields || {};
      sheet.appendRow([
        d['店舗'] || '', d['制作物'] || '', d['目的 / 掲出期間'] || '',
        d['掲載場所'] || '', d['依頼内容'] || '', d['依頼者'] || '',
        d['製作者'] || '', d['依頼日'] || '', d['納期'] || '',
        d['初稿納品希望日'] || '', d['優先度（緊急／通常）'] || '通常',
        d['ステータス'] || '未着手', d['実質完了日'] || '',
        d['サイズ'] || '', d['納品時のFMT'] || '', '', '', '',
        d['掲載したい情報 / 特記事項'] || '', '',
      ]);
      return json_({ ok: true, rowId: String(sheet.getLastRow()) });
    }

    // ── フィールド更新 ───────────────────────────────────────
    if (action === 'updateFields') {
      const ss    = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName('依頼シート');
      if (!sheet) return json_({ ok: false, error: '依頼シートが見つかりません' });
      const row = findReqRow_(sheet, data.rowId);
      if (!row) return json_({ ok: false, error: '行が見つかりません' });
      const COL_MAP = {
        '店舗': 1, '制作物': 2, '目的 / 掲出期間': 3, '掲載場所': 4,
        '依頼内容': 5, '依頼者': 6, '製作者': 7, '依頼日': 8,
        '納期': 9, '初稿納品希望日': 10, '優先度（緊急／通常）': 11,
        'ステータス': 12, '実質完了日': 13, 'サイズ': 14,
        '納品時のFMT': 15, '掲載したい情報 / 特記事項': 19,
        '制作完了データ(googleドライブURL)': 20,
      };
      const fields = data.fields || {};
      Object.entries(fields).forEach(([key, val]) => {
        const col = COL_MAP[key];
        if (col) sheet.getRange(row, col).setValue(val);
      });
      return json_({ ok: true });
    }

    return json_({ ok: false, error: 'Unknown action: ' + action });

  } catch (err) {
    return json_({ ok: false, error: err.message });
  }
}

/** 依頼管理シートから rowId に対応する行番号を返す */
function findReqRow_(sheet, rowId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  // A列にrow_idが入っている場合とシート行番号が一致する場合の両対応
  const targetRow = Number(rowId);
  if (targetRow >= 2 && targetRow <= lastRow) return targetRow;
  // A列を検索
  const vals = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < vals.length; i++) {
    if (String(vals[i][0]).trim() === String(rowId).trim()) return i + 2;
  }
  return null;
}

/** JSON レスポンスを返すヘルパー */
function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}