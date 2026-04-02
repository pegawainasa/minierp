# API Worker Setup (Step-by-Step, Anti Gagal Login)

Panduan ini fokus ke **API Worker** untuk MiniERP. Tujuannya: endpoint `POST /api/auth/login` harus hidup dan login berhasil, meski frontend kamu di-host sebagai static-only worker/pages.

---

## Arsitektur yang Benar

Gunakan pemisahan ini:

- **Frontend (static hosting)**: hanya serve file `web/`.
- **API Worker (script-based)**: menjalankan `worker/src/index.js` dan menangani semua route `/api/*`.
- **Google Apps Script (GAS)**: backend data + business logic.

> Jangan set Variables di worker static-only. Variables harus diset di **API Worker script-based**.

---

## 0) Prasyarat

Pastikan sudah ada:

1. Node.js 18+ dan npm
2. Wrangler CLI (`npx wrangler --version`)
3. Repo MiniERP sudah ter-clone
4. URL Web App GAS aktif
5. Akses ke akun Cloudflare yang benar (domain target)

---

## 1) Siapkan Google Apps Script (Wajib)

Di Apps Script project MiniERP, buka:

**Project Settings → Script Properties**

Set minimal properti ini:

- `SPREADSHEET_ID=<id spreadsheet>`
- `GATEWAY_SHARED_KEY=<secret-random-kuat>`

Opsional tapi direkomendasikan:

- `PAYMENT_WEBHOOK_SECRET=<secret-webhook>`
- `WHATSAPP_API_URL=<url-provider>`
- `WHATSAPP_API_TOKEN=<token-provider>`

Deploy GAS sebagai **Web App**, lalu simpan URL `.../exec`.

---

## 2) Login Cloudflare ke Akun yang Benar

Masuk ke folder worker:

```bash
cd "D:\PROJECT WEB APPS\MINIERP\worker"
```

Login Wrangler:

```bash
npx wrangler login
```

Cek akun aktif:

```bash
npx wrangler whoami
```

Pastikan account yang muncul adalah account Cloudflare untuk domain produksi kamu.

---

## 3) Wajib: Worker API Script-Only (Tanpa Static Assets Binding)

File `worker/wrangler.toml` harus minimal seperti ini:

```toml
name = "minierp"
main = "src/index.js"
```

Kunci penting:

- `main = "src/index.js"` → Worker script-based
- **Jangan pakai `[assets]`** untuk mode ini, supaya worker fokus API dan konfigurasi env jelas.

Kalau worker kamu static-only, endpoint `/api/*` tidak akan ada (umumnya 404 kosong).

---

## 4) Set Variables di API Worker

Set via Wrangler (disarankan):

```bash
npx wrangler secret put APPS_SCRIPT_URL
npx wrangler secret put GATEWAY_SHARED_KEY
npx wrangler secret put CLIENT_API_TOKEN
npx wrangler secret put PAYMENT_WEBHOOK_SECRET
```

Atau di Cloudflare Dashboard, tapi pastikan kamu membuka **Worker API** yang benar (bukan Pages/static worker).

Nilai minimal wajib agar login jalan:

- `APPS_SCRIPT_URL` = URL GAS Web App (`.../exec`)
- `GATEWAY_SHARED_KEY` = sama persis dengan Script Properties GAS

---

## 5) Deploy API Worker

Jalankan:

```bash
npx wrangler deploy
```

Catat URL hasil deploy, misalnya:

`https://minierp.<subdomain>.workers.dev`

---

## 6) Verifikasi Endpoint Login (HARUS JSON, bukan 404 kosong)

Uji endpoint:

```bash
curl -i -X POST "https://<worker-api-domain>/api/auth/login" \
  -H "Content-Type: application/json" \
  -H "X-Client-Token: <CLIENT_API_TOKEN>" \
  -d '{"email":"admin@demo.com","pin":"1234"}'
```

Ekspektasi:

- Status **bukan** 404 kosong
- Body JSON (mis. sukses login / invalid kredensial / pesan bisnis lainnya)

Kalau masih 500 `Worker env belum lengkap`, berarti env di API Worker belum lengkap.

---

## 7) Hubungkan Frontend Static ke API Worker

Saat buka UI, tambahkan query:

```text
https://<frontend-domain>/?api_base=https://<worker-api-domain>&client_token=<CLIENT_API_TOKEN>
```

Frontend akan simpan ke localStorage dan dipakai untuk request berikutnya.

> Jika tidak diisi, frontend akan fallback ke `${origin}/api`. Itu hanya benar kalau UI dan API satu worker script-based.

---

## 8) Checklist Login End-to-End

1. Buka UI
2. Login `admin@demo.com / 1234`
3. Devtools Network: request menuju `https://<worker-api-domain>/api/auth/login`
4. Response berformat JSON
5. Redirect/dashboard tampil

---

## Troubleshooting Cepat

### A) Error: `Variables cannot be added to a Worker that only has static assets`
Kamu sedang membuka worker static-only/pages. Pindah ke **API Worker script-based** (`main=src/index.js`), set vars di sana.

### B) `POST /api/auth/login` → 404 kosong
Domain frontend tidak punya API route. Set `api_base` ke API worker atau bind domain ke service worker yang benar.

### C) Response: `Worker env belum lengkap`
Set env di API Worker: `APPS_SCRIPT_URL`, `GATEWAY_SHARED_KEY` (minimal).

### D) Response: `GATEWAY_SHARED_KEY belum diset.`
Set Script Properties GAS: `GATEWAY_SHARED_KEY`.

### E) `Failed to fetch`
Biasanya URL API salah / DNS / CORS / domain target salah. Cek `api_base` dan network tab.

---

## Nilai Konfigurasi yang Harus Match

- `worker.GATEWAY_SHARED_KEY` == `gas.ScriptProperties.GATEWAY_SHARED_KEY`
- `worker.APPS_SCRIPT_URL` mengarah ke GAS Web App yang aktif (versi deploy terbaru)
- `CLIENT_API_TOKEN` di frontend sama dengan yang dicek worker (jika validasi diaktifkan)

Dengan 3 poin ini match, login akan konsisten berhasil.
