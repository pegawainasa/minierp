/**
 * Cloudflare Worker sebagai API gateway ke Apps Script.
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Token'
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const isApiRequest = url.pathname.startsWith('/api/');

    if (request.method === 'OPTIONS' && isApiRequest) {
      return new Response('ok', { headers: corsHeaders });
    }

    try {
      if (!isApiRequest) {
        return jsonResponse({ success: false, message: 'Route tidak ditemukan' }, 404);
      }

      if (!env.APPS_SCRIPT_URL || !env.GATEWAY_SHARED_KEY) {
        return jsonResponse({ success: false, message: 'Worker env belum lengkap' }, 500);
      }

      const routeKey = `${request.method.toUpperCase()} ${url.pathname}`;
      const route = routeMap[routeKey];
      if (!route) {
        return jsonResponse({ success: false, message: `Route ${routeKey} tidak ditemukan` }, 404);
      }

      const requiresClientToken = route.requiresClientToken !== false;
      if (requiresClientToken && env.CLIENT_API_TOKEN) {
        const token = request.headers.get('X-Client-Token') || '';
        if (token !== env.CLIENT_API_TOKEN) {
          return jsonResponse({ success: false, message: 'Unauthorized client token' }, 401);
        }
      }

      const body = request.method === 'GET' ? {} : await request.json().catch(() => ({}));
      const payload = route.payloadBuilder ? route.payloadBuilder(body, url, request, env) : body;

      const upstreamBody = {
        gateway_key: env.GATEWAY_SHARED_KEY,
        action: route.action,
        payload
      };

      const upstreamResp = await fetch(env.APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(upstreamBody)
      });

      const text = await upstreamResp.text();
      return new Response(text, {
        status: upstreamResp.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (err) {
      return jsonResponse({ success: false, message: err.message || 'Gateway error' }, 500);
    }
  }
};

const routeMap = {
  'POST /api/auth/login': { action: 'auth.login' },

  'POST /api/master/list': { action: 'master.list' },
  'POST /api/master/create': { action: 'master.create' },
  'POST /api/master/update': { action: 'master.update' },

  'POST /api/pos/create': { action: 'pos.create' },
  'POST /api/purchase/create': { action: 'purchase.create' },
  'POST /api/payment/webhook': {
    action: 'payment.webhook',
    requiresClientToken: false,
    payloadBuilder: (body, _url, _request, env) => ({
      ...body,
      webhook_secret: env.PAYMENT_WEBHOOK_SECRET || ''
    })
  },

  'GET /api/dashboard/summary': {
    action: 'dashboard.summary',
    payloadBuilder: (_body, url) => ({
      token: url.searchParams.get('token') || '',
      cabang_id: url.searchParams.get('cabang_id') || '',
      date_from: url.searchParams.get('date_from') || '',
      date_to: url.searchParams.get('date_to') || ''
    })
  },

  'POST /api/integration/preview': { action: 'integration.preview' }
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
