const { ensureBookingExists, listBookings } = require('./_lib/supabase');

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
      const bookings = await listBookings(500);
      return json(res, 200, { success: true, bookings });
    }

    if (req.method === 'POST') {
      const body = await readBody(req);
      const booking = body.booking || body;
      const saved = await ensureBookingExists(booking);
      return json(res, 200, { success: true, booking: saved });
    }

    return json(res, 405, { success: false, message: 'Method not allowed' });
  } catch (error) {
    console.error('[bookings-sync] Error', error);
    return json(res, 500, { success: false, message: String(error.message || error) });
  }
};
