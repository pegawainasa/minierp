/**
 * Placeholder integrasi payment/WhatsApp.
 * Untuk MVP: simpan metadata integrasi di catatan atau payload response.
 */
function integrationPreview_(payload) {
  const user = getSessionUser_(payload);
  requireRole_(user, [ROLE.ADMIN, ROLE.OWNER]);

  return {
    payment_gateway_flow: {
      step_1: 'Frontend kirim create transaksi ke Worker.',
      step_2: 'Worker terima payment_method + metadata, forward ke Apps Script.',
      step_3: 'Apps Script simpan payment_status=PENDING + ref eksternal bila ada.',
      step_4: 'Webhook payment gateway (opsional) update payment_status=PAID/FAILED.'
    },
    whatsapp_gateway_flow: {
      step_1: 'Set kirim_wa=1 saat transaksi POS.',
      step_2: 'Apps Script menyiapkan payload notifikasi (nomor, template, isi).',
      step_3: 'Cloudflare Worker (atau service lain) kirim ke WhatsApp API provider.',
      step_4: 'Simpan status kirim di sistem log eksternal atau sheet tambahan.'
    }
  };
}

function paymentWebhook_(payload) {
  validatePaymentWebhookSecret_(payload.webhook_secret);

  const trxId = String(
    payload.trx_id ||
    payload.ref_no ||
    payload.order_id ||
    payload.reference ||
    ''
  ).trim();
  if (!trxId) throw new Error('trx_id/ref_no webhook wajib diisi.');

  const incomingStatus = String(
    payload.payment_status ||
    payload.transaction_status ||
    payload.status ||
    ''
  ).trim();
  if (!incomingStatus) throw new Error('Status pembayaran webhook wajib diisi.');

  const trxBefore = findById_('POS_Transaksi', 'trx_id', trxId);
  if (!trxBefore) throw new Error(`Transaksi ${trxId} tidak ditemukan.`);

  const oldStatus = normalizePaymentStatus_(trxBefore.payment_status);
  const newStatus = normalizePaymentStatus_(incomingStatus);

  const updateResult = updateTransactionPaymentStatus_(trxId, newStatus, {
    gateway_ref: payload.gateway_ref || payload.transaction_id || payload.payment_id || '',
    webhook_payload: payload
  });

  let journalCreated = false;
  if (!isPaymentSettledStatus_(oldStatus) && isPaymentSettledStatus_(newStatus)) {
    if (!hasJournalEntryForRef_(trxId)) {
      createJournalForSale_(updateResult.trx_after);
      journalCreated = true;
    }
  }

  let waReceipt = null;
  if (isPaymentSettledStatus_(newStatus) && String(updateResult.trx_after.kirim_wa) === '1') {
    waReceipt = trySendWhatsAppReceiptForTransaction_(trxId, payload.whatsapp_target || '');
  }

  return {
    trx_id: trxId,
    payment_status_before: oldStatus,
    payment_status_after: newStatus,
    status_changed: oldStatus !== newStatus,
    journal_created: journalCreated,
    wa_receipt: waReceipt
  };
}

function normalizePaymentStatus_(status) {
  const raw = String(status || '').trim().toUpperCase();
  const map = {
    PAID: 'LUNAS',
    SETTLEMENT: 'LUNAS',
    SUCCESS: 'LUNAS',
    CAPTURE: 'LUNAS',
    LUNAS: 'LUNAS',
    PENDING: 'PENDING',
    WAITING: 'PENDING',
    UNPAID: 'PENDING',
    EXPIRE: 'GAGAL',
    EXPIRED: 'GAGAL',
    FAILED: 'GAGAL',
    FAILURE: 'GAGAL',
    DENY: 'GAGAL',
    CANCELED: 'GAGAL',
    CANCELLED: 'GAGAL',
    REFUND: 'REFUND'
  };
  return map[raw] || raw || 'PENDING';
}

function isPaymentSettledStatus_(status) {
  return normalizePaymentStatus_(status) === 'LUNAS';
}

function validatePaymentWebhookSecret_(incomingSecret) {
  const requiredSecret = PropertiesService.getScriptProperties().getProperty('PAYMENT_WEBHOOK_SECRET');
  if (!requiredSecret) {
    return;
  }

  const provided = String(incomingSecret || '').trim();
  if (!provided || provided !== String(requiredSecret)) {
    throw new Error('Webhook secret tidak valid.');
  }
}

