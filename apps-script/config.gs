/**
 * Konfigurasi global sheet dan kolom.
 */
const SHEETS = {
  Cabang: ['cabang_id', 'nama_cabang', 'kota', 'alamat', 'telepon', 'is_active'],
  User_Akses: ['user_id', 'nama_user', 'email', 'role', 'cabang_id', 'pin_kasir', 'is_active'],
  Produk: ['produk_id', 'sku', 'barcode', 'nama_produk', 'kategori', 'satuan', 'harga_beli', 'harga_jual', 'stok_minimum', 'is_active'],
  Pelanggan: ['pelanggan_id', 'nama_pelanggan', 'no_wa', 'email', 'member_level', 'poin', 'tanggal_gabung', 'is_active'],
  Supplier: ['supplier_id', 'nama_supplier', 'kontak', 'telepon', 'alamat', 'is_active'],
  Promo_Voucher: ['voucher_id', 'kode_voucher', 'nama_promo', 'tipe_diskon', 'nilai_diskon', 'minimal_belanja', 'tanggal_mulai', 'tanggal_selesai', 'kuota', 'status'],
  POS_Transaksi: ['trx_id', 'tanggal', 'cabang_id', 'kasir_id', 'pelanggan_id', 'voucher_id', 'metode_bayar', 'payment_status', 'subtotal', 'diskon', 'ppn', 'grand_total', 'status_trx', 'kirim_wa', 'catatan'],
  POS_Detail: ['detail_id', 'trx_id', 'produk_id', 'qty', 'harga', 'diskon_item', 'subtotal_item'],
  Pembelian: ['beli_id', 'tanggal', 'cabang_id', 'supplier_id', 'user_id', 'subtotal', 'diskon', 'ongkir', 'grand_total', 'status_bayar', 'status_terima', 'catatan'],
  Pembelian_Detail: ['detail_beli_id', 'beli_id', 'produk_id', 'qty', 'harga_beli', 'subtotal'],
  Stok_Mutasi: ['mutasi_id', 'tanggal', 'cabang_id', 'produk_id', 'jenis_mutasi', 'ref_no', 'qty_masuk', 'qty_keluar', 'saldo_qty', 'keterangan'],
  Jurnal_Umum: ['jurnal_id', 'tanggal', 'ref_no', 'akun_kode', 'nama_akun', 'debit', 'kredit', 'cabang_id', 'keterangan']
};

const ROLE = {
  ADMIN: 'ADMIN',
  KASIR: 'KASIR',
  OWNER: 'OWNER'
};

const STATUS = {
  ACTIVE: '1',
  INACTIVE: '0'
};

/**
 * Prefix ID per sheet.
 */
const ID_PREFIX = {
  Cabang: 'CBG',
  User_Akses: 'USR',
  Produk: 'PRD',
  Pelanggan: 'PLG',
  Supplier: 'SUP',
  Promo_Voucher: 'VCR',
  POS_Transaksi: 'TRX',
  POS_Detail: 'DTL',
  Pembelian: 'BLI',
  Pembelian_Detail: 'BDT',
  Stok_Mutasi: 'MTS',
  Jurnal_Umum: 'JRL'
};
