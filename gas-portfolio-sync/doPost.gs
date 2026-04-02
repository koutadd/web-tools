/**
 * ============================================================
 *  doPost — 依頼管理・ファイルアップロード ハンドラー
 *  request_id ベース刷新版
 *  ── 行番号依存を完全排除 ──
 * ============================================================
 *
 * 設計方針:
 *  - 更新対象の特定は request_id を唯一のキーとする
 *  - request_id が見つからない場合は rowIndex で代替更新しない（fail closed）
 *  - 更新前に request_id + 店舗名 + 制作物名を照合する
 *  - 更新後に再取得検証を行う
 *  - 全更新操作に監査ログを残す
 */

// ============================================================
//  監査ログ
// ============================================================

/**
 * 更新操作の監査ログをシートに書き込む。
 *
 * @param {Object} entry  ログエントリ
 *   - timestamp       string
 *   - actionType      string  (update_status / update_fields / create_request / write_drive_url / write_q)
 *   - request_id      string
 *   - sheetName       string
 *   - currentRowIndex number
 *   - storeName       string
 *   - workName        string
 *   - targetColumn    string
 *   - previousValue   string
 *   - newValue        string
 *   - success         boolean
 *   - errorMessage    string
 */
function writeAuditLog_(entry) {
  try {
    const ss = SpreadsheetApp.openById('14o-3G_-30qi4NCw-XhR4FaGGFNJhrlJF8ktL3DA7CJQ');
    let logSheet = ss.getSheetByName('監査ログ');
    if (!logSheet) {
      logSheet = ss.insertSheet('監査ログ');
      const headers = [
        'timestamp', 'actionType', 'request_id', 'sheetName', 'currentRowIndex',
        'storeName', 'workName', 'targetColumn', 'previousValue', 'newValue',
        'success', 'errorMessage',
      ];
      logSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      logSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      logSheet.setFrozenRows(1);
    }
    logSheet.appendRow([
      entry.timestamp    || new Date().toISOString(),
      entry.actionType   || '',
      entry.request_id   || '',
      entry.sheetName    || '',
      entry.currentRowIndex !== undefined ? entry.currentRowIndex : '',
      entry.storeName    || '',
      entry.workName     || '',
      entry.targetColumn || '',
      entry.previousValue !== undefined ? entry.previousValue : '',
      entry.newValue      !== undefined ? entry.newValue : '',
      entry.success       !== undefined ? String(entry.success) : '',
      entry.errorMessage || '',
    ]);
  } catch (e) {
    Logger.log('[auditLog] ログ書き込みエラー: ' + e.message);
  }
}

// ============================================================
//  更新前安全チェック
// ============================================================

/**
 * 更新前に request_id・店舗名・制作物名を照合する。
 * 1点でも不一致なら更新中止 (fail closed)。
 *
 * @param  {Sheet}  sheet
 * @param  {string} requestId          検索する request_id
 * @param  {string} [expectedStoreName] 期待する店舗名（省略可）
 * @param  {string} [expectedWorkName]  期待する制作物名（省略可）
 * @returns {{ ok: boolean, rowNum?: number, error?: string }}
 */