function updateTransactionPaymentStatus_(trxId, normalizedStatus, extraMeta) {
  const trxBefore = findById_('POS_Transaksi', 'trx_id', trxId);
  if (!trxBefore) throw new Error(`Transaksi ${trxId} tidak ditemukan.`);

  const oldNotes = String(trxBefore.catatan || '');
  const gatewayRef = String((extraMeta && extraMeta.gateway_ref) || '').trim();
  const newNoteParts = [];

  if (gatewayRef) {
    newNoteParts.push(`gateway_ref=${gatewayRef}`);
  }

  if (extraMeta && extraMeta.webhook_payload) {
    const serialized = JSON.stringify(extraMeta.webhook_payload);
    newNoteParts.push(`webhook=${serialized.substring(0, 500)}`);
  }

  const noteSuffix = newNoteParts.length
    ? `${nowIso_()} [payment_update] ${newNoteParts.join(' | ')}`
    : `${nowIso_()} [payment_update] status=${normalizedStatus}`;

  const statusTrx = isPaymentSettledStatus_(normalizedStatus)
    ? 'SELESAI'
    : (normalizedStatus === 'PENDING' ? 'MENUNGGU_PEMBAYARAN' : 'GAGAL');

  const mergedNote = oldNotes ? `${oldNotes}\n${noteSuffix}` : noteSuffix;

  const updated = updateSheetData_('POS_Transaksi', 'trx_id', trxId, {
    payment_status: normalizedStatus,
    status_trx: statusTrx,
    catatan: mergedNote
  });

  return {
    trx_before: trxBefore,
    trx_after: updated
  };
}

function trySendWhatsAppReceiptForTransaction_(trxId, targetOverride) {
  try {
    return sendWhatsAppReceiptForTransaction_(trxId, targetOverride);
  } catch (err) {
    return {
      sent: false,
      channel: 'WHATSAPP',
      reason: `Gagal kirim WA: ${err.message || 'unknown'}`
    };
  }
}

function hasJournalEntryForRef_(refNo) {
  const rows = readRows_('Jurnal_Umum');
  return rows.some((j) => String(j.ref_no) === String(refNo));
}

function sendWhatsAppReceiptForTransaction_(trxId, targetOverride) {
  const trx = findById_('POS_Transaksi', 'trx_id', trxId);
  if (!trx) throw new Error(`Transaksi ${trxId} tidak ditemukan untuk kirim WA.`);

  const details = readRows_('POS_Detail').filter((d) => String(d.trx_id) === String(trxId));
  const pelanggan = trx.pelanggan_id
    ? findById_('Pelanggan', 'pelanggan_id', trx.pelanggan_id)
    : null;

  const waPayload = buildWhatsAppReceiptPayload_(trx, details, pelanggan, targetOverride);
  if (!waPayload.to) {
    return {
      sent: false,
      channel: 'WHATSAPP',
      reason: 'Nomor WhatsApp pelanggan tidak tersedia.'
    };
  }

  const waApiUrl = PropertiesService.getScriptProperties().getProperty('WHATSAPP_API_URL');
  const waApiToken = PropertiesService.getScriptProperties().getProperty('WHATSAPP_API_TOKEN') || '';

  if (!waApiUrl) {
    return {
      sent: false,
      channel: 'WHATSAPP',
      mode: 'preview',
      reason: 'WHATSAPP_API_URL belum diset. Pesan disiapkan sebagai preview.',
      payload: waPayload
    };
  }

  const headers = { 'Content-Type': 'application/json' };
  if (waApiToken) {
    headers.Authorization = `Bearer ${waApiToken}`;
  }

  const response = UrlFetchApp.fetch(waApiUrl, {
    method: 'post',
    contentType: 'application/json',
    headers: headers,
    payload: JSON.stringify(waPayload),
    muteHttpExceptions: true
  });

  const code = response.getResponseCode();
  const bodyText = response.getContentText();
  const isSuccess = code >= 200 && code < 300;

  return {
    sent: isSuccess,
    channel: 'WHATSAPP',
    http_status: code,
    response_body: bodyText,
    target: waPayload.to
  };
}

function buildWhatsAppReceiptPayload_(trx, details, pelanggan, targetOverride) {
  const target = normalizePhoneNumber_(targetOverride || (pelanggan && pelanggan.no_wa) || '');

  const itemLines = details.map((d) => {
    const produk = findById_('Produk', 'produk_id', d.produk_id);
    const namaProduk = produk ? produk.nama_produk : d.produk_id;
    return `- ${namaProduk} x${toNum_(d.qty)} = Rp${toNum_(d.subtotal_item).toLocaleString('id-ID')}`;
  });

  const message = [
    'Terima kasih sudah berbelanja 🙏',
    `No. Transaksi: ${trx.trx_id}`,
    `Tanggal: ${trx.tanggal}`,
    'Item:',
    itemLines.join('\n') || '-',
    `Subtotal: Rp${toNum_(trx.subtotal).toLocaleString('id-ID')}`,
    `Diskon: Rp${toNum_(trx.diskon).toLocaleString('id-ID')}`,
    `PPN: Rp${toNum_(trx.ppn).toLocaleString('id-ID')}`,
    `Total Bayar: Rp${toNum_(trx.grand_total).toLocaleString('id-ID')}`,
    `Status: ${normalizePaymentStatus_(trx.payment_status)}`
  ].join('\n');

  return {
    to: target,
    type: 'text',
    message: message,
    ref_no: trx.trx_id
  };
}

function normalizePhoneNumber_(phone) {
  const raw = String(phone || '').replace(/[^\d+]/g, '');
  if (!raw) return '';

  if (raw.indexOf('+62') === 0) {
    return `62${raw.slice(3)}`;
  }

  if (raw.indexOf('62') === 0) {
    return raw;
  }

  if (raw.indexOf('0') === 0) {
    return `62${raw.slice(1)}`;
  }

  return raw;
}
