const { listGuests, ensureGuestExists, deleteGuest, deleteGuestsByIdentity } = require('./_lib/supabase');

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
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
      const guests = await listGuests(1000);
      return json(res, 200, { success: true, guests });
    }


    if (req.method === 'DELETE') {
      let body = {};
      try { body = await readBody(req); } catch (_) {}
      if (body?.guest) {
        const result = await deleteGuestsByIdentity(body.guest, body.booking || {});
        return json(res, 200, { success: true, ...result });
      }

      const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
      const id = url.searchParams.get('id');
      if (!id) return json(res, 400, { success: false, message: 'Missing guest id' });
      const result = await deleteGuest(id);
      if (!result) return json(res, 404, { success: false, message: 'Guest not deleted or not found' });
      return json(res, 200, { success: true, deleted: true, id });
    }

    if (req.method === 'POST') {
      const body = await readBody(req);
      const guests = Array.isArray(body.guests) ? body.guests : (body.guest ? [body.guest] : []);
      const booking = body.booking || {};
      if (!guests.length) return json(res, 400, { success: false, message: 'No guests provided' });

      const saved = [];
      for (const guest of guests) {
        try {
          const row = await ensureGuestExists(guest, booking);
          if (row) saved.push(row);
        } catch (error) {
          console.error('[guests-sync] save guest failed', error);
        }
      }
      return json(res, 200, { success: true, count: saved.length, guests: saved });
    }

    return json(res, 405, { success: false, message: 'Method not allowed' });
  } catch (error) {
    console.error('[guests-sync] Error', error);
    return json(res, 500, { success: false, message: String(error.message || error) });
  }
};
