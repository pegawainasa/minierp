/**
 * Seed data awal untuk demo/testing cepat.
 * Jalankan manual dari Apps Script editor: seedStarterData_()
 */
function seedStarterData_() {
  const seedRows = {
    Cabang: [
      {
        cabang_id: 'CBG-001',
        nama_cabang: 'Mini ERP Mart - Pusat',
        kota: 'Jakarta',
        alamat: 'Jl. Contoh No. 1',
        telepon: '0215550001',
        is_active: '1'
      },
      {
        cabang_id: 'CBG-002',
        nama_cabang: 'Mini ERP Mart - Bandung',
        kota: 'Bandung',
        alamat: 'Jl. Contoh No. 2',
        telepon: '0225550002',
        is_active: '1'
      }
    ],
    User_Akses: [
      {
        user_id: 'USR-ADM-001',
        nama_user: 'Admin Utama',
        email: 'admin@mini-erp.local',
        role: 'ADMIN',
        cabang_id: 'CBG-001',
        pin_kasir: '123456',
        is_active: '1'
      },
      {
        user_id: 'USR-KSR-001',
        nama_user: 'Kasir Pusat',
        email: 'kasir@mini-erp.local',
        role: 'KASIR',
        cabang_id: 'CBG-001',
        pin_kasir: '123456',
        is_active: '1'
      },
      {
        user_id: 'USR-OWN-001',
        nama_user: 'Owner',
        email: 'owner@mini-erp.local',
        role: 'OWNER',
        cabang_id: 'CBG-001',
        pin_kasir: '123456',
        is_active: '1'
      }
    ],
    Produk: [
      {
        produk_id: 'PRD-001',
        sku: 'SKU-001',
        barcode: '899100001',
        nama_produk: 'Air Mineral 600ml',
        kategori: 'Minuman',
        satuan: 'PCS',
        harga_beli: 3000,
        harga_jual: 5000,
        stok_minimum: 10,
        is_active: '1'
      },
      {
        produk_id: 'PRD-002',
        sku: 'SKU-002',
        barcode: '899100002',
        nama_produk: 'Mie Instan Goreng',
        kategori: 'Sembako',
        satuan: 'PCS',
        harga_beli: 2500,
        harga_jual: 3500,
        stok_minimum: 15,
        is_active: '1'
      },
      {
        produk_id: 'PRD-003',
        sku: 'SKU-003',
        barcode: '899100003',
        nama_produk: 'Sabun Mandi 80gr',
        kategori: 'Toiletries',
        satuan: 'PCS',
        harga_beli: 4000,
        harga_jual: 5500,
        stok_minimum: 8,
        is_active: '1'
      }
    ],
    Pelanggan: [
      {
        pelanggan_id: 'PLG-001',
        nama_pelanggan: 'Budi Santoso',
        no_wa: '628111111111',
        email: 'budi@mail.com',
        member_level: 'REGULAR',
        poin: 100,
        tanggal_gabung: '2026-04-01',
        is_active: '1'
      }
    ],
    Supplier: [
      {
        supplier_id: 'SUP-001',
        nama_supplier: 'PT Supplier Makmur',
        kontak: 'Andi',
        telepon: '02177770001',
        alamat: 'Jl. Industri No. 88',
        is_active: '1'
      }
    ],
    Promo_Voucher: [
      {
        voucher_id: 'VCR-001',
        kode_voucher: 'HEMAT10',
        nama_promo: 'Diskon 10 Persen',
        tipe_diskon: 'PERCENT',
        nilai_diskon: 10,
        minimal_belanja: 20000,
        tanggal_mulai: '2026-01-01',
        tanggal_selesai: '2027-12-31',
        kuota: 100,
        status: 'ACTIVE'
      }
    ]
  };

  Object.keys(seedRows).forEach((sheetName) => {
    if (!SHEETS[sheetName]) return;
    const existing = readRows_(sheetName);
    if (existing.length > 0) return;

    seedRows[sheetName].forEach((row) => appendRow_(sheetName, row));
  });

  const existingMutasi = readRows_('Stok_Mutasi');
  if (existingMutasi.length === 0) {
    appendRow_('Stok_Mutasi', {
      mutasi_id: 'MTS-OPEN-001',
      tanggal: nowIso_(),
      cabang_id: 'CBG-001',
      produk_id: 'PRD-001',
      jenis_mutasi: 'SALDO_AWAL',
      ref_no: 'OPENING',
      qty_masuk: 100,
      qty_keluar: 0,
      saldo_qty: 100,
      keterangan: 'Saldo awal seed'
    });

    appendRow_('Stok_Mutasi', {
      mutasi_id: 'MTS-OPEN-002',
      tanggal: nowIso_(),
      cabang_id: 'CBG-001',
      produk_id: 'PRD-002',
      jenis_mutasi: 'SALDO_AWAL',
      ref_no: 'OPENING',
      qty_masuk: 80,
      qty_keluar: 0,
      saldo_qty: 80,
      keterangan: 'Saldo awal seed'
    });

    appendRow_('Stok_Mutasi', {
      mutasi_id: 'MTS-OPEN-003',
      tanggal: nowIso_(),
      cabang_id: 'CBG-001',
      produk_id: 'PRD-003',
      jenis_mutasi: 'SALDO_AWAL',
      ref_no: 'OPENING',
      qty_masuk: 60,
      qty_keluar: 0,
      saldo_qty: 60,
      keterangan: 'Saldo awal seed'
    });
  }
}
