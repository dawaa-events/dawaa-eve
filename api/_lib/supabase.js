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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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



function normalizeIdentityName(value='') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[ً-ٰٟ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ');
}



async function forceDeleteGuestsByIdentity(guest = {}, booking = {}) {
  return deleteGuestEverywhere(guest, booking);
}

async function deleteGuestsByIdentity(guest = {}, booking = {}) {
  return deleteGuestEverywhere(guest, booking);
}

async function deleteGuestsByIdentity(guest = {}, booking = {}) {
  return deleteGuestEverywhere(guest, booking);
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
  // Hard-delete the old same booking+name+phone row first, then insert a clean pending row.
  if (forceNew) {
    await forceDeleteGuestsByIdentity({ ...guest, phoneNumber }, booking);

    const payload = toDbGuestInsert({
      ...guest,
      id: null,
      dbGuestId: null,
      db_guest_id: null,
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
    payload.updated_at = new Date().toISOString();

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

async function listGuests(limit = 1000, bookingId = '') {
  if (!isConfigured()) return [];
  const rows = await listGuestsRaw(limit, bookingId);
  const seen = new Map();

  for (const row of rows) {
    const key = guestIdentityKey(row);
    if (!key) continue;
    const old = seen.get(key);
    if (!old) {
      seen.set(key, row);
      continue;
    }

    const oldScore = (old.meta_message_id ? 100 : 0) + (['confirmed','declined','sent','delivered','read'].includes(old.rsvp_status || old.status) ? 50 : 0) + Number(old.confirmed_count || 0);
    const rowScore = (row.meta_message_id ? 100 : 0) + (['confirmed','declined','sent','delivered','read'].includes(row.rsvp_status || row.status) ? 50 : 0) + Number(row.confirmed_count || 0);
    if (rowScore > oldScore) seen.set(key, row);
  }

  return [...seen.values()].map(fromDbGuest).filter(Boolean);
}


function normalizeGuestNameForKey(value='') {
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

function guestIdentityKey(rowOrGuest = {}) {
  const phone = normalizePhone(rowOrGuest.phone_number || rowOrGuest.phoneNumber || rowOrGuest.phone || rowOrGuest.mobile || '');
  const name = normalizeGuestNameForKey(rowOrGuest.guest_name || rowOrGuest.guestName || rowOrGuest.name || '');
  const booking = rowOrGuest.booking_id || rowOrGuest.bookingId || '';
  // Main dedupe identity: booking + phone + normalized name.
  // This prevents two display orders, alphabetical/order-number duplicates, from becoming two guests.
  return `${booking}|${phone}|${name}`;
}

async function listGuestsRaw(limit = 5000, bookingId = '') {
  if (!isConfigured()) return [];
  const safeLimit = Number(limit) || 5000;
  const path = isUuid(bookingId)
    ? `/guests?booking_id=eq.${eq(bookingId)}&select=*&order=created_at.asc&limit=${safeLimit}`
    : `/guests?select=*&order=created_at.asc&limit=${safeLimit}`;
  const data = await request(path);
  return Array.isArray(data) ? data : [];
}

async function deleteGuestEverywhere(guest = {}, booking = {}) {
  if (!isConfigured()) return { deleted: false, deletedIds: [], reason: 'not_configured' };

  const bookingId = guest.bookingId || guest.booking_id || booking.id || booking.bookingId || '';
  const phone = normalizePhone(guest.phoneNumber || guest.phone_number || guest.phone || guest.mobile || '');
  const nameKey = normalizeGuestNameForKey(guest.guestName || guest.guest_name || guest.name || '');
  const directIds = [guest.dbGuestId, guest.db_guest_id, guest.id].filter(isUuid);
  const deletedIds = [];
  const errors = [];

  async function deleteById(id) {
    if (!isUuid(id) || deletedIds.includes(id)) return;
    try {
      await request(`/guests?id=eq.${eq(id)}`, {
        method: 'DELETE',
        headers: { Prefer: 'return=minimal' }
      });
      deletedIds.push(id);
    } catch (error) {
      errors.push(error.message || String(error));
    }
  }

  for (const id of directIds) await deleteById(id);

  // Find all likely duplicates, including rows created once by order and once alphabetically.
  try {
    const rawRows = isUuid(bookingId) ? await listGuestsRaw(5000, bookingId) : await listGuestsRaw(5000);
    for (const row of rawRows) {
      const rowPhone = normalizePhone(row.phone_number || row.phone || '');
      const rowNameKey = normalizeGuestNameForKey(row.guest_name || row.name || '');
      const sameBooking = !isUuid(bookingId) || row.booking_id === bookingId;
      const samePhone = phone && rowPhone === phone;
      const sameName = nameKey && rowNameKey === nameKey;
      if (sameBooking && ((samePhone && sameName) || (samePhone && !nameKey) || (!phone && sameName))) {
        await deleteById(row.id);
      }
    }
  } catch (error) {
    errors.push(error.message || String(error));
  }

  return { deleted: deletedIds.length > 0, deletedIds, errors };
}

async function deleteGuestsByBooking(bookingId) {
  if (!isConfigured() || !isUuid(bookingId)) return { deleted: false, deletedIds: [], reason: 'missing_booking_uuid' };
  const rows = await listGuestsRaw(5000, bookingId);
  const deletedIds = [];
  const errors = [];

  for (const row of rows) {
    try {
      await request(`/guests?id=eq.${eq(row.id)}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
      deletedIds.push(row.id);
    } catch (error) {
      errors.push(error.message || String(error));
    }
  }

  return { deleted: deletedIds.length > 0, deletedIds, errors, count: deletedIds.length };
}

async function dedupeGuestsByBooking(bookingId = '') {
  if (!isConfigured()) return { deduped: false, removed: 0, kept: 0, reason: 'not_configured' };
  const rows = await listGuestsRaw(5000, bookingId);
  const groups = new Map();

  for (const row of rows) {
    const key = guestIdentityKey(row);
    if (!key || key.split('|').filter(Boolean).length < 2) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  const removedIds = [];
  const keptIds = [];
  const errors = [];

  for (const [key, group] of groups.entries()) {
    if (group.length <= 1) {
      if (group[0]?.id) keptIds.push(group[0].id);
      continue;
    }

    // Keep the oldest real row, but prefer row that has status/confirmed counts/message id.
    group.sort((a, b) => {
      const score = (r) =>
        (r.meta_message_id ? 100 : 0) +
        (['confirmed','declined','sent','delivered','read'].includes(r.rsvp_status || r.status) ? 50 : 0) +
        (Number(r.confirmed_count || 0) * 10);
      const diff = score(b) - score(a);
      if (diff) return diff;
      return String(a.created_at || '').localeCompare(String(b.created_at || ''));
    });

    const keep = group[0];
    keptIds.push(keep.id);

    // Merge useful values into kept record before deleting duplicates.
    const merged = {};
    for (const row of group.slice(1)) {
      if (!keep.meta_message_id && row.meta_message_id) merged.metaMessageId = row.meta_message_id;
      if (!keep.invitation_sent_at && row.invitation_sent_at) merged.invitationSentAt = row.invitation_sent_at;
      if (!keep.delivered_at && row.delivered_at) merged.deliveredAt = row.delivered_at;
      if (!keep.read_at && row.read_at) merged.readAt = row.read_at;
      if (!keep.replied_at && row.replied_at) merged.repliedAt = row.replied_at;
      if ((row.rsvp_status || row.status) && !['pending', ''].includes(row.rsvp_status || row.status)) merged.rsvpStatus = row.rsvp_status || row.status;
      if (Number(row.confirmed_count || 0) > Number(keep.confirmed_count || 0)) merged.confirmedCount = Number(row.confirmed_count || 0);
      if (Number(row.declined_count || 0) > Number(keep.declined_count || 0)) merged.declinedCount = Number(row.declined_count || 0);
    }

    if (Object.keys(merged).length) {
      try { await updateGuest(keep.id, merged); } catch (error) { errors.push(error.message || String(error)); }
    }

    for (const row of group.slice(1)) {
      try {
        await request(`/guests?id=eq.${eq(row.id)}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
        removedIds.push(row.id);
      } catch (error) {
        errors.push(error.message || String(error));
      }
    }
  }

  return { deduped: true, removed: removedIds.length, kept: keptIds.length, removedIds, keptIds, errors };
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
  deleteGuestsByIdentity,
  forceDeleteGuestsByIdentity,
  ensureGuestExists,
  listGuests,
  getGuestByPhone,
  getGuestByMetaMessageId,
  insertMessage,
  logTimeline,
  logWebhookEvent,
  isUuid,
  dedupeGuestsByBooking,
  deleteGuestsByBooking,
  deleteGuestEverywhere
};
