const { metaWebhookVerifyToken } = require('../_lib/config');
const { normalizePhone } = require('../_lib/phone');
const { sendRsvpConfirmed, sendRsvpDeclined, sendCardCountSelection, sendTemplateBySelection } = require('../_lib/meta');
const {
  getGuestByPhone,
  getGuestByMetaMessageId,
  updateGuest,
  updateGuestByPhone,
  insertMessage,
  logTimeline,
  logWebhookEvent
} = require('../_lib/supabase');

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end(body);
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

function normalizeArabicText(value = '') {
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

function collectReplyCandidates(message = {}) {
  const out = [];

  const push = (label, value) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      out.push({ label, value: String(value).trim(), normalized: normalizeArabicText(value) });
    }
  };

  push('message.type', message.type);
  push('message.text.body', message.text?.body);

  push('button.payload', message.button?.payload);
  push('button.text', message.button?.text);

  push('interactive.type', message.interactive?.type);
  push('interactive.button_reply.id', message.interactive?.button_reply?.id);
  push('interactive.button_reply.title', message.interactive?.button_reply?.title);
  push('interactive.list_reply.id', message.interactive?.list_reply?.id);
  push('interactive.list_reply.title', message.interactive?.list_reply?.title);

  // Some Meta payload variants put reply data deeper/differently.
  push('reply.id', message.reply?.id);
  push('reply.title', message.reply?.title);
  push('payload', message.payload);
  push('title', message.title);

  return out;
}

function parseRsvpReply(message = {}) {
  const candidates = collectReplyCandidates(message);
  const joined = candidates.map(x => x.normalized).join(' | ');
  const rawJoined = candidates.map(x => x.value).join(' | ');

  let selectedCount = null;
  for (const c of candidates) {
    const countMatch = c.value.match(/card_count_(\d+)/i) || c.normalized.match(/card_count_(\d+)/i);
    if (countMatch) {
      selectedCount = Number(countMatch[1]);
      return { action: 'attend_count', selectedCount, candidates, rawJoined, joined };
    }
  }

  // Decline must be checked before attend because "أعتذر عن الحضور" contains "الحضور".
  const isDecline =
    joined.includes('decline') ||
    joined.includes('declined') ||
    joined.includes('reject') ||
    joined.includes('cancel') ||
    joined.includes('no') ||
    joined.includes('اعتذر') ||
    joined.includes('اعتدار') ||
    joined.includes('معتذر') ||
    joined.includes('عذر') ||
    joined.includes('لا استطيع');

  if (isDecline) return { action: 'decline', selectedCount: null, candidates, rawJoined, joined };

  const isAttend =
    joined.includes('attend') ||
    joined.includes('confirm') ||
    joined.includes('confirmed') ||
    joined.includes('yes') ||
    joined.includes('ارغب') ||
    joined.includes('رغب') ||
    joined.includes('حاضر') ||
    joined.includes('موافق') ||
    joined.includes('تاكيد') ||
    joined.includes('تأكيد') ||
    // Be careful with "حضور"; decline already handled above.
    joined.includes('حضور');

  if (isAttend) return { action: 'attend', selectedCount: null, candidates, rawJoined, joined };

  return { action: '', selectedCount: null, candidates, rawJoined, joined };
}

async function findGuestForMessage(phoneNumber, contextMessageId) {
  let guest = null;

  if (contextMessageId) {
    guest = await getGuestByMetaMessageId(contextMessageId).catch(() => null);
  }

  if (!guest && phoneNumber) {
    guest = await getGuestByPhone(phoneNumber).catch(() => null);
  }

  if (!guest && phoneNumber?.startsWith('968')) {
    guest = await getGuestByPhone(phoneNumber.slice(3)).catch(() => null);
  }

  if (!guest && phoneNumber && phoneNumber.length === 8) {
    guest = await getGuestByPhone(`968${phoneNumber}`).catch(() => null);
  }

  return guest;
}

async function safeUpdateGuest(guest, phoneNumber, updates) {
  let updated = null;

  if (guest?.id) {
    updated = await updateGuest(guest.id, updates).catch(error => {
      console.error('[WEBHOOK_UPDATE_BY_ID_FAILED]', error);
      return null;
    });
  }

  if (!updated && phoneNumber) {
    updated = await updateGuestByPhone(phoneNumber, updates).catch(error => {
      console.error('[WEBHOOK_UPDATE_BY_PHONE_FAILED]', error);
      return null;
    });
  }

  return updated;
}

