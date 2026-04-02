# Contoh Request / Response JSON

> Base URL Worker: `https://<your-worker>.workers.dev/api`

## 1) Login

### Request
`POST /auth/login`

```json
{
  "email": "kasir1@toko.com",
  "pin": "123456"
}
```

### Response
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "token": "eyJ1c2VyX2lkIjoiVVNSL...",
    "user": {
      "user_id": "USR-20260402093000-123",
      "nama_user": "Kasir Utama",
      "email": "kasir1@toko.com",
      "role": "KASIR",
      "cabang_id": "CBG-001"
    }
  }
}
```

## 2) List Master Produk

### Request
`POST /master/list`

```json
{
  "module": "produk",
  "filters": {
    "is_active": "1"
  }
}
```

### Response
```json
{
  "success": true,
  "data": [
    {
      "produk_id": "PRD-20260402093501-221",
      "sku": "SKU-001",
      "nama_produk": "Air Mineral 600ml",
      "harga_jual": 5000,
      "is_active": "1"
    }
  ]
}
```

## 3) Transaksi POS

### Request
`POST /pos/create`

```json
{
  "token": "<TOKEN_LOGIN>",
  "cabang_id": "CBG-001",
  "kode_voucher": "HEMAT10",
  "metode_bayar": "QRIS",
  "payment_status": "PENDING",
  "kirim_wa": true,
  "items": [
    {
      "produk_id": "PRD-20260402093501-221",
      "qty": 2,
      "diskon_item": 0
    }
  ],
  "payment_gateway_ref": "PG-INV-001",
  "whatsapp_target": "628123456789"
}
```

### Response
```json
{
  "success": true,
  "data": {
    "trx": {
      "trx_id": "TRX-20260402094001-345",
      "grand_total": 10000,
      "payment_status": "PENDING"
    },
    "detail": [
      {
        "detail_id": "DTL-20260402094001-567",
        "produk_id": "PRD-20260402093501-221",
        "qty": 2
      }
    ],
    "integration_fields": {
      "payment_gateway_ref": "PG-INV-001",
      "payment_gateway_payload": null,
      "whatsapp_template_id": "",
      "whatsapp_target": "628123456789"
    }
  }
}
```

## 4) Pembelian

### Request
`POST /purchase/create`

```json
{
  "token": "<TOKEN_LOGIN>",
  "cabang_id": "CBG-001",
  "supplier_id": "SUP-001",
  "items": [
    {
      "produk_id": "PRD-20260402093501-221",
      "qty": 10,
      "harga_beli": 3500
    }
  ]
}
```

## 5) Dashboard Ringkas

### Request
`GET /dashboard/summary?token=<TOKEN>&cabang_id=CBG-001&date_from=2026-04-01&date_to=2026-04-02`

### Response
```json
{
  "success": true,
  "data": {
    "period": {
      "date_from": "2026-04-01",
      "date_to": "2026-04-02"
    },
    "total_cabang": 1,
    "total_transaksi": 7,
    "total_omset": 1460000,
    "summary_per_cabang": [
      {
        "cabang_id": "CBG-001",
        "nama_cabang": "Cabang Pusat",
        "total_transaksi": 7,
        "total_omset": 1460000
      }
    ],
    "low_stock_count": 3,
    "low_stock_items": []
  }
}
```

## 6) Payment Webhook (Update Status Otomatis)

### Request
`POST /payment/webhook`

```json
{
  "trx_id": "TRX-20260402094001-345",
  "payment_status": "SETTLEMENT",
  "gateway_ref": "PG-INV-001",
  "transaction_status": "success"
}
```

### Response
```json
{
  "success": true,
  "data": {
    "trx_id": "TRX-20260402094001-345",
    "payment_status_before": "PENDING",
    "payment_status_after": "LUNAS",
    "status_changed": true,
    "journal_created": true,
    "wa_receipt": {
      "sent": false,
      "channel": "WHATSAPP",
      "mode": "preview",
      "reason": "WHATSAPP_API_URL belum diset. Pesan disiapkan sebagai preview."
    }
  }
}
```
