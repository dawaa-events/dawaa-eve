const { supabaseUrl, supabaseServiceRoleKey } = require('./_lib/config');
const { normalizePhone } = require('./_lib/phone');

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function isConfigured() {
  return Boolean(supabaseUrl && supabaseServiceRoleKey);
}

function isUuid(v) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v || ''));
}

function eq(v) {
  return encodeURIComponent(String(v ?? ''));
}

async function request(path, options = {}) {
  if (!isConfigured()) throw new Error('Supabase is not configured');
  const url = `${supabaseUrl.replace(/\/$/, '')}/rest/v1${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Supabase ${response.status}: ${text}`);
  if (!text) return null;
  try { return JSON.parse(text); } catch (_) { return text; }
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

function normalizeGuestName(value='') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[ً-ٰٟ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ');
}

function phoneVariants(phoneNumber) {
  const raw = String(phoneNumber || '').trim();
  const digits = normalizePhone(raw);
  const variants = new Set([raw, digits]);
  if (digits.startsWith('00')) variants.add(digits.slice(2));
  if (digits.startsWith('968') && digits.length > 8) variants.add(digits.slice(3));
  if (digits.length === 8) variants.add(`968${digits}`);
  variants.delete('');
  return [...variants];
}

function safeParseNotes(notes) {
  if (!notes) return {};
  if (typeof notes === 'object') return notes;
  try { return JSON.parse(notes); } catch (_) { return {}; }
}

function fromDbGuest(row) {
  const meta = safeParseNotes(row.notes);
  return {
    id: `remote_${row.id}`,
    dbGuestId: row.id,
    bookingId: row.booking_id || '',
    guestName: row.guest_name || row.name || '-',
    phoneNumber: row.phone_number || row.phone || '',
    cardsCount: row.cards_count || row.cards || 1,
    rsvpStatus: row.rsvp_status || row.status || 'pending',
    confirmedCount: row.confirmed_count || 0,
    declinedCount: row.declined_count || 0,
    pendingCount: row.pending_count ?? row.cards_count ?? 1,
    invitationSentAt: row.invitation_sent_at || null,
    deliveredAt: row.delivered_at || null,
    readAt: row.read_at || null,
    repliedAt: row.replied_at || null,
    metaMessageId: row.meta_message_id || null,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
    orderNumber: meta.orderNumber || meta.order_number || null,
    startOrder: meta.startOrder || meta.start_order || meta.orderNumber || null,
    entryCardUrl: meta.entryCardUrl || meta.entry_card_url || '',
    entryCardUrls: meta.entryCardUrls || meta.entry_card_urls || [],
    notes: typeof row.notes === 'string' ? row.notes : ''
  };
}

async function listRows(bookingId = '') {
  const path = isUuid(bookingId)
    ? `/guests?booking_id=eq.${eq(bookingId)}&select=*&order=created_at.asc&limit=5000`
    : `/guests?select=*&order=created_at.asc&limit=5000`;
  const data = await request(path);
  return Array.isArray(data) ? data : [];
}

function rowOrder(row) {
  const meta = safeParseNotes(row.notes);
  return Number(meta.startOrder || meta.start_order || meta.orderNumber || meta.order_number || 0) || 0;
}

function identityKey(row) {
  const booking = row.booking_id || '';
  const phone = normalizePhone(row.phone_number || row.phone || '');
  const name = normalizeGuestName(row.guest_name || row.name || '');
  const order = rowOrder(row);
  const cards = Number(row.cards_count || row.cards || 1) || 1;

  if (booking && order) return `booking-order|${booking}|${order}`;
  if (booking && phone && name) return `booking-phone-name|${booking}|${phone}|${name}`;
  if (booking && name) return `booking-name-cards|${booking}|${name}|${cards}`;
  return `fallback|${booking}|${phone}|${name}|${cards}`;
}

function rowScore(r) {
  return (rowOrder(r) ? 200 : 0) +
    (r.phone_number || r.phone ? 100 : 0) +
    (r.meta_message_id ? 80 : 0) +
    (['confirmed','declined','sent','delivered','read'].includes(r.rsvp_status || r.status) ? 50 : 0) +
    Number(r.confirmed_count || 0);
}