async function sendEntryCardIfReady(guest, phoneNumber, context = {}) {
  const confirmed = Number(context.confirmedCount ?? guest?.confirmedCount ?? 0);
  const urls = Array.isArray(guest?.entryCardUrls) && guest.entryCardUrls.length
    ? guest.entryCardUrls
    : (guest?.entryCardUrl ? [guest.entryCardUrl] : []);

  const selectedUrls = urls.slice(0, Math.max(0, confirmed));

  if (!selectedUrls.length || confirmed <= 0) {
    await logWebhookEvent('ENTRY_CARD_NOT_SENT', {
      phoneNumber,
      guestId: guest?.id,
      reason: !urls.length ? 'missing_entry_card_urls' : 'not_confirmed',
      startOrder: guest?.startOrder || guest?.orderNumber,
      confirmed
    });
    return null;
  }

  const results = [];
  for (const url of selectedUrls) {
    const result = await sendTemplateBySelection({
      phoneNumber,
      templateName: 'dawaa_entry_card',
      imageUrl: url,
      receptionTime: process.env.DAWAA_RECEPTION_TIME || context.receptionTime || '-',
      locationLink: process.env.DAWAA_LOCATION_LINK || context.locationLink || '-',
      languageCode: 'ar'
    });
    results.push({ url, result });
  }

  await logWebhookEvent('ENTRY_CARDS_SENT_AFTER_CONFIRMATION', {
    phoneNumber,
    guestId: guest.id,
    startOrder: guest.startOrder || guest.orderNumber,
    confirmed,
    sent: selectedUrls.length,
    results
  });

  await logTimeline(guest, 'entry_cards_sent', {
    startOrder: guest.startOrder || guest.orderNumber,
    confirmed,
    sent: selectedUrls.length,
    urls: selectedUrls
  }, 'meta');

  return results;
}

async function handleDecline({ guest, phoneNumber, message, parsed }) {
  const cardsCount = Math.max(1, Number(guest.cardsCount || guest.pendingCount || 1));
  const now = new Date().toISOString();

  const updates = {
    rsvpStatus: 'declined',
    confirmedCount: 0,
    declinedCount: cardsCount,
    pendingCount: 0,
    repliedAt: now
  };

  const updated = await safeUpdateGuest(guest, phoneNumber, updates);

  await insertMessage({
    bookingId: guest.bookingId,
    guestId: guest.id,
    phoneNumber,
    direction: 'inbound',
    messageType: 'button',
    messageBody: parsed.rawJoined || 'أعتذر عن الحضور',
    status: 'received'
  }).catch(() => null);

  await logTimeline(guest, 'rsvp_declined', { cardsCount, parsed }, 'meta').catch(() => null);

  const declinedSend = await sendRsvpDeclined(phoneNumber).catch(error => ({
    status: 'failed',
    error: String(error.message || error)
  }));

  await logWebhookEvent('CONFIRMATION_SEND_RESULT', {
    type: 'declined',
    phoneNumber,
    guestId: guest.id,
    updateSucceeded: !!updated,
    result: declinedSend
  });

  return { updated, sendResult: declinedSend };
}

async function handleAttend({ guest, phoneNumber, message, parsed }) {
  const cardsCount = Math.max(1, Number(guest.cardsCount || guest.pendingCount || 1));
  const now = new Date().toISOString();

  // If the user selected a count from list, use it. If one-card guest, confirm 1.
  const selectedCount = parsed.selectedCount ? Math.min(Math.max(1, Number(parsed.selectedCount)), cardsCount) : null;

  // For multi-card guests who only clicked "أرغب في الحضور", ask for count first.
  if (!selectedCount && cardsCount > 1) {
    const updated = await safeUpdateGuest(guest, phoneNumber, {
      rsvpStatus: 'pending',
      pendingCount: cardsCount,
      repliedAt: now
    });

    await insertMessage({
      bookingId: guest.bookingId,
      guestId: guest.id,
      phoneNumber,
      direction: 'inbound',
      messageType: 'button',
      messageBody: parsed.rawJoined || 'أرغب في الحضور - بانتظار عدد البطاقات',
      status: 'received'
    }).catch(() => null);

    await logTimeline(guest, 'rsvp_confirm_requested_count', { cardsCount, parsed }, 'meta').catch(() => null);

    const listSend = await sendCardCountSelection(phoneNumber, guest.guestName, cardsCount).catch(error => ({
      status: 'failed',
      error: String(error.message || error)
    }));

    await logWebhookEvent('CONFIRMATION_SEND_RESULT', {
      type: 'count_list',
      phoneNumber,
      guestId: guest.id,
      updateSucceeded: !!updated,
      result: listSend
    });

    return { updated, sendResult: listSend };
  }

  const confirmedCount = selectedCount || 1;
  const declinedCount = Math.max(0, cardsCount - confirmedCount);

  const updates = {
    rsvpStatus: 'confirmed',
    confirmedCount,
    declinedCount,
    pendingCount: 0,
    repliedAt: now
  };

  const updated = await safeUpdateGuest(guest, phoneNumber, updates);

  await insertMessage({
    bookingId: guest.bookingId,
    guestId: guest.id,
    phoneNumber,
    direction: 'inbound',
    messageType: selectedCount ? 'list_reply' : 'button',
    messageBody: selectedCount ? `تأكيد ${confirmedCount} من ${cardsCount}` : (parsed.rawJoined || 'أرغب في الحضور'),
    status: 'received'
  }).catch(() => null);

  await logTimeline(guest, selectedCount ? 'rsvp_confirmed_count' : 'rsvp_confirmed', {
    confirmedCount,
    declinedCount,
    cardsCount,
    parsed
  }, 'meta').catch(() => null);

  const confirmSend = await sendRsvpConfirmed(phoneNumber).catch(error => ({
    status: 'failed',
    error: String(error.message || error)
  }));

  await logWebhookEvent('CONFIRMATION_SEND_RESULT', {
    type: 'confirmed',
    phoneNumber,
    guestId: guest.id,
    updateSucceeded: !!updated,
    confirmedCount,
    declinedCount,
    result: confirmSend
  });

  const freshGuest = { ...guest, ...updates };
  await sendEntryCardIfReady(freshGuest, phoneNumber, { confirmedCount }).catch(error => {
    console.error('[ENTRY_CARD_SEND_FAILED]', error);
  });

  return { updated, sendResult: confirmSend };
}

