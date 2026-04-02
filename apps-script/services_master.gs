/**
 * Service master data.
 */
function masterList_(payload) {
  const moduleMap = {
    cabang: { sheet: 'Cabang', idField: 'cabang_id' },
    produk: { sheet: 'Produk', idField: 'produk_id' },
    pelanggan: { sheet: 'Pelanggan', idField: 'pelanggan_id' },
    supplier: { sheet: 'Supplier', idField: 'supplier_id' },
    voucher: { sheet: 'Promo_Voucher', idField: 'voucher_id' }
  };

  const moduleName = String(payload.module || '').toLowerCase();
  const cfg = moduleMap[moduleName];
  if (!cfg) throw new Error('Module master tidak valid.');

  const user = getSessionUser_(payload);
  const kasirReadable = ['produk', 'voucher'];
  if (kasirReadable.indexOf(moduleName) >= 0) {
    requireRole_(user, [ROLE.ADMIN, ROLE.KASIR, ROLE.OWNER]);
  } else {
    requireRole_(user, [ROLE.ADMIN, ROLE.OWNER]);
  }

  return listSheetData_(cfg.sheet, payload.filters || {});
}

function masterCreate_(payload) {
  const moduleMap = {
    cabang: { sheet: 'Cabang', idField: 'cabang_id' },
    produk: { sheet: 'Produk', idField: 'produk_id' },
    pelanggan: { sheet: 'Pelanggan', idField: 'pelanggan_id' },
    supplier: { sheet: 'Supplier', idField: 'supplier_id' },
    voucher: { sheet: 'Promo_Voucher', idField: 'voucher_id' }
  };

  const moduleName = String(payload.module || '').toLowerCase();
  const cfg = moduleMap[moduleName];
  if (!cfg) throw new Error('Module master tidak valid.');

  const user = getSessionUser_(payload);
  requireRole_(user, [ROLE.ADMIN, ROLE.OWNER]);

  return createSheetData_(cfg.sheet, payload.data || {}, cfg.idField);
}

function masterUpdate_(payload) {
  const moduleMap = {
    cabang: { sheet: 'Cabang', idField: 'cabang_id' },
    produk: { sheet: 'Produk', idField: 'produk_id' },
    pelanggan: { sheet: 'Pelanggan', idField: 'pelanggan_id' },
    supplier: { sheet: 'Supplier', idField: 'supplier_id' },
    voucher: { sheet: 'Promo_Voucher', idField: 'voucher_id' }
  };

  const moduleName = String(payload.module || '').toLowerCase();
  const cfg = moduleMap[moduleName];
  if (!cfg) throw new Error('Module master tidak valid.');

  const user = getSessionUser_(payload);
  requireRole_(user, [ROLE.ADMIN, ROLE.OWNER]);

  return updateSheetData_(cfg.sheet, cfg.idField, payload.id, payload.data || {});
}
