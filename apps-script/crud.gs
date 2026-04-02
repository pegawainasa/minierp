/**
 * CRUD generic sederhana.
 */
function listSheetData_(sheetName, filters) {
  let rows = readRows_(sheetName);
  if (filters) {
    Object.keys(filters).forEach((k) => {
      if (filters[k] !== undefined && filters[k] !== null && filters[k] !== '') {
        rows = rows.filter((r) => String(r[k]) === String(filters[k]));
      }
    });
  }
  return rows;
}

function createSheetData_(sheetName, payload, idField) {
  const row = Object.assign({}, payload);
  row[idField] = row[idField] || genId_(sheetName);
  appendRow_(sheetName, row);
  return row;
}

function updateSheetData_(sheetName, idField, idValue, payload) {
  const ok = updateRowById_(sheetName, idField, idValue, payload);
  if (!ok) throw new Error(`${sheetName} dengan id ${idValue} tidak ditemukan.`);
  return findById_(sheetName, idField, idValue);
}
