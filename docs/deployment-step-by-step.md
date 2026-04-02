# Langkah Implementasi Step-by-Step

## 1) Siapkan Google Sheets

1. Buat Google Spreadsheet baru.
2. Buat 12 sheet dengan nama persis:
   - Cabang
   - User_Akses
   - Produk
   - Pelanggan
   - Supplier
   - Promo_Voucher
   - POS_Transaksi
   - POS_Detail
   - Pembelian
   - Pembelian_Detail
   - Stok_Mutasi
   - Jurnal_Umum
3. Import header dari `templates/excel/*.csv` ke masing-masing sheet.

## 2) Deploy Google Apps Script

1. Buka [script.google.com](https://script.google.com), buat project baru.
2. Copy semua file dari folder `apps-script/` ke editor Apps Script.
3. Di **Project Settings > Script Properties**, set:
   - `SPREADSHEET_ID=<ID spreadsheet Anda>`
   - `GATEWAY_SHARED_KEY=<secret-random-kuat>`
   - `PAYMENT_WEBHOOK_SECRET=<secret-khusus-webhook>` (opsional tapi sangat disarankan)
   - `WHATSAPP_API_URL=<endpoint provider WA>` (opsional untuk live send)
   - `WHATSAPP_API_TOKEN=<token provider WA>` (opsional)
4. Deploy sebagai **Web App**:
   - Execute as: Me
   - Who has access: Anyone (atau domain internal)
5. Salin URL Web App (dipakai Worker sebagai `APPS_SCRIPT_URL`).

## 3) Deploy Cloudflare Worker

1. Masuk ke Cloudflare Workers.
2. Upload kode `worker/src/index.js`.
3. Set environment variables:
   - `APPS_SCRIPT_URL` = URL Web App Apps Script
   - `GATEWAY_SHARED_KEY` = sama persis dengan Script Properties
   - `CLIENT_API_TOKEN` = token untuk request dari UI
   - `PAYMENT_WEBHOOK_SECRET` = sama dengan Script Properties (untuk route webhook)
4. Deploy Worker.

## 4) Jalankan Web UI

1. Buka `web/assets/app.js`.
2. Isi:
   - `API_BASE` = URL Worker Anda + `/api`
   - `CLIENT_TOKEN` = `CLIENT_API_TOKEN`
3. Host folder `web/` di static hosting internal (Cloudflare Pages/Nginx/shared hosting).

## 5) Seed Data Awal (wajib)

Minimal isi data berikut di Google Sheets:

- `Cabang`: minimal 1 cabang aktif.
- `User_Akses`: minimal 1 ADMIN dan 1 KASIR.
- `Produk`: minimal 1 produk aktif.
- `Supplier`: minimal 1 supplier untuk pembelian.

### Opsi cepat seed

- Import file contoh dari folder: `templates/excel/seed/*.seed.csv`
- Atau jalankan fungsi Apps Script `seedStarterData_()` sekali dari editor Apps Script.

## 6) Uji Alur Inti MVP

1. Login dari UI.
2. Tambah produk baru.
3. Buat pembelian (stok masuk).
4. Buat transaksi POS (stok keluar).
5. Cek:
   - Sheet `Stok_Mutasi` bertambah
   - Sheet `Jurnal_Umum` bertambah
   - Dashboard menampilkan ringkasan harian

## 7) Hardening yang Direkomendasikan (lanjutan)

1. Tambahkan token JWT signed (bukan base64 biasa).
2. Endpoint webhook payment sudah tersedia di `POST /api/payment/webhook`.
3. Tambahkan audit log aktivitas user.
4. Tambahkan rate-limit di Worker.
