/**
 * Service dashboard ringkas per cabang.
 */
function dashboardSummary_(payload) {
  const user = getSessionUser_(payload);
  requireRole_(user, [ROLE.ADMIN, ROLE.KASIR, ROLE.OWNER]);

  const isAdminOrOwner = [ROLE.ADMIN, ROLE.OWNER].indexOf(String(user.role)) >= 0;
  const range = resolveDashboardDateRange_(payload);
  const cabangIds = resolveDashboardCabangIds_(payload.cabang_id, user, isAdminOrOwner);

  const cabangRows = readRows_('Cabang').filter((c) =>
    cabangIds.indexOf(String(c.cabang_id)) >= 0
  );

  const trxRows = readRows_('POS_Transaksi').filter((t) => {
    if (cabangIds.indexOf(String(t.cabang_id)) < 0) return false;
    if (!isPaymentSettledStatus_(t.payment_status)) return false;
    const tDate = safeDateKey_(t.tanggal);
    if (!tDate) return false;
    return tDate >= range.date_from && tDate <= range.date_to;
  });

  const summaryPerCabang = cabangRows.map((cabang) => {
    const cabangTrx = trxRows.filter((t) => String(t.cabang_id) === String(cabang.cabang_id));
    return {
      cabang_id: cabang.cabang_id,
      nama_cabang: cabang.nama_cabang,
      total_transaksi: cabangTrx.length,
      total_omset: cabangTrx.reduce((acc, t) => acc + toNum_(t.grand_total), 0)
    };
  });

  const produkAktif = readRows_('Produk').filter((p) => toBooleanFlag_(p.is_active));
  const lowStockItems = [];
  cabangRows.forEach((cabang) => {
    produkAktif.forEach((produk) => {
      const saldo = getStockSaldo_(cabang.cabang_id, produk.produk_id);
      if (saldo <= toNum_(produk.stok_minimum)) {
        lowStockItems.push({
          cabang_id: cabang.cabang_id,
          nama_cabang: cabang.nama_cabang,
          produk_id: produk.produk_id,
          nama_produk: produk.nama_produk,
          stok_minimum: toNum_(produk.stok_minimum),
          saldo_qty: saldo
        });
      }
    });
  });

  return {
    period: range,
    total_cabang: summaryPerCabang.length,
    total_transaksi: summaryPerCabang.reduce((acc, s) => acc + toNum_(s.total_transaksi), 0),
    total_omset: summaryPerCabang.reduce((acc, s) => acc + toNum_(s.total_omset), 0),
    summary_per_cabang: summaryPerCabang,
    low_stock_count: lowStockItems.length,
    low_stock_items: lowStockItems.slice(0, 50)
  };
}

function resolveDashboardCabangIds_(requestedCabangId, user, isAdminOrOwner) {
  const activeCabang = readRows_('Cabang').filter((c) => toBooleanFlag_(c.is_active));
  const requested = String(requestedCabangId || '').trim();

  if (String(user.role) === ROLE.KASIR) {
    if (requested && requested !== String(user.cabang_id)) {
      throw new Error('KASIR hanya bisa mengakses dashboard cabang sendiri.');
    }
    return [String(user.cabang_id)];
  }

  if (requested) {
    const found = activeCabang.find((c) => String(c.cabang_id) === requested);
    if (!found) throw new Error(`Cabang ${requested} tidak ditemukan / tidak aktif.`);
    return [requested];
  }

  if (isAdminOrOwner) {
    return activeCabang.map((c) => String(c.cabang_id));
  }

  return [String(user.cabang_id)];
}

function resolveDashboardDateRange_(payload) {
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const from = toDateKey_(payload.date_from || today);
  const to = toDateKey_(payload.date_to || today);

  if (from > to) {
    throw new Error('Parameter date_from tidak boleh lebih besar dari date_to.');
  }

  return {
    date_from: from,
    date_to: to
  };
}

function toDateKey_(value) {
  const d = new Date(value);
  if (String(d) === 'Invalid Date') {
    throw new Error(`Tanggal tidak valid: ${value}`);
  }
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function safeDateKey_(value) {
  try {
    return toDateKey_(value);
  } catch (_err) {
    return '';
  }
}
