# Quick Smoke Test (5-10 menit)

## Prasyarat
- Worker dan Apps Script sudah deploy.
- UI sudah menunjuk `API_BASE` dan `CLIENT_TOKEN` yang benar.
- Seed data sudah diimport (manual CSV atau `seedStarterData_()`).

## Skenario uji cepat

1. **Login KASIR**
   - Email: `kasir@mini-erp.local`
   - PIN: `123456`
   - Pastikan dashboard tampil.

2. **Cek dashboard**
   - KPI tampil tanpa error.
   - Menu bisa pindah halaman.

3. **Transaksi POS**
   - Masuk halaman POS.
   - Isi `produk_id = PRD-001`, `qty = 2`, voucher `HEMAT10` (opsional).
   - Submit dan pastikan muncul `Transaksi berhasil: TRX-...`

4. **Validasi dampak data**
   - `POS_Transaksi` dan `POS_Detail` bertambah.
   - `Stok_Mutasi` bertambah (jenis `PENJUALAN`, qty keluar).
   - `Jurnal_Umum` bertambah (Kas + Penjualan).

5. **Login ADMIN / OWNER**
   - Coba halaman pembelian.
   - Buat pembelian dengan `supplier_id = SUP-001`, `produk_id = PRD-002`, qty 5.
   - Cek mutasi stok masuk dan jurnal pembelian.

## Hasil yang dianggap lulus

- Login role berjalan.
- POS & pembelian tersimpan.
- Stok otomatis berubah.
- Jurnal otomatis tercatat.
- Dashboard tetap bisa dibuka setelah transaksi.
