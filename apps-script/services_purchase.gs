/**
 * Service pembelian stok.
 */
function purchaseCreate_(payload) {
  const user = getSessionUser_(payload);
  requireRole_(user, [ROLE.ADMIN, ROLE.OWNER]);

  const cabangId = payload.cabang_id || user.cabang_id;
  const items = payload.items || [];
  if (!items.length) throw new Error('Detail pembelian wajib diisi.');

  let subtotal = 0;
  const details = items.map((it) => {
    const qty = toNum_(it.qty);
    const hargaBeli = toNum_(it.harga_beli);
    const line = qty * hargaBeli;
    subtotal += line;
    return {
      detail_beli_id: genId_('Pembelian_Detail'),
      beli_id: '',
      produk_id: it.produk_id,
      qty: qty,
      harga_beli: hargaBeli,
      subtotal: line
    };
  });

  const diskon = toNum_(payload.diskon);
  const ongkir = toNum_(payload.ongkir);
  const grandTotal = subtotal - diskon + ongkir;

  const beliId = genId_('Pembelian');
  const header = {
    beli_id: beliId,
    tanggal: payload.tanggal || nowIso_(),
    cabang_id: cabangId,
    supplier_id: payload.supplier_id,
    user_id: user.user_id,
    subtotal: subtotal,
    diskon: diskon,
    ongkir: ongkir,
    grand_total: grandTotal,
    status_bayar: payload.status_bayar || 'UNPAID',
    status_terima: payload.status_terima || 'RECEIVED',
    catatan: payload.catatan || ''
  };

  appendRow_('Pembelian', header);

  details.forEach((d) => {
    d.beli_id = beliId;
    appendRow_('Pembelian_Detail', d);

    const saldoBefore = getStockSaldo_(cabangId, d.produk_id);
    const saldoAfter = saldoBefore + toNum_(d.qty);
    appendRow_('Stok_Mutasi', {
      mutasi_id: genId_('Stok_Mutasi'),
      tanggal: nowIso_(),
      cabang_id: cabangId,
      produk_id: d.produk_id,
      jenis_mutasi: 'PEMBELIAN',
      ref_no: beliId,
      qty_masuk: d.qty,
      qty_keluar: 0,
      saldo_qty: saldoAfter,
      keterangan: 'Pembelian stok'
    });
  });

  createJournalForPurchase_(header);
  return { pembelian: header, detail: details };
}

function createJournalForPurchase_(beli) {
  appendRow_('Jurnal_Umum', {
    jurnal_id: genId_('Jurnal_Umum'),
    tanggal: beli.tanggal,
    ref_no: beli.beli_id,
    akun_kode: '1201',
    nama_akun: 'Persediaan',
    debit: toNum_(beli.grand_total),
    kredit: 0,
    cabang_id: beli.cabang_id,
    keterangan: 'Penambahan persediaan dari pembelian'
  });

  appendRow_('Jurnal_Umum', {
    jurnal_id: genId_('Jurnal_Umum'),
    tanggal: beli.tanggal,
    ref_no: beli.beli_id,
    akun_kode: '2102',
    nama_akun: 'Hutang Dagang',
    debit: 0,
    kredit: toNum_(beli.grand_total),
    cabang_id: beli.cabang_id,
    keterangan: 'Kewajiban ke supplier'
  });
}
