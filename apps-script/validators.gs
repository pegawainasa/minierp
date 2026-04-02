/**
 * Validasi role, voucher, dan stok.
 */
function requireRole_(user, allowedRoles) {
  if (!user) throw new Error('User tidak ditemukan.');
  if (!toBooleanFlag_(user.is_active)) throw new Error('User tidak aktif.');
  if (allowedRoles.indexOf(String(user.role)) < 0) {
    throw new Error(`Role ${user.role} tidak punya akses.`);
  }
}

function validateVoucher_(voucherCode, subtotal) {
  if (!voucherCode) {
    return { voucher: null, diskon: 0 };
  }

  const vouchers = readRows_('Promo_Voucher');
  const now = new Date();
  const found = vouchers.find((v) => String(v.kode_voucher).toUpperCase() === String(voucherCode).toUpperCase());
  if (!found) throw new Error('Voucher tidak ditemukan.');

  if (String(found.status).toUpperCase() !== 'ACTIVE') {
    throw new Error('Voucher tidak aktif.');
  }

  const start = new Date(found.tanggal_mulai);
  const end = new Date(found.tanggal_selesai);
  if (now < start || now > end) throw new Error('Voucher di luar periode aktif.');

  const minBelanja = toNum_(found.minimal_belanja);
  if (toNum_(subtotal) < minBelanja) throw new Error(`Minimal belanja voucher ${minBelanja}`);

  const kuota = toNum_(found.kuota);
  if (kuota <= 0) throw new Error('Kuota voucher habis.');

  const tipe = String(found.tipe_diskon || '').toUpperCase();
  const nilai = toNum_(found.nilai_diskon);
  const diskon = tipe === 'PERCENT' ? (toNum_(subtotal) * nilai / 100) : nilai;

  return {
    voucher: found,
    diskon: Math.min(diskon, toNum_(subtotal))
  };
}

function getStockSaldo_(cabangId, produkId) {
  const mutasi = readRows_('Stok_Mutasi')
    .filter((m) => m.cabang_id === cabangId && m.produk_id === produkId)
    .sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
  if (!mutasi.length) return 0;
  return toNum_(mutasi[mutasi.length - 1].saldo_qty);
}

function validateStockForSale_(cabangId, items) {
  items.forEach((item) => {
    const saldo = getStockSaldo_(cabangId, item.produk_id);
    if (saldo < toNum_(item.qty)) {
      throw new Error(`Stok produk ${item.produk_id} tidak cukup. Saldo=${saldo}, minta=${item.qty}`);
    }
  });
}
