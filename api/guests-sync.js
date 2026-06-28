const {
  listGuests,
  ensureGuestExists,
  updateGuest,
  updateGuestByPhone,
  deleteGuestById,
  deleteGuestByPhone
} = require('./_lib/supabase');

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
  try {
    if (req.method === 'GET') {
      const guests = await listGuests(5000);
      return json(res, 200, { success: true, guests });
    }

    if (req.method === 'POST') {
      const body = await readBody(req);
      const action = body.action || 'upsert';
      const guest = body.guest || body;
      const booking = body.booking || {};

      if (action === 'delete') {
        const deleted = guest.dbGuestId
          ? await deleteGuestById(guest.dbGuestId)
          : await deleteGuestByPhone(guest.phoneNumber || guest.phone);
        return json(res, 200, { success: true, deleted: Boolean(deleted !== null) });
      }

      const saved = await ensureGuestExists(guest, booking);
      if (saved?.id && body.update) {
        const updated = await updateGuest(saved.id, body.update);
        return json(res, 200, { success: true, guest: updated || saved });
      }

      return json(res, 200, { success: true, guest: saved });
    }

    if (req.method === 'DELETE') {
      const body = await readBody(req);
      const guest = body.guest || body;
      const deleted = guest.dbGuestId
        ? await deleteGuestById(guest.dbGuestId)
        : await deleteGuestByPhone(guest.phoneNumber || guest.phone);
      return json(res, 200, { success: true, deleted: Boolean(deleted !== null) });
    }

    return json(res, 405, { success: false, message: 'Method not allowed' });
  } catch (error) {
    console.error('[guests-sync] Error', error);
    return json(res, 500, { success: false, message: String(error.message || error) });
  }
};
