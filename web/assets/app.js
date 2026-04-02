const runtimeConfig = resolveRuntimeConfig();
const API_BASE = runtimeConfig.apiBase;
const CLIENT_TOKEN = runtimeConfig.clientToken;
const SAME_ORIGIN_API_BASE = normalizeApiBase(`${window.location.origin}/api`);

const state = {
  token: localStorage.getItem('mini_erp_token') || '',
  user: JSON.parse(localStorage.getItem('mini_erp_user') || 'null')
};

const loginView = document.getElementById('login-view');
const appView = document.getElementById('app-view');
const loginMsg = document.getElementById('login-msg');
const welcome = document.getElementById('welcome');
const roleInfo = document.getElementById('role-info');
const heroContext = document.getElementById('hero-context');

document.getElementById('login-form').addEventListener('submit', onLogin);
document.getElementById('logout-btn').addEventListener('click', onLogout);
document.querySelectorAll('.nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => switchPage(btn.dataset.page));
});

boot();

function boot() {
  if (state.token && state.user) {
    showApp();
    renderAllPages();
  } else {
    showLogin();
  }
}

async function onLogin(e) {
  e.preventDefault();
  loginMsg.textContent = '';
  const form = new FormData(e.target);
  const email = form.get('email');
  const pin = form.get('pin');

  try {
    const res = await post('/auth/login', { email, pin });
    if (!res.success) throw new Error(res.message);

    state.token = res.data.token;
    state.user = res.data.user;
    localStorage.setItem('mini_erp_token', state.token);
    localStorage.setItem('mini_erp_user', JSON.stringify(state.user));

    showApp();
    renderAllPages();
  } catch (err) {
    loginMsg.textContent = err.message;
  }
}

function onLogout() {
  localStorage.removeItem('mini_erp_token');
  localStorage.removeItem('mini_erp_user');
  state.token = '';
  state.user = null;
  showLogin();
}

function showLogin() {
  loginView.classList.remove('hidden');
  appView.classList.add('hidden');
}

function showApp() {
  loginView.classList.add('hidden');
  appView.classList.remove('hidden');
  welcome.textContent = `Halo, ${state.user?.nama_user || '-'}`;
  roleInfo.textContent = `Role: ${state.user?.role || '-'} | Cabang: ${state.user?.cabang_id || '-'}`;
  heroContext.textContent = `Anda login sebagai ${state.user?.role || '-'} pada cabang ${state.user?.cabang_id || '-'}.`;
}

function switchPage(page) {
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.page === page);
  });
  document.querySelectorAll('.page').forEach((el) => {
    el.classList.add('hidden');
  });
  document.getElementById(`page-${page}`).classList.remove('hidden');
}

async function renderAllPages() {
  await renderDashboard();
  await renderProdukPage();
  renderPosPage();
  renderPembelianPage();
  await renderVoucherPage();
  renderLaporanPage();
}

async function renderDashboard() {
  const target = document.getElementById('page-dashboard');
  const q = new URLSearchParams({ token: state.token, cabang_id: state.user.cabang_id }).toString();
  const res = await get(`/dashboard/summary?${q}`);
  const data = res.data || {};

  target.innerHTML = `
    <h2>Dashboard Ringkas</h2>
    <div class="kpi-grid">
      <div class="kpi-card"><strong>Total transaksi hari ini</strong><div class="value">${data.total_transaksi_hari_ini || 0}</div></div>
      <div class="kpi-card"><strong>Total penjualan hari ini</strong><div class="value">Rp ${formatNum(data.total_penjualan_hari_ini || 0)}</div></div>
      <div class="kpi-card"><strong>Low stock count</strong><div class="value">${data.low_stock_count || 0}</div></div>
      <div class="kpi-card"><strong>Tanggal</strong><div class="value">${data.tanggal || '-'}</div></div>
    </div>
  `;
}

