# Asumsi Implementasi

1. **Database utama** memakai satu Google Spreadsheet dengan tab sesuai nama sheet yang diminta.
2. `is_active` memakai nilai string `1` (aktif) dan `0` (nonaktif).
3. Login sederhana menggunakan kombinasi `email + pin_kasir` dari sheet `User_Akses`.
4. Token sesi bersifat ringan (base64 payload), cocok untuk MVP internal (bukan security enterprise penuh).
5. Validasi stok penjualan dihitung dari saldo terakhir di sheet `Stok_Mutasi` per `cabang_id + produk_id`.
6. Jika belum ada mutasi untuk produk tertentu, saldo dianggap `0`.
7. Voucher valid jika: status `ACTIVE`, periode aktif, kuota > 0, dan minimal belanja terpenuhi.
8. Jurnal otomatis memakai akun contoh default:
   - Penjualan: `1101 Kas`, `4101 Penjualan`, `2101 PPN Keluaran`
   - Pembelian: `1201 Persediaan`, `2102 Hutang Dagang`
9. Integrasi payment gateway dan WhatsApp masih tahap field/pipeline dasar (placeholder), belum koneksi provider spesifik.
10. UI didesain ringan dan mudah dipakai kasir pemula (single page, menu sederhana, form langsung).
