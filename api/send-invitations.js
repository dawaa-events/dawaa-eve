const { sendTemplateBySelection } = require('./_lib/meta');
const { ensureGuestExists, updateGuest, updateGuestByPhone, insertMessage, logTimeline } = require('./_lib/supabase');

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function normalizePhone(v = '') {
  const d = String(v || '').replace(/\D/g, '');
  if (d.length === 8) return '968' + d;
  if (d.startsWith('00')) return d.slice(2);
  return d;
}

function resolveTemplate(body = {}, booking = {}) {
  return body.template || body.templateName || booking.whatsappTemplate || booking.templateName || 'dawaa_wedding_invitation';
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { success:false, message:'Method not allowed' });

    const body = await readBody(req);
    const booking = body.booking || {};
    const guests = Array.isArray(body.guests) ? body.guests : [];
    const templateName = resolveTemplate(body, booking);
    const invitationImageUrl = body.invitationImageUrl || booking.invitationImageUrl || '';
    const languageCode = body.languageCode || body.language || 'ar';

    if (!guests.length) return json(res, 400, { success:false, message:'لا يوجد ضيوف للإرسال' });

    if ((templateName === 'dawaa_wedding_invitation_image' || templateName === 'dawaa_entry_card') && !invitationImageUrl) {
      return json(res, 400, { success:false, message:`القالب ${templateName} يحتاج رابط صورة` });
    }

    const results = [];

    for (const originalGuest of guests) {
      const phoneNumber = normalizePhone(originalGuest.phoneNumber || originalGuest.phone_number || originalGuest.phone);
      const cardsCount = Number(originalGuest.cardsCount || originalGuest.cards_count || 1) || 1;

      if (!phoneNumber) {
        results.push({ guestId: originalGuest.id, status:'failed', error:'phone missing' });
        continue;
      }

      const guest = await ensureGuestExists(originalGuest, booking).catch(() => null);
      const guestId = guest?.id || originalGuest.id;

      const result = await sendTemplateBySelection({
        phoneNumber,
        templateName,
        languageCode,
        imageUrl: invitationImageUrl || originalGuest.cardUrl || originalGuest.card_url || originalGuest.entryCardUrl || '',
        invitationImageUrl,
        guestName: originalGuest.guestName || originalGuest.guest_name || originalGuest.name || guest?.guestName || '-',
        hostOne: booking.hostOne || booking.host_one || '-',
        hostTwo: booking.hostTwo || booking.host_two || '-',
        brideName: booking.brideName || booking.bride_name || '-',
        groomName: booking.groomName || booking.groom_name || '-',
        cardsCount,
        receptionTime: booking.receptionTime || booking.reception_time || '-',
        locationLink: booking.locationLink || booking.location_link || '-',
        parameterMode: templateName === 'dawaa_wedding_invitation_image' ? 'named' : 'numbered'
      });

      if (result.status === 'sent') {
        const now = new Date().toISOString();
        const sentUpdate = {
          rsvpStatus: 'sent',
          invitationSentAt: now,
          metaMessageId: result.messageId,
          cardsCount,
          pendingCount: cardsCount
        };
        const updatedById = await updateGuest(guestId, sentUpdate).catch(() => null);
        if (!updatedById) await updateGuestByPhone(phoneNumber, sentUpdate).catch(() => null);

        await insertMessage({
          bookingId: booking.id || originalGuest.bookingId,
          guestId,
          phoneNumber,
          direction: 'outbound',
          messageType: 'template',
          messageBody: templateName,
          metaMessageId: result.messageId,
          status: 'sent'
        }).catch(() => null);

        await logTimeline({ id: guestId, bookingId: booking.id || originalGuest.bookingId }, 'template_sent', {
          template: templateName,
          messageId: result.messageId,
          imageUrl: invitationImageUrl || null
        }, 'site').catch(() => null);

        results.push({ guestId: originalGuest.id, dbGuestId: guestId, status:'sent', messageId:result.messageId, template:templateName });
      } else {
        results.push({ guestId: originalGuest.id, dbGuestId: guestId, status:'failed', error:result.error || 'Meta send failed', template:templateName, debug: result.requestBody });
      }
    }

    const sent = results.filter(r => r.status === 'sent').length;
    const failed = results.length - sent;

    return json(res, 200, { success:true, sent, failed, template:templateName, results });
  } catch (error) {
    console.error('[send-invitations]', error);
    return json(res, 500, { success:false, message:String(error.message || error) });
  }
};
