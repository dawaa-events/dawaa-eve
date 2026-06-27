const { defaultTemplateName, sendApiToken } = require('./_lib/config');
const { normalizePhone } = require('./_lib/phone');
const { sendWeddingInvitation } = require('./_lib/meta');
const { ensureGuestExists, updateGuest, updateGuestByPhone, insertMessage, logTimeline } = require('./_lib/supabase');

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
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

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { success: false, message: 'Method not allowed' });

  try {
    if (sendApiToken) {
      const headerToken = req.headers['x-dawaa-send-token'] || req.headers.authorization?.replace(/^Bearer\s+/i, '');
      if (headerToken !== sendApiToken) return json(res, 401, { success: false, message: 'غير مصرح بتنفيذ الإرسال' });
    }
    const body = await readBody(req);
    const booking = body.booking || {};
    const guests = Array.isArray(body.guests) ? body.guests : [];
    const templateName = body.templateName || defaultTemplateName;

    if (!guests.length) return json(res, 400, { success: false, message: 'لا يوجد ضيوف للإرسال' });

    const results = [];
    for (const guest of guests) {
      const phoneNumber = normalizePhone(guest.phoneNumber || guest.phone || guest.mobile);
      const cardsCount = Number(guest.cardsCount || guest.cards_count || 1);
      const payload = {
        phoneNumber,
        guestName: guest.guestName || guest.name || '-',
        hostOne: booking.hostOne || booking.host_one || '-',
        hostTwo: booking.hostTwo || booking.host_two || '-',
        brideName: booking.brideName || booking.bride_name || '-',
        groomName: booking.groomName || booking.groom_name || '-',
        cardsCount,
        templateName
      };

      if (!phoneNumber || phoneNumber.length < 8) {
        results.push({ guestId: guest.id, phoneNumber, status: 'failed', error: 'رقم الهاتف غير صالح' });
        continue;
      }

      const sentAt = new Date().toISOString();

      // IMPORTANT: The frontend design stores guests locally with ids like g1/g2.
      // Supabase guests.id is UUID, so the webhook could not find/update those local guests.
      // We create/reuse a Supabase guest row by phone BEFORE sending, then store Meta message id there.
      let dbGuest = null;
      try {
        dbGuest = await ensureGuestExists(guest, booking);
      } catch (dbErr) {
        console.error('[send-invitations] ensureGuestExists failed', dbErr);
      }

      const result = await sendWeddingInvitation(payload);
      const row = {
        guestId: guest.id,
        dbGuestId: dbGuest?.id || null,
        phoneNumber,
        status: result.status,
        messageId: result.messageId || '',
        error: result.error || null
      };
      results.push(row);

      try {
        const update = {
          rsvpStatus: result.status === 'sent' ? 'sent' : 'failed',
          pendingCount: cardsCount,
          invitationSentAt: result.status === 'sent' ? sentAt : null,
          metaMessageId: result.messageId || null,
          notes: result.error || guest.notes || null
        };
        if (dbGuest?.id) await updateGuest(dbGuest.id, update);
        else await updateGuestByPhone(phoneNumber, update);
      } catch (dbErr) {
        row.dbWarning = String(dbErr.message || dbErr);
      }

      await insertMessage({
        bookingId: dbGuest?.bookingId || guest.bookingId || booking.id || body.bookingId,
        guestId: dbGuest?.id || guest.id,
        phoneNumber,
        direction: 'outbound',
        messageType: 'template',
        messageBody: `إرسال قالب ${templateName}`,
        metaMessageId: result.messageId || null,
        status: result.status
      });
      await logTimeline({ id: dbGuest?.id || guest.id, bookingId: dbGuest?.bookingId || guest.bookingId || booking.id || body.bookingId }, 'invitation_sent', row, 'meta');
    }

    const sent = results.filter(r => r.status === 'sent').length;
    const failed = results.filter(r => r.status !== 'sent').length;
    return json(res, 200, { success: failed === 0, sent, failed, results });
  } catch (error) {
    console.error('[send-invitations] Error', error);
    return json(res, 500, { success: false, message: 'حدث خطأ أثناء الإرسال', error: String(error.message || error) });
  }
};
