# Mini ERP Retail (MVP)

MVP aplikasi web internal Mini ERP Retail berbasis:

- **Google Sheets** sebagai database utama
- **Google Apps Script** sebagai backend/API utama
- **Cloudflare Workers** sebagai API gateway ringan
- **Web UI sederhana** (HTML/CSS/JS) untuk kasir/pemula

## Struktur Folder

```txt
apps-script/                # Backend Google Apps Script
worker/                     # Cloudflare Worker API gateway
web/                        # UI web sederhana
docs/                       # API examples, flow integrasi, asumsi, deployment
templates/excel/            # Struktur file import Google Sheets (CSV per sheet)
```

## Catatan Cepat

1. Backend utama ada di `apps-script/`.
2. Worker meneruskan request ke Apps Script agar URL backend tidak dipakai langsung di browser.
3. UI memanggil endpoint Worker (`/api/...`).
4. Template CSV bisa dibuka di Excel lalu disimpan sebagai `.xlsx` bila diperlukan.

Lihat panduan implementasi lengkap di `docs/deployment-step-by-step.md`.
