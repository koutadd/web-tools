// ============================================================
// Web Tools – Site Diagnosis
// Google Apps Script backend
// ============================================================
// Deploy as Web App:
//   Execute as: Me
//   Who has access: Anyone
// Then paste the deployment URL into tools/site-diagnosis/form.js
// ============================================================

const SHEET_NAME = 'Submissions';

const HEADERS = [
  'Timestamp',
  'Business Name',
  'Website URL',
  'Industry',
  'Goal',
  'Problems',
  'Email',
];

// ── Entry point ───────────────────────────────────────────────

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    saveSubmission(data);

    return jsonResponse({ status: 'ok', message: 'saved' });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.message });
  }
}

// ── Sheets ────────────────────────────────────────────────────

function saveSubmission(data) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  }

  sheet.appendRow([
    new Date(),
    data.businessName  || '',
    data.websiteUrl    || '',
    data.industry      || '',
    data.goal          || '',
    (data.problems || []).join(', '),
    data.email         || '',
  ]);
}

// ── Utility ───────────────────────────────────────────────────

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
