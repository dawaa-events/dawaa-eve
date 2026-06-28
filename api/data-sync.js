const { requireAuth } = require('./_lib/auth');
const { supabaseUrl, supabaseServiceRoleKey } = require('./_lib/config');

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.end(JSON.stringify(data));
}

function isConfigured() {
  return Boolean(supabaseUrl && supabaseServiceRoleKey);
}

function restBase() {
  return `${String(supabaseUrl || '').replace(/\/$/, '')}/rest/v1`;
}

async function request(path, options = {}) {
  if (!isConfigured()) throw new Error('Supabase is not configured');
  const response = await fetch(`${restBase()}${path}`, {
    ...options,
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (_) { data = text; }
  if (!response.ok) {
    const msg = typeof data === 'object' && data ? (data.message || data.error || JSON.stringify(data)) : text;
    throw new Error(`Supabase REST ${response.status}: ${msg}`);
  }
  return data;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function safeJson(v, fallback) {
  if (v == null) return fallback;
  if (typeof v === 'object') return v;
  try { return JSON.parse(v); } catch (_) { return fallback; }
}

async function getState() {
  // Try the generic app_state table first. This lets us sync custom frontend structures
  // without requiring a full schema migration.
  try {
    const rows = await request('/app_state?key=eq.dawaa_state&select=*&limit=1');
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (row) return safeJson(row.value || row.data || row.state, {});
  } catch (error) {
    console.warn('[data-sync] app_state read skipped:', error.message || error);
  }

  // Fallback: try existing tables if they exist.
  const state = {};
  try { state.bookings = await request('/bookings?select=*&order=updated_at.desc&limit=1000'); } catch(e) {}
  try { state.accounts = await request('/accounts?select=*&order=updated_at.desc&limit=1000'); } catch(e) {}
  try { state.messages = await request('/messages?select=*&order=created_at.desc&limit=1000'); } catch(e) {}
  return state;
}

async function saveState(incoming = {}) {
  const payload = {
    bookings: Array.isArray(incoming.bookings) ? incoming.bookings : undefined,
    accounts: Array.isArray(incoming.accounts) ? incoming.accounts : undefined,
    messages: Array.isArray(incoming.messages) ? incoming.messages : undefined,
    bookingSettings: incoming.bookingSettings || undefined,
    entryCards: incoming.entryCards || undefined,
    updatedAt: new Date().toISOString()
  };
  Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

  // Prefer upsert into app_state. If table doesn't exist, return a clear message but don't crash.
  try {
    const rows = await request('/app_state?key=eq.dawaa_state&select=*&limit=1');
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (row) {
      await request('/app_state?key=eq.dawaa_state', {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ value: payload, updated_at: payload.updatedAt })
      });
    } else {
      await request('/app_state', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ key: 'dawaa_state', value: payload, updated_at: payload.updatedAt })
      });
    }
    return payload;
  } catch (error) {
    console.warn('[data-sync] app_state save failed:', error.message || error);
    throw new Error('app_state table missing. Create app_state table to sync bookings/accounts/messages.');
  }
}

module.exports = async function handler(req, res) {
  if (!requireAuth(req, res, 'admin')) return;
  try {
    if (req.method === 'GET') {
      const state = await getState();
      return json(res, 200, { success: true, state });
    }

    if (req.method === 'POST') {
      const body = await readBody(req);
      const saved = await saveState(body.state || body || {});
      return json(res, 200, { success: true, state: saved });
    }

    return json(res, 405, { success: false, message: 'Method not allowed' });
  } catch (error) {
    console.error('[data-sync] Error', error);
    return json(res, 500, { success: false, message: String(error.message || error) });
  }
};
