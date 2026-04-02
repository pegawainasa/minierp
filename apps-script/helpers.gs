/**
 * Helper umum untuk I/O sheet dan response API.
 */
function getSpreadsheet_() {
  const rawSpreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!rawSpreadsheetId) {
    throw new Error('SPREADSHEET_ID belum diset di Script Properties.');
  }
  const spreadsheetId = normalizeSpreadsheetId_(rawSpreadsheetId);
  return SpreadsheetApp.openById(spreadsheetId);
}

function normalizeSpreadsheetId_(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';

  const idFromUrlMatch = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (idFromUrlMatch) {
    return idFromUrlMatch[1];
  }

  return trimmed.replace(/[\/?#].*$/, '');
}

function getSheet_(sheetName) {
  const ss = getSpreadsheet_();
  const sh = ss.getSheetByName(sheetName);
  if (!sh) throw new Error(`Sheet ${sheetName} tidak ditemukan.`);
  return sh;
}

function toBooleanFlag_(value) {
  return String(value) === STATUS.ACTIVE;
}

function nowIso_() {
  return new Date().toISOString();
}

function genId_(sheetName) {
  const prefix = ID_PREFIX[sheetName] || 'ID';
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMddHHmmss');
  const rnd = Math.floor(Math.random() * 900 + 100);
  return `${prefix}-${stamp}-${rnd}`;
}

function toNum_(value) {
  if (value === null || value === undefined || value === '') return 0;
  const n = Number(value);
  return isNaN(n) ? 0 : n;
}

function parseJsonBody_(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  return JSON.parse(e.postData.contents);
}

function jsonOk_(data, message) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: message || 'OK',
    data: data || null,
    timestamp: nowIso_()
  })).setMimeType(ContentService.MimeType.JSON);
}

function jsonErr_(message, code) {
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    code: code || 'ERR_GENERAL',
    message: message || 'Terjadi kesalahan',
    timestamp: nowIso_()
  })).setMimeType(ContentService.MimeType.JSON);
}

function readRows_(sheetName) {
  const sh = getSheet_(sheetName);
  const values = sh.getDataRange().getValues();
  if (values.length <= 1) return [];
  const headers = values[0];

  return values.slice(1)
    .filter((row) => row.join('') !== '')
    .map((row, idx) => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      obj.__rowNumber = idx + 2;
      return obj;
    });
}

function appendRow_(sheetName, payload) {
  const sh = getSheet_(sheetName);
  const headers = SHEETS[sheetName];
  const row = headers.map((h) => payload[h] !== undefined ? payload[h] : '');
  sh.appendRow(row);
  return payload;
}

function updateRowById_(sheetName, idField, idValue, payload) {
  const sh = getSheet_(sheetName);
  const values = sh.getDataRange().getValues();
  const headers = values[0];
  const idIndex = headers.indexOf(idField);
  if (idIndex < 0) throw new Error(`Field id ${idField} tidak ditemukan di ${sheetName}`);

  for (let r = 1; r < values.length; r++) {
    if (values[r][idIndex] === idValue) {
      headers.forEach((h, i) => {
        if (payload[h] !== undefined) {
          sh.getRange(r + 1, i + 1).setValue(payload[h]);
        }
      });
      return true;
    }
  }
  return false;
}

function findById_(sheetName, idField, idValue) {
  const rows = readRows_(sheetName);
  return rows.find((r) => r[idField] === idValue) || null;
}