async function processIncomingMessage(message = {}) {
  const phoneNumber = normalizePhone(message.from);
  const contextMessageId = message.context?.id || '';
  const parsed = parseRsvpReply(message);

  await logWebhookEvent('PARSED_BUTTON_REPLY', {
    phoneNumber,
    messageType: message.type,
    contextMessageId,
    action: parsed.action,
    selectedCount: parsed.selectedCount,
    candidates: parsed.candidates
  });

  if (!parsed.action) return;

  const guest = await findGuestForMessage(phoneNumber, contextMessageId);

  await logWebhookEvent('MATCHED_GUEST', {
    phoneNumber,
    contextMessageId,
    found: !!guest,
    guestId: guest?.id || null,
    bookingId: guest?.bookingId || null,
    currentStatus: guest?.rsvpStatus || null
  });

  if (!guest) return;

  let result = null;

  if (parsed.action === 'decline') {
    result = await handleDecline({ guest, phoneNumber, message, parsed });
  } else if (parsed.action === 'attend' || parsed.action === 'attend_count') {
    result = await handleAttend({ guest, phoneNumber, message, parsed });
  }

  await logWebhookEvent('RSVP_UPDATE_RESULT', {
    phoneNumber,
    guestId: guest.id,
    action: parsed.action,
    updated: !!result?.updated,
    updatedStatus: result?.updated?.rsvpStatus || null
  });
}

async function processStatus(status = {}) {
  const messageId = status.id;
  const phoneNumber = normalizePhone(status.recipient_id);
  let guest = await getGuestByMetaMessageId(messageId).catch(() => null);

  if (!guest && phoneNumber) {
    guest = await getGuestByPhone(phoneNumber).catch(() => null);
  }

  await logWebhookEvent('MESSAGE_STATUS_RECEIVED', {
    messageId,
    phoneNumber,
    status: status.status,
    foundGuest: !!guest,
    errors: status.errors || []
  });

  if (!guest) return;

  const updates = {};
  const current = guest.rsvpStatus;
  const canMarkMessageState = !['confirmed', 'declined', 'checked-in'].includes(current);

  if (status.status === 'delivered') {
    updates.deliveredAt = new Date().toISOString();
    if (canMarkMessageState) updates.rsvpStatus = 'delivered';
  }

  if (status.status === 'read') {
    updates.readAt = new Date().toISOString();
    if (canMarkMessageState) updates.rsvpStatus = 'read';
  }

  if (status.status === 'failed') {
    updates.rsvpStatus = 'failed';
  }

  if (Object.keys(updates).length) {
    await safeUpdateGuest(guest, phoneNumber, updates);
  }

  await logTimeline(guest, `message_${status.status}`, { messageId, status }, 'meta').catch(() => null);
}

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge') || '';

    if (mode === 'subscribe' && token === metaWebhookVerifyToken) {
      return send(res, 200, challenge);
    }

    return send(res, 403, 'Forbidden');
  }

  if (req.method !== 'POST') {
    return send(res, 405, 'Method not allowed');
  }

  const body = await readBody(req);

  try {
    console.log('[WEBHOOK_RECEIVED]', JSON.stringify(body).slice(0, 3000));
    await logWebhookEvent('WEBHOOK_RECEIVED', body);

    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value || {};

          for (const message of value.messages || []) {
            await processIncomingMessage(message);
          }

          for (const status of value.statuses || []) {
            await processStatus(status);
          }
        }
      }
    }

    return send(res, 200, 'OK');
  } catch (error) {
    console.error('[WEBHOOK_META_ERROR]', error);
    try {
      await logWebhookEvent('WEBHOOK_META_ERROR', {
        error: String(error.message || error),
        stack: error.stack || '',
        body
      });
    } catch (_) {}

    // Return 200 so Meta does not retry forever. Error is logged.
    return send(res, 200, 'OK');
  }
};
