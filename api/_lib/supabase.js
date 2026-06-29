const { supabaseUrl, supabaseServiceRoleKey } = require('./config');
const { normalizePhone } = require('./phone');

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

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}


function safeParseGuestNotes(notes) {
  if (!notes) return { text: '', meta: {} };
  if (typeof notes === 'object') return { text: notes.text || '', meta: notes };
  try {
    const parsed = JSON.parse(String(notes));
    if (parsed && typeof parsed === 'object') return { text: parsed.text || parsed.notes || '', meta: parsed };
  } catch (_) {}
  return { text: String(notes || ''), meta: {} };
}
function packGuestNotes(guest = {}, existingNotes = '') {
  const old = safeParseGuestNotes(existingNotes || guest.notes);
  const meta = { ...old.meta };
  const plainText = guest.notesText || guest.plainNotes || (typeof guest.notes === 'string' && !String(guest.notes).trim().startsWith('{') ? guest.notes : old.text || '');
  if (plainText) meta.text = plainText;
  if ('orderNumber' in guest || 'order_number' in guest) meta.orderNumber = Number(guest.orderNumber || guest.order_number || 0) || null;
  if ('entryCardUrl' in guest || 'entry_card_url' in guest) meta.entryCardUrl = guest.entryCardUrl || guest.entry_card_url || null;
  if ('entryCardUrls' in guest || 'entry_card_urls' in guest) meta.entryCardUrls = guest.entryCardUrls || guest.entry_card_urls || [];
  if ('startOrder' in guest || 'start_order' in guest) meta.startOrder = Number(guest.startOrder || guest.start_order || 0) || null;
  return JSON.stringify(meta);
}

function toDbGuestUpdate(update) {
  const out = {};
  if ('cardsCount' in update) out.cards_count = Number(update.cardsCount || 1);
  if ('guestName' in update) out.guest_name = update.guestName;
  if ('phoneNumber' in update) out.phone_number = normalizePhone(update.phoneNumber);
  if ('rsvpStatus' in update) out.rsvp_status = update.rsvpStatus;
  if ('rsvpStatus' in update) out.status = update.rsvpStatus;
  if ('confirmedCount' in update) out.confirmed_count = Number(update.confirmedCount || 0);
  if ('declinedCount' in update) out.declined_count = Number(update.declinedCount || 0);
  if ('pendingCount' in update) out.pending_count = Number(update.pendingCount || 0);
  if ('invitationSentAt' in update) out.invitation_sent_at = update.invitationSentAt;
  if ('deliveredAt' in update) out.delivered_at = update.deliveredAt;
  if ('readAt' in update) out.read_at = update.readAt;
  if ('repliedAt' in update) out.replied_at = update.repliedAt;
  if ('metaMessageId' in update) out.meta_message_id = update.metaMessageId;
  if ('notes' in update || 'orderNumber' in update || 'order_number' in update || 'startOrder' in update || 'start_order' in update || 'entryCardUrl' in update || 'entry_card_url' in update || 'entryCardUrls' in update || 'entry_card_urls' in update) out.notes = packGuestNotes(update, update.notes);
  out.updated_at = new Date().toISOString();
  return out;
}

function toDbGuestInsert(guest = {}, booking = {}) {
  const cardsCount = Number(guest.cardsCount || guest.cards_count || guest.cards || 1);
  const phoneNumber = normalizePhone(guest.phoneNumber || guest.phone_number || guest.phone || guest.mobile);
  const payload = {
    guest_name: guest.guestName || guest.guest_name || guest.name || '-',
    phone_number: phoneNumber,
    cards_count: cardsCount,
    rsvp_status: guest.rsvpStatus || guest.rsvp_status || 'pending',
    confirmed_count: Number(guest.confirmedCount || guest.confirmed_count || 0),
    declined_count: Number(guest.declinedCount || guest.declined_count || 0),
    pending_count: Number(guest.pendingCount || guest.pending_count || cardsCount),
    short_code: guest.shortCode || guest.short_code || null,
    notes: packGuestNotes(guest) || null,
    updated_at: new Date().toISOString()
  };

  // Do not send non-UUID local ids such as ev1/g1 into uuid columns.
  const bookingId = guest.bookingId || guest.booking_id || booking.id || booking.bookingId;
  if (isUuid(bookingId)) payload.booking_id = bookingId;

  return payload;
}

function fromDbGuest(row) {
  if (!row) return null;
  const parsedNotes = safeParseGuestNotes(row.notes);
  return {
    id: row.id,
    bookingId: row.booking_id,
    guestName: row.guest_name || row.name,
    phoneNumber: row.phone_number || row.phone,
    cardsCount: row.cards_count || row.cards || 1,
    rsvpStatus: row.rsvp_status || row.status || 'pending',
    confirmedCount: row.confirmed_count || 0,
    declinedCount: row.declined_count || 0,
    pendingCount: row.pending_count ?? row.cards_count ?? 1,
    metaMessageId: row.meta_message_id,
    invitationSentAt: row.invitation_sent_at,
    deliveredAt: row.delivered_at,
    readAt: row.read_at,
    repliedAt: row.replied_at,
    shortCode: row.short_code,
    notes: parsedNotes.text || '',
    orderNumber: parsedNotes.meta.orderNumber || parsedNotes.meta.order_number || null,
    entryCardUrl: parsedNotes.meta.entryCardUrl || parsedNotes.meta.entry_card_url || null,
    entryCardUrls: parsedNotes.meta.entryCardUrls || parsedNotes.meta.entry_card_urls || [],
    startOrder: parsedNotes.meta.startOrder || parsedNotes.meta.start_order || parsedNotes.meta.orderNumber || null
  };
}