function verifyBeforeUpdate_(sheet, requestId, expectedStoreName, expectedWorkName) {
  // 1. request_id で行を探す
  //    見つからない場合は rowIndex で代替しない（安全優先）
  const rowNum = findRowByRequestId_(sheet, requestId);
  if (!rowNum) {
    const msg = `[安全チェック失敗] request_id "${requestId}" が "${sheet.getName()}" に見つかりません。` +
                `行が削除された、またはまだ request_id が付与されていない可能性があります。`;
    Logger.log(msg);
    return { ok: false, error: msg };
  }

  // 2. 照合用データを取得（スプレッドシートを再取得）
  const headerMap = getHeaderMap_(sheet);
  const numCols = sheet.getLastColumn();
  const rowValues = sheet.getRange(rowNum, 1, 1, numCols).getValues()[0];

  const storeColIdx = headerMap['店舗'];
  const workColIdx  = headerMap['制作物'];
  const actualStore = storeColIdx ? String(rowValues[storeColIdx - 1] || '').trim() : '';
  const actualWork  = workColIdx  ? String(rowValues[workColIdx  - 1] || '').trim() : '';

  // 3. 店舗名照合
  if (expectedStoreName && String(expectedStoreName).trim() !== '') {
    if (actualStore !== String(expectedStoreName).trim()) {
      const msg = `[安全チェック失敗] 店舗名不一致 (行${rowNum}): ` +
                  `期待="${expectedStoreName}" 実際="${actualStore}". ` +
                  `行が移動した可能性があります。更新を中止しました。`;
      Logger.log(msg);
      return { ok: false, error: msg, rowNum };
    }
  }

  // 4. 制作物名照合
  if (expectedWorkName && String(expectedWorkName).trim() !== '') {
    if (actualWork !== String(expectedWorkName).trim()) {
      const msg = `[安全チェック失敗] 制作物名不一致 (行${rowNum}): ` +
                  `期待="${expectedWorkName}" 実際="${actualWork}". ` +
                  `別行の可能性があります。更新を中止しました。`;
      Logger.log(msg);
      return { ok: false, error: msg, rowNum };
    }
  }

  return { ok: true, rowNum, actualStore, actualWork };
}

// ============================================================
//  更新後再取得検証
// ============================================================

/**
 * 書き込み後、指定セルの値が期待値と一致するか検証する。
 * 将来追加される列にも使い回せる共通検証関数。
 *
 * @param  {Sheet}  sheet
 * @param  {number} rowNum      行番号（1始まり）
 * @param  {number} colIdx      列インデックス（1始まり）
 * @param  {*}      expectedVal 期待値
 * @returns {{ ok: boolean, actual?: string }}
 */
function verifyAfterWrite_(sheet, rowNum, colIdx, expectedVal) {
  const actual   = String(sheet.getRange(rowNum, colIdx).getValue() || '').trim();
  const expected = String(expectedVal || '').trim();
  if (actual !== expected) {
    Logger.log(
      `[書き込み検証失敗] 行${rowNum} 列${colIdx}: 期待="${expected}" 実際="${actual}"`
    );
    return { ok: false, actual, expected };
  }
  return { ok: true, actual };
}

// ============================================================
//  doPost エントリポイント
// ============================================================

