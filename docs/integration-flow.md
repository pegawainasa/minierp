# Alur Integrasi Payment Gateway & WhatsApp Gateway (Sederhana)

## A) Payment Gateway Flow (MVP)

1. Kasir membuat transaksi POS dari UI.
2. UI kirim ke Worker: `metode_bayar`, `payment_status=PENDING`, `payment_gateway_ref` (jika sudah ada).
3. Worker forward ke Apps Script (`action: pos.create`).
4. Apps Script simpan transaksi + detail + mutasi stok + jurnal.
5. Jika memakai payment link/invoice eksternal, simpan `payment_gateway_ref` untuk sinkronisasi.
6. Saat webhook payment provider diterima (tahap lanjutan), update `payment_status` menjadi `PAID` atau `FAILED`.

### Endpoint update status (lanjutan yang disarankan)
- Tambahkan action baru: `payment.updateStatus`
- Payload contoh:

```json
{
  "trx_id": "TRX-...",
  "payment_status": "PAID",
  "payment_gateway_ref": "INV-001",
  "provider_payload": {"raw":"..."}
}
```

## B) WhatsApp Gateway Flow (MVP)

1. Kasir checklist `kirim_wa` saat POS.
2. Apps Script menyimpan transaksi (`kirim_wa=1`) + target WA jika ada.
3. Worker atau service eksternal membaca event transaksi baru.
4. Sistem kirim pesan WhatsApp (struk ringkas / notifikasi poin).
5. Simpan status kirim (sent/failed) di log eksternal atau sheet tambahan (`WA_Log`, opsional).

### Payload WA sederhana

```json
{
  "to": "628123456789",
  "template": "struk_pos",
  "variables": {
    "trx_id": "TRX-...",
    "grand_total": 125000
  }
}
```
