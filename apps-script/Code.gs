/**
 * Entry point API Apps Script.
 * Request format:
 * {
 *   "gateway_key": "...",
 *   "action": "auth.login",
 *   "payload": { ... }
 * }
 */
function doGet() {
  return jsonOk_({ service: 'mini-erp-apps-script', status: 'healthy' }, 'Service up');
}

function doPost(e) {
  try {
    const req = parseJsonBody_(e);
    validateGatewayKey_(req.gateway_key);

    const action = req.action;
    const payload = req.payload || {};

    const routes = {
      'auth.login': authLogin_,

      'master.list': masterList_,
      'master.create': masterCreate_,
      'master.update': masterUpdate_,

      'pos.create': posCreateTransaction_,
      'purchase.create': purchaseCreate_,
      'payment.webhook': paymentWebhook_,

      'dashboard.summary': dashboardSummary_,
      'integration.preview': integrationPreview_
    };

    const handler = routes[action];
    if (!handler) {
      return jsonErr_(`Action ${action} tidak dikenal`, 'ERR_ACTION_NOT_FOUND');
    }

    const result = handler(payload);
    return jsonOk_(result);
  } catch (err) {
    return jsonErr_(err.message || 'Unknown error', 'ERR_RUNTIME');
  }
}

function validateGatewayKey_(incomingKey) {
  const expected = PropertiesService.getScriptProperties().getProperty('GATEWAY_SHARED_KEY');
  if (!expected) throw new Error('GATEWAY_SHARED_KEY belum diset.');
  if (String(incomingKey || '') !== String(expected)) {
    throw new Error('Gateway key tidak valid.');
  }
}