function doPost(e) {
  try {
    const data   = JSON.parse(e.postData.contents);
    const action = data.action;

    // ── ファイルアップロード（小ファイル: base64）────────────────
    if (action === 'uploadFile') {
      const folder  = DriveApp.getFolderById(data.folderId);
      const decoded = Utilities.base64Decode(data.base64Data);
      const blob    = Utilities.newBlob(
        decoded,
        data.mimeType || 'application/octet-stream',
        data.fileName
      );
      const file = folder.createFile(blob);
      return json_({ ok: true, fileId: file.getId(), fileName: file.getName() });
    }

    // ── 大ファイル: OAuthトークン取得 ─────────────────────────
    if (action === 'createUploadSession') {
      const token = ScriptApp.getOAuthToken();
      return json_({
        ok: true, token,
        fileName: data.fileName,
        folderId: data.folderId,
        mimeType: data.mimeType || 'application/octet-stream',
      });
    }

    // ── ステータス更新 ─────────────────────────────────────────
    if (action === 'updateStatus') {
      const ss    = SpreadsheetApp.openById('14o-3G_-30qi4NCw-XhR4FaGGFNJhrlJF8ktL3DA7CJQ');
      const sheet = ss.getSheetByName('依頼シート');
      if (!sheet) return json_({ ok: false, error: '依頼シートが見つかりません' });

      // request_id は必須（行番号での代替更新は行わない）
      if (!data.requestId) {
        return json_({ ok: false, error: 'requestId が未指定です。request_id ベースの更新が必要です。' });
      }

      // 更新前安全チェック（request_id + 店舗名 + 制作物名の照合）
      const verify = verifyBeforeUpdate_(
        sheet, data.requestId, data.storeName, data.workName
      );
      if (!verify.ok) {
        writeAuditLog_({
          actionType: 'update_status',
          request_id: data.requestId,
          sheetName: '依頼シート',
          storeName: data.storeName,
          workName: data.workName,
          targetColumn: 'ステータス',
          newValue: data.status,
          success: false,
          errorMessage: verify.error,
        });
        return json_({ ok: false, error: verify.error });
      }

      const rowNum = verify.rowNum;
      const headerMap = getHeaderMap_(sheet);
      const statusColIdx = headerMap['ステータス'];
      if (!statusColIdx) {
        return json_({ ok: false, error: 'ステータス列がシートに見つかりません（ヘッダー名を確認してください）' });
      }

      // 書き込み前の値を保存
      const prevValue = String(sheet.getRange(rowNum, statusColIdx).getValue() || '');

      // 書き込み
      sheet.getRange(rowNum, statusColIdx).setValue(data.status);

      // 更新後再取得検証
      const afterVerify = verifyAfterWrite_(sheet, rowNum, statusColIdx, data.status);

      writeAuditLog_({
        actionType: 'update_status',
        request_id: data.requestId,
        sheetName: '依頼シート',
        currentRowIndex: rowNum,
        storeName: verify.actualStore,
        workName: verify.actualWork,
        targetColumn: 'ステータス',
        previousValue: prevValue,
        newValue: data.status,
        success: afterVerify.ok,
        errorMessage: afterVerify.ok ? '' : `書き込み後検証失敗: 実際="${afterVerify.actual}"`,
      });

      if (!afterVerify.ok) {
        return json_({
          ok: false,
          error: `書き込みは完了しましたが再取得検証で不一致: 期待="${data.status}" 実際="${afterVerify.actual}"`,
        });
      }
      return json_({ ok: true, rowNum });
    }

    // ── コメント追加 ───────────────────────────────────────────
    if (action === 'addComment') {
      const ss    = SpreadsheetApp.openById('14o-3G_-30qi4NCw-XhR4FaGGFNJhrlJF8ktL3DA7CJQ');
      const sheet = ss.getSheetByName('依頼管理ログ') || ss.insertSheet('依頼管理ログ');
      // ヘッダー初期化
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(['request_id', 'timestamp', 'author', 'comment']);
        sheet.getRange(1, 1, 1, 4).setFontWeight('bold');
        sheet.setFrozenRows(1);
      }
      const now = new Date().toISOString();
      // requestId を優先して使用（後方互換のため rowId も受け付ける）
      const id = data.requestId || data.rowId || '';
      sheet.appendRow([id, now, data.author || '', data.comment || '']);
      return json_({ ok: true });
    }

    // ── 新規依頼作成 ───────────────────────────────────────────
    if (action === 'createRequest') {
      const ss    = SpreadsheetApp.openById('14o-3G_-30qi4NCw-XhR4FaGGFNJhrlJF8ktL3DA7CJQ');
      const sheet = ss.getSheetByName('依頼シート');
      if (!sheet) return json_({ ok: false, error: '依頼シートが見つかりません' });

      // request_id 列を確保
      ensureRequestIdColumn_(sheet);
      const headerMap = getHeaderMap_(sheet);

      // 新しい request_id を生成（行番号は使わない）
      const newRequestId = generateRequestId();
      const d = data.fields || {};

      // ヘッダー名ベースで行データを構築（行2がヘッダー、行1は説明行）
      const lastCol = sheet.getLastColumn();
      const headers = sheet.getRange(2, 1, 1, lastCol).getValues()[0];
      const rowData = headers.map(h => {
        const key = String(h).trim();
        if (key === 'request_id') return newRequestId;
        if (key === '優先度（緊急／通常）') return d['優先度（緊急／通常）'] || d['優先度'] || '通常';
        if (key === '掲載したい情報 / 特記事項') return d['掲載したい情報 / 特記事項'] || d['掲載したい情報/特記事項'] || '';
        return d[key] !== undefined ? d[key] : '';
      });

      sheet.appendRow(rowData);
      const newRowNum = sheet.getLastRow();

      // request_id 列がRow1にしか無い場合（Row2ヘッダーにない場合）に備え、
      // getColIndexByHeader_（Row1/Row2両方検索）で確実に書き込む
      const reqColIdx = getColIndexByHeader_(sheet, REQUEST_ID_CFG.REQUEST_ID_HEADER);
      if (reqColIdx !== -1) {
        sheet.getRange(newRowNum, reqColIdx).setValue(newRequestId);
      }

      writeAuditLog_({
        actionType: 'create_request',
        request_id: newRequestId,
        sheetName: '依頼シート',
        currentRowIndex: newRowNum,
        storeName: d['店舗'],
        workName: d['制作物'],
        success: true,
      });

      return json_({ ok: true, requestId: newRequestId, rowNum: newRowNum });
    }

    // ── フィールド更新 ─────────────────────────────────────────
    if (action === 'updateFields') {
      const ss    = SpreadsheetApp.openById('14o-3G_-30qi4NCw-XhR4FaGGFNJhrlJF8ktL3DA7CJQ');
      const sheet = ss.getSheetByName('依頼シート');
      if (!sheet) return json_({ ok: false, error: '依頼シートが見つかりません' });

      if (!data.requestId) {
        return json_({ ok: false, error: 'requestId が未指定です。request_id ベースの更新が必要です。' });
      }

      // 更新前安全チェック
      const verify = verifyBeforeUpdate_(
        sheet, data.requestId, data.storeName, data.workName
      );
      if (!verify.ok) {
        writeAuditLog_({
          actionType: 'update_fields',
          request_id: data.requestId,
          storeName: data.storeName,
          workName: data.workName,
          success: false,
          errorMessage: verify.error,
        });
        return json_({ ok: false, error: verify.error });
      }

      const rowNum = verify.rowNum;
      const headerMap = getHeaderMap_(sheet);
      const fields = data.fields || {};
      const failedCols = [];

      for (const [key, val] of Object.entries(fields)) {
        // request_id は絶対に上書きしない
        if (key === 'request_id') {
          Logger.log('[updateFields] request_id の上書きはスキップされました');
          continue;
        }

        const colIdx = headerMap[key];
        if (!colIdx) {
          Logger.log(`[updateFields] 列 "${key}" が見つかりません（ヘッダー名を確認）`);
          continue;
        }

        const prevValue = String(sheet.getRange(rowNum, colIdx).getValue() || '');
        sheet.getRange(rowNum, colIdx).setValue(val);

        // 更新後再取得検証
        const afterVerify = verifyAfterWrite_(sheet, rowNum, colIdx, val);

        writeAuditLog_({
          actionType: 'update_fields',
          request_id: data.requestId,
          sheetName: '依頼シート',
          currentRowIndex: rowNum,
          storeName: verify.actualStore,
          workName: verify.actualWork,
          targetColumn: key,
          previousValue: prevValue,
          newValue: val,
          success: afterVerify.ok,
          errorMessage: afterVerify.ok ? '' : `再取得検証失敗: 実際="${afterVerify.actual}"`,
        });

        if (!afterVerify.ok) failedCols.push(key);
      }

      if (failedCols.length > 0) {
        return json_({
          ok: false,
          error: `書き込み後検証失敗の列: ${failedCols.join(', ')}`,
          rowNum,
        });
      }
      return json_({ ok: true, rowNum });
    }

    return json_({ ok: false, error: 'Unknown action: ' + action });

  } catch (err) {
    Logger.log('[doPost] 予期しないエラー: ' + err.message + '\n' + (err.stack || ''));
    return json_({ ok: false, error: err.message });
  }
}

// ============================================================
//  内部ユーティリティ
// ============================================================

/** JSON レスポンスを返すヘルパー */
function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
