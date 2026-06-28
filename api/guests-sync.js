const { listGuests } = require('./_lib/supabase');

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'GET') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ success: false, message: 'Method not allowed' }));
  }
  try {
    const guests = await listGuests(1000);
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, guests }));
  } catch (error) {
    console.error('[guests-sync] Error', error);
    res.statusCode = 500;
    res.end(JSON.stringify({ success: false, message: String(error.message || error) }));
  }
};