async function renderProdukPage() {
  const target = document.getElementById('page-produk');
  const listRes = await post('/master/list', {
    module: 'produk',
    token: state.token,
    filters: {}
  }, true);
  const products = listRes.data || [];

  target.innerHTML = `
    <h2>Master Produk</h2>
    <div class="card">
      <form id="form-produk" class="grid-2">
        <label>SKU <input name="sku" required /></label>
        <label>Barcode <input name="barcode" /></label>
        <label>Nama Produk <input name="nama_produk" required /></label>
        <label>Kategori <input name="kategori" /></label>
        <label>Satuan <input name="satuan" value="PCS" /></label>
        <label>Harga Beli <input name="harga_beli" type="number" value="0" /></label>
        <label>Harga Jual <input name="harga_jual" type="number" value="0" /></label>
        <label>Stok Minimum <input name="stok_minimum" type="number" value="0" /></label>
        <label>Aktif
          <select name="is_active"><option value="1">Ya</option><option value="0">Tidak</option></select>
        </label>
        <div><button type="submit">Simpan Produk</button></div>
      </form>
      <p id="msg-produk" class="msg"></p>
    </div>
    ${renderTable(products, ['produk_id', 'sku', 'nama_produk', 'harga_jual', 'stok_minimum', 'is_active'])}
  `;

  document.getElementById('form-produk').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const data = Object.fromEntries(f.entries());
    try {
      const res = await post('/master/create', {
        module: 'produk',
        data,
        token: state.token
      });
      document.getElementById('msg-produk').textContent = res.success ? 'Produk tersimpan.' : res.message;
      await renderProdukPage();
    } catch (err) {
      document.getElementById('msg-produk').textContent = err.message;
    }
  });
}

function renderPosPage() {
  const target = document.getElementById('page-pos');
  target.innerHTML = `
    <h2>Transaksi POS</h2>
    <form id="form-pos" class="stack">
      <label>Produk ID <input name="produk_id" required placeholder="PRD-..." /></label>
      <label>Qty <input name="qty" type="number" min="1" value="1" required /></label>
      <label>Voucher (opsional) <input name="kode_voucher" /></label>
      <label>Metode Bayar
        <select name="metode_bayar"><option value="CASH">CASH</option><option value="QRIS">QRIS</option><option value="TRANSFER">TRANSFER</option></select>
      </label>
      <label><input name="kirim_wa" type="checkbox" /> Kirim WhatsApp struk</label>
      <button type="submit">Proses POS</button>
    </form>
    <p id="msg-pos" class="msg"></p>
  `;

  document.getElementById('form-pos').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const payload = {
      token: state.token,
      cabang_id: state.user.cabang_id,
      kode_voucher: f.get('kode_voucher') || '',
      metode_bayar: f.get('metode_bayar'),
      payment_status: 'PENDING',
      kirim_wa: f.get('kirim_wa') === 'on',
      items: [{
        produk_id: f.get('produk_id'),
        qty: Number(f.get('qty')),
        diskon_item: 0
      }],
      payment_gateway_ref: '',
      whatsapp_target: ''
    };
    try {
      const res = await post('/pos/create', payload);
      document.getElementById('msg-pos').textContent = res.success
        ? `Transaksi berhasil: ${res.data.trx.trx_id}`
        : res.message;
      await renderDashboard();
    } catch (err) {
      document.getElementById('msg-pos').textContent = err.message;
    }
  });
}

function renderPembelianPage() {
  const target = document.getElementById('page-pembelian');
  target.innerHTML = `
    <h2>Pembelian</h2>
    <form id="form-beli" class="stack">
      <label>Supplier ID <input name="supplier_id" required /></label>
      <label>Produk ID <input name="produk_id" required /></label>
      <label>Qty <input name="qty" type="number" min="1" value="1" required /></label>
      <label>Harga Beli <input name="harga_beli" type="number" min="0" value="0" required /></label>
      <button type="submit">Simpan Pembelian</button>
    </form>
    <p id="msg-beli" class="msg"></p>
  `;

  document.getElementById('form-beli').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const payload = {
      token: state.token,
      cabang_id: state.user.cabang_id,
      supplier_id: f.get('supplier_id'),
      diskon: 0,
      ongkir: 0,
      items: [{
        produk_id: f.get('produk_id'),
        qty: Number(f.get('qty')),
        harga_beli: Number(f.get('harga_beli'))
      }]
    };
    try {
      const res = await post('/purchase/create', payload);
      document.getElementById('msg-beli').textContent = res.success
        ? `Pembelian tersimpan: ${res.data.pembelian.beli_id}`
        : res.message;
      await renderDashboard();
    } catch (err) {
      document.getElementById('msg-beli').textContent = err.message;
    }
  });
}

async function renderVoucherPage() {
  const target = document.getElementById('page-voucher');
  const listRes = await post('/master/list', { module: 'voucher', token: state.token, filters: {} }, true);
  const vouchers = listRes.data || [];
  target.innerHTML = `
    <h2>Promo Voucher</h2>
    ${renderTable(vouchers, ['voucher_id', 'kode_voucher', 'nama_promo', 'tipe_diskon', 'nilai_diskon', 'kuota', 'status'])}
  `;
}