function getSupabaseAdmin() {
  return isConfigured() ? { rest: true } : null;
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

async function getGuestByPhone(phoneNumber) {
  if (!isConfigured() || !phoneNumber) return null;
  const variants = phoneVariants(phoneNumber);
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

async function updateGuest(id, update) {
  if (!isConfigured() || !id) return null;
  if (!isUuid(id)) {
    console.warn('[Supabase] Skipping updateGuest for non-UUID id:', id);
    return null;
  }
  const data = await request(`/guests?id=eq.${eq(id)}&select=*`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(toDbGuestUpdate(update))
  });
  return fromDbGuest(Array.isArray(data) ? data[0] : data);
}

async function updateGuestByPhone(phoneNumber, update) {
  const guest = await getGuestByPhone(phoneNumber);
  if (!guest?.id) return null;
  return updateGuest(guest.id, update);
}


async function deleteGuest(id) {
  if (!isConfigured() || !id) return null;
  if (!isUuid(id)) {
    console.warn('[Supabase] Skipping deleteGuest for non-UUID id:', id);
    return null;
  }
  try {
    await request(`/guests?id=eq.${eq(id)}`, {
      method: 'DELETE',
      headers: { Prefer: 'return=minimal' }
    });
    return { id, deleted: true };
  } catch (error) {
    console.error('[Supabase] deleteGuest failed', error.message || error);
    return null;
  }
}

async function ensureGuestExists(guest = {}, booking = {}) {
  if (!isConfigured()) return null;
  const phoneNumber = normalizePhone(guest.phoneNumber || guest.phone_number || guest.phone || guest.mobile);
  if (!phoneNumber) return null;

  const cardsCount = Number(guest.cardsCount || guest.cards_count || guest.cards || 1);
  const forceNew = Boolean(guest.forceNew || guest.force_new || guest.resetStatus || guest.reset_status);

  // If this is a newly re-added/imported guest, never reuse previous RSVP state.
  // Create a fresh row with pending status.
  if (forceNew) {
    const payload = toDbGuestInsert({
      ...guest,
      id: null,
      dbGuestId: null,
      phoneNumber,
      rsvpStatus: 'pending',
      confirmedCount: 0,
      declinedCount: 0,
      pendingCount: cardsCount,
      metaMessageId: null,
      invitationSentAt: null,
      deliveredAt: null,
      readAt: null,
      repliedAt: null
    }, booking);
    payload.rsvp_status = 'pending';
    payload.status = 'pending';
    payload.confirmed_count = 0;
    payload.declined_count = 0;
    payload.pending_count = cardsCount;
    payload.meta_message_id = null;
    payload.invitation_sent_at = null;
    payload.delivered_at = null;
    payload.read_at = null;
    payload.replied_at = null;
    const data = await request('/guests?select=*', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(payload)
    });
    return fromDbGuest(Array.isArray(data) ? data[0] : data);
  }

  // Do NOT merge guests by phone number.
  // Only update existing row when frontend supplied a real UUID.
  if (isUuid(guest.id)) {
    const updated = await updateGuest(guest.id, {
      cardsCount,
      pendingCount: cardsCount,
      rsvpStatus: guest.rsvpStatus || 'pending',
      guestName: guest.guestName || guest.guest_name || guest.name,
      phoneNumber,
      notes: guest.notes || null
    });
    if (updated) return updated;
  }

  if (isUuid(guest.dbGuestId || guest.db_guest_id)) {
    const updated = await updateGuest(guest.dbGuestId || guest.db_guest_id, {
      cardsCount,
      pendingCount: cardsCount,
      rsvpStatus: guest.rsvpStatus || 'pending',
      guestName: guest.guestName || guest.guest_name || guest.name,
      phoneNumber,
      notes: guest.notes || null
    });
    if (updated) return updated;
  }

  const payload = toDbGuestInsert({ ...guest, phoneNumber, rsvpStatus: guest.rsvpStatus || 'pending' }, booking);
  const data = await request('/guests?select=*', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(payload)
  });
  return fromDbGuest(Array.isArray(data) ? data[0] : data);
}

async function listGuests(limit = 1000) {
  if (!isConfigured()) return [];
  const data = await request(`/guests?select=*&order=updated_at.desc&limit=${Number(limit) || 1000}`);
  return (Array.isArray(data) ? data : []).map(fromDbGuest).filter(Boolean);
}

async function insertMessage(message) {
  if (!isConfigured()) return null;
  const payload = {
    booking_id: isUuid(message.bookingId) ? message.bookingId : null,
    guest_id: isUuid(message.guestId) ? message.guestId : null,
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
  if (!isConfigured() || !isUuid(guest?.id)) return null;
  try {
    return await request('/guest_timeline_events', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        guest_id: guest.id,
        booking_id: isUuid(guest.bookingId) ? guest.bookingId : null,
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
  updateGuestByPhone,
  deleteGuest,
  ensureGuestExists,
  listGuests,
  getGuestByPhone,
  getGuestByMetaMessageId,
  insertMessage,
  logTimeline,
  logWebhookEvent,
  isUuid
};