function dedupeView(rows) {
  const map = new Map();
  for (const row of rows) {
    const key = identityKey(row);
    const old = map.get(key);
    if (!old || rowScore(row) > rowScore(old)) map.set(key, row);
  }

  const byName = new Map();
  for (const row of map.values()) {
    const booking = row.booking_id || '';
    const name = normalizeGuestName(row.guest_name || row.name || '');
    const key = booking && name ? `booking-name|${booking}|${name}` : `unique|${row.id}`;
    const old = byName.get(key);
    if (!old || rowScore(row) > rowScore(old)) byName.set(key, row);
  }

  return [...byName.values()].sort((a,b)=>{
    const ao=rowOrder(a), bo=rowOrder(b);
    if(ao && bo) return ao-bo;
    if(ao) return -1;
    if(bo) return 1;
    return String(a.guest_name||a.name||'').localeCompare(String(b.guest_name||b.name||''),'ar');
  });
}

async function dedupeRows(bookingId = '') {
  const rows = await listRows(bookingId);
  const groups = new Map();
  for (const row of rows) {
    const key = identityKey(row);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  const removedIds = [];
  for (const group of groups.values()) {
    if (group.length <= 1) continue;
    group.sort((a,b) => String(a.created_at || '').localeCompare(String(b.created_at || '')));
    for (const row of group.slice(1)) {
      await request(`/guests?id=eq.${eq(row.id)}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
      removedIds.push(row.id);
    }
  }
  return { removed: removedIds.length, removedIds };
}

async function deleteGuestEverywhere(guest = {}, booking = {}) {
  const bookingId = guest.bookingId || guest.booking_id || booking.id || booking.bookingId || '';
  const phone = normalizePhone(guest.phoneNumber || guest.phone_number || guest.phone || '');
  const nameKey = normalizeGuestName(guest.guestName || guest.guest_name || guest.name || '');
  const rows = await listRows(bookingId);
  const deletedIds = [];

  for (const row of rows) {
    const rowPhone = normalizePhone(row.phone_number || row.phone || '');
    const rowName = normalizeGuestName(row.guest_name || row.name || '');
    const sameId = guest.dbGuestId && row.id === guest.dbGuestId;
    const sameIdentity = (!phone || rowPhone === phone) && (!nameKey || rowName === nameKey);
    if (sameId || sameIdentity) {
      await request(`/guests?id=eq.${eq(row.id)}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
      deletedIds.push(row.id);
    }
  }
  return { deleted: deletedIds.length > 0, deletedIds };
}

async function deleteAllBooking(bookingId) {
  if (!isUuid(bookingId)) return { deleted: false, reason: 'missing_booking_uuid', deletedIds: [] };
  const rows = await listRows(bookingId);
  const deletedIds = [];
  for (const row of rows) {
    await request(`/guests?id=eq.${eq(row.id)}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
    deletedIds.push(row.id);
  }
  return { deleted: deletedIds.length > 0, deletedIds };
}

module.exports = async function handler(req, res) {
  try {
    if (!isConfigured()) return json(res, 200, { success: true, guests: [] });

    if (req.method === 'GET') {
      const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
      const bookingId = url.searchParams.get('bookingId') || '';
      const action = url.searchParams.get('action') || '';
      let result = null;
      if (action === 'dedupe') result = await dedupeRows(bookingId);
      const rows = dedupeView(await listRows(bookingId));
      return json(res, 200, { success: true, action, result, guests: rows.map(fromDbGuest) });
    }

    if (req.method === 'DELETE') {
      const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
      const action = url.searchParams.get('action') || '';
      const bookingId = url.searchParams.get('bookingId') || '';
      const body = await readBody(req).catch(() => ({}));
      if (action === 'delete_all_booking') {
        const result = await deleteAllBooking(bookingId || body.bookingId || body.booking?.id || '');
        return json(res, 200, { success: true, ...result });
      }
      const result = await deleteGuestEverywhere(body.guest || {}, body.booking || {});
      return json(res, 200, { success: true, ...result });
    }

    return json(res, 405, { success: false, message: 'Method not allowed' });
  } catch (error) {
    console.error('[guests-sync safe]', error);
    return json(res, 500, { success: false, message: error.message || String(error) });
  }
};