function renderLaporanPage() {
  const target = document.getElementById('page-laporan');
  target.innerHTML = `
    <h2>Laporan Sederhana</h2>
    <ul>
      <li>Ringkasan harian ada di Dashboard.</li>
      <li>Data detail transaksi/pembelian tersedia di Google Sheets tab POS_Transaksi & Pembelian.</li>
      <li>Mutasi stok tersedia di tab Stok_Mutasi.</li>
      <li>Jurnal otomatis tersedia di tab Jurnal_Umum.</li>
    </ul>
  `;
}

function renderTable(rows, columns) {
  if (!rows.length) return '<p class="muted">Belum ada data.</p>';
  const head = columns.map((c) => `<th>${c}</th>`).join('');
  const body = rows.map((r) => `<tr>${columns.map((c) => `<td>${r[c] ?? ''}</td>`).join('')}</tr>`).join('');
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function resolveRuntimeConfig() {
  const params = new URLSearchParams(window.location.search);
  const queryApiBase = params.get('api_base') || params.get('api') || '';
  const queryClientToken = params.get('client_token') || params.get('token') || '';
  const savedApiBase = localStorage.getItem('mini_erp_api_base') || '';
  const savedClientToken = localStorage.getItem('mini_erp_client_token') || '';

  if (queryApiBase) localStorage.setItem('mini_erp_api_base', queryApiBase);
  if (queryClientToken) localStorage.setItem('mini_erp_client_token', queryClientToken);

  const apiBase = normalizeApiBase(queryApiBase || savedApiBase || `${window.location.origin}/api`);
  const clientToken = (queryClientToken || savedClientToken || '').trim();

  return { apiBase, clientToken };
}

function normalizeApiBase(value) {
  const trimmed = String(value || '').trim().replace(/\/$/, '');
  if (!trimmed) return `${window.location.origin}/api`;
  if (/\/api$/i.test(trimmed)) return trimmed;
  return `${trimmed}/api`;
}

async function get(path) {
  return requestJson(path, {
    method: 'GET'
  });
}

async function post(path, body, silent = false) {
  const data = await requestJson(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (!silent && !data.success) {
    throw new Error(data.message || 'Request gagal');
  }
  return data;
}

async function requestJson(path, options = {}) {
  const headers = {
    ...(options.headers || {})
  };

  if (CLIENT_TOKEN) {
    headers['X-Client-Token'] = CLIENT_TOKEN;
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers
    });
  } catch (_err) {
    throw new Error(`Gagal terhubung ke API (${API_BASE}). Tambahkan ?api_base=<url-worker> dan ?client_token=<token>.`);
  }

  const rawBody = await response.text();
  const hasBody = rawBody.trim().length > 0;
  const contentType = response.headers.get('content-type') || '';
  const looksLikeJson = contentType.includes('application/json') || rawBody.trim().startsWith('{') || rawBody.trim().startsWith('[');

  let parsed = null;
  if (hasBody && looksLikeJson) {
    try {
      parsed = JSON.parse(rawBody);
    } catch (_err) {
      throw new Error(`Respons API tidak valid (status ${response.status}).`);
    }
  }

  if (!response.ok) {
    const serverMessage = parsed?.message || parsed?.error;
    const isSameOriginApi = API_BASE === SAME_ORIGIN_API_BASE;

    if (response.status === 404 && !hasBody && isSameOriginApi) {
      throw new Error('Endpoint API tidak ditemukan di domain ini. Frontend berjalan di static-only worker. Tambahkan ?api_base=<url-api-worker> pada URL.');
    }

    if (serverMessage === 'Worker env belum lengkap') {
      throw new Error('API worker belum dikonfigurasi. Set APPS_SCRIPT_URL dan GATEWAY_SHARED_KEY pada worker API (bukan static worker).');
    }

    if (serverMessage === 'GATEWAY_SHARED_KEY belum diset.') {
      throw new Error('Google Apps Script belum dikonfigurasi. Set Script Properties: GATEWAY_SHARED_KEY agar login bisa diproses.');
    }

    throw new Error(serverMessage || `API error ${response.status}${response.statusText ? ` ${response.statusText}` : ''}`);
  }

  if (parsed !== null) {
    return parsed;
  }

  return {
    success: true,
    data: null,
    message: hasBody ? rawBody : ''
  };
}

function formatNum(v) {
  return Number(v || 0).toLocaleString('id-ID');
}
