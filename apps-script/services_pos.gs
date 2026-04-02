/**
 * Service transaksi POS.
 */
function posCreateTransaction_(payload) {
  const user = getSessionUser_(payload);
  requireRole_(user, [ROLE.ADMIN, ROLE.KASIR, ROLE.OWNER]);

  const cabangId = payload.cabang_id || user.cabang_id;
  const items = payload.items || [];
  if (!items.length) throw new Error('Item transaksi wajib diisi.');

  validateStockForSale_(cabangId, items);

  let subtotal = 0;
  const detailRows = items.map((it) => {
    const produk = findById_('Produk', 'produk_id', it.produk_id);
    if (!produk || !toBooleanFlag_(produk.is_active)) {
      throw new Error(`Produk ${it.produk_id} tidak aktif/tdk ditemukan.`);
    }
    const harga = it.harga !== undefined ? toNum_(it.harga) : toNum_(produk.harga_jual);
    const qty = toNum_(it.qty);
    const diskonItem = toNum_(it.diskon_item);
    const subtotalItem = (harga * qty) - diskonItem;
    subtotal += subtotalItem;

    return {
      detail_id: genId_('POS_Detail'),
      trx_id: '',
      produk_id: it.produk_id,
      qty: qty,
      harga: harga,
      diskon_item: diskonItem,
      subtotal_item: subtotalItem
    };
  });

  const voucherInfo = validateVoucher_(payload.kode_voucher, subtotal);
  const ppn = toNum_(payload.ppn || 0);
  const diskon = toNum_(voucherInfo.diskon);
  const grandTotal = subtotal - diskon + ppn;
  const paymentStatus = normalizePaymentStatus_(payload.payment_status || 'PENDING');
  const isSettled = isPaymentSettledStatus_(paymentStatus);

  const trxId = genId_('POS_Transaksi');
  const trxRow = {
    trx_id: trxId,
    tanggal: payload.tanggal || nowIso_(),
    cabang_id: cabangId,
    kasir_id: user.user_id,
    pelanggan_id: payload.pelanggan_id || '',
    voucher_id: voucherInfo.voucher ? voucherInfo.voucher.voucher_id : '',
    metode_bayar: payload.metode_bayar || 'CASH',
    payment_status: paymentStatus,
    subtotal: subtotal,
    diskon: diskon,
    ppn: ppn,
    grand_total: grandTotal,
    status_trx: payload.status_trx || (isSettled ? 'SELESAI' : 'MENUNGGU_PEMBAYARAN'),
    kirim_wa: payload.kirim_wa ? '1' : '0',
    catatan: payload.catatan || ''
  };
  appendRow_('POS_Transaksi', trxRow);

  detailRows.forEach((d) => {
    d.trx_id = trxId;
    appendRow_('POS_Detail', d);

    const saldoBefore = getStockSaldo_(cabangId, d.produk_id);
    const saldoAfter = saldoBefore - toNum_(d.qty);
    appendRow_('Stok_Mutasi', {
      mutasi_id: genId_('Stok_Mutasi'),
      tanggal: nowIso_(),
      cabang_id: cabangId,
      produk_id: d.produk_id,
      jenis_mutasi: 'PENJUALAN',
      ref_no: trxId,
      qty_masuk: 0,
      qty_keluar: d.qty,
      saldo_qty: saldoAfter,
      keterangan: 'Penjualan POS'
    });
  });

  if (isSettled) {
    if (!hasJournalEntryForRef_(trxId)) {
      createJournalForSale_(trxRow);
    }

    if (trxRow.kirim_wa === '1') {
      trySendWhatsAppReceiptForTransaction_(trxId, payload.whatsapp_target || '');
    }
  }

  if (voucherInfo.voucher) {
    const kuotaBaru = Math.max(0, toNum_(voucherInfo.voucher.kuota) - 1);
    updateSheetData_('Promo_Voucher', 'voucher_id', voucherInfo.voucher.voucher_id, { kuota: kuotaBaru });
  }

  return {
    trx: trxRow,
    detail: detailRows,
    integration_fields: {
      payment_gateway_ref: payload.payment_gateway_ref || '',
      payment_gateway_payload: payload.payment_gateway_payload || null,
      whatsapp_template_id: payload.whatsapp_template_id || '',
      whatsapp_target: payload.whatsapp_target || ''
    }
  };
}

function createJournalForSale_(trx) {
  const date = trx.tanggal || nowIso_();
  const ref = trx.trx_id;
  const cabang = trx.cabang_id;

  appendRow_('Jurnal_Umum', {
    jurnal_id: genId_('Jurnal_Umum'),
    tanggal: date,
    ref_no: ref,
    akun_kode: '1101',
    nama_akun: 'Kas',
    debit: toNum_(trx.grand_total),
    kredit: 0,
    cabang_id: cabang,
    keterangan: 'Kas dari penjualan POS'
  });

  appendRow_('Jurnal_Umum', {
    jurnal_id: genId_('Jurnal_Umum'),
    tanggal: date,
    ref_no: ref,
    akun_kode: '4101',
    nama_akun: 'Penjualan',
    debit: 0,
    kredit: toNum_(trx.subtotal) - toNum_(trx.diskon),
    cabang_id: cabang,
    keterangan: 'Pendapatan penjualan'
  });

  if (toNum_(trx.ppn) > 0) {
    appendRow_('Jurnal_Umum', {
      jurnal_id: genId_('Jurnal_Umum'),
      tanggal: date,
      ref_no: ref,
      akun_kode: '2101',
      nama_akun: 'PPN Keluaran',
      debit: 0,
      kredit: toNum_(trx.ppn),
      cabang_id: cabang,
      keterangan: 'PPN transaksi penjualan'
    });
  }
}
