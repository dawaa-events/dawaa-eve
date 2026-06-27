const { supabaseUrl, supabaseServiceRoleKey } = require('./config');

function isConfigured() {
  return Boolean(supabaseUrl && supabaseServiceRoleKey);
}

function restBase() {
  return `${String(supabaseUrl).replace(/\/$/, '')}/rest/v1`;
}

function headers(extra = {}) {
  return {
    apikey: supabaseServiceRoleKey,
    Authorization: `Bearer ${supabaseServiceRoleKey}`,
    'Content-Type': 'application/json',
    ...extra
  };
}

async function request(path, options = {}) {
  if (!isConfigured()) return null;
  const response = await fetch(`${restBase()}${path}`, {
    ...options,
    headers: headers(options.headers || {})
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

function eq(value) {
  return encodeURIComponent(String(value));
}

function toDbGuestUpdate(update) {
  const out = {};
  if ('rsvpStatus' in update) out.rsvp_status = update.rsvpStatus;
  if ('confirmedCount' in update) out.confirmed_count = update.confirmedCount;
  if ('declinedCount' in update) out.declined_count = update.declinedCount;
  if ('pendingCount' in update) out.pending_count = update.pendingCount;
  if ('invitationSentAt' in update) out.invitation_sent_at = update.invitationSentAt;
  if ('deliveredAt' in update) out.delivered_at = update.deliveredAt;
  if ('readAt' in update) out.read_at = update.readAt;
  if ('repliedAt' in update) out.replied_at = update.repliedAt;
  if ('metaMessageId' in update) out.meta_message_id = update.metaMessageId;
  if ('notes' in update) out.notes = update.notes;
  out.updated_at = new Date().toISOString();
  return out;
}

function fromDbGuest(row) {
  if (!row) return null;
  return {
    id: row.id,
    bookingId: row.booking_id,
    guestName: row.guest_name || row.name,
    phoneNumber: row.phone_number || row.phone,
    cardsCount: row.cards_count || row.cards || 1,
    rsvpStatus: row.rsvp_status || 'pending',
    confirmedCount: row.confirmed_count || 0,
    declinedCount: row.declined_count || 0,
    pendingCount: row.pending_count || row.cards_count || 1,
    metaMessageId: row.meta_message_id,
    invitationSentAt: row.invitation_sent_at,
    deliveredAt: row.delivered_at,
    readAt: row.read_at,
    repliedAt: row.replied_at,
    shortCode: row.short_code
  };
}

function getSupabaseAdmin() {
  // Compatibility placeholder: this project uses Supabase REST directly to avoid npm install on Vercel.
  return isConfigured() ? { rest: true } : null;
}

async function updateGuest(id, update) {
  if (!isConfigured() || !id) return null;
  const data = await request(`/guests?id=eq.${eq(id)}&select=*`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(toDbGuestUpdate(update))
  });
  return fromDbGuest(Array.isArray(data) ? data[0] : data);
}

function phoneVariants(phoneNumber) {
  const raw = String(phoneNumber || '').trim();
  const digits = raw.replace(/\D/g, '');
  const variants = new Set([raw, digits]);
  if (digits.startsWith('00')) variants.add(digits.slice(2));
  if (digits.startsWith('968') && digits.length > 8) variants.add(digits.slice(3));
  if (digits.length === 8) variants.add(`968${digits}`);
  variants.delete('');
  return [...variants];
}

async function getGuestByPhone(phoneNumber) {
  if (!isConfigured() || !phoneNumber) return null;
  const variants = phoneVariants(phoneNumber);

  // Try exact lookup across the common phone column names and formats.
  // Prefer pending/sent/delivered/read guests so old events do not catch a new RSVP.
  const orParts = [];
  for (const v of variants) {
    orParts.push(`phone_number.eq.${eq(v)}`);
    orParts.push(`phone.eq.${eq(v)}`);
  }

  const path = `/guests?or=(${orParts.join(',')})&select=*&order=created_at.desc&limit=20`;
  const data = await request(path);
  const rows = Array.isArray(data) ? data : (data ? [data] : []);
  const preferred = rows.find(row => ['pending', 'sent', 'delivered', 'read'].includes(row.rsvp_status || row.status));
  return fromDbGuest(preferred || rows[0]);
}

async function getGuestByMetaMessageId(messageId) {
  if (!isConfigured() || !messageId) return null;
  const data = await request(`/guests?meta_message_id=eq.${eq(messageId)}&select=*&limit=1`);
  return fromDbGuest(Array.isArray(data) ? data[0] : data);
}

async function insertMessage(message) {
  if (!isConfigured()) return null;
  const payload = {
    booking_id: message.bookingId || null,
    guest_id: message.guestId || null,
    phone_number: message.phoneNumber || null,
    direction: message.direction || 'system',
    message_type: message.messageType || 'text',
    message_body: message.messageBody || '',
    meta_message_id: message.metaMessageId || null,
    status: message.status || 'sent'
  };
  try {
    return await request('/messages', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error('[Supabase] insertMessage failed', error.message || error);
    return null;
  }
}

async function logTimeline(guest, eventType, eventData = {}, source = 'meta') {
  if (!isConfigured() || !guest?.id) return null;
  try {
    return await request('/guest_timeline_events', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        guest_id: guest.id,
        booking_id: guest.bookingId || null,
        event_type: eventType,
        event_data: eventData,
        source,
        occurred_at: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('[Supabase] logTimeline failed', error.message || error);
    return null;
  }
}

async function logWebhookEvent(eventType, payload) {
  console.log(`[WebhookLog] ${eventType}`, JSON.stringify(payload).slice(0, 1000));
  if (!isConfigured()) return null;
  try {
    return await request('/webhook_events', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ event_type: eventType, payload })
    });
  } catch (error) {
    console.error('[Supabase] logWebhookEvent failed', error.message || error);
    return null;
  }
}

module.exports = {
  getSupabaseAdmin,
  updateGuest,
  getGuestByPhone,
  getGuestByMetaMessageId,
  insertMessage,
  logTimeline,
  logWebhookEvent
};
