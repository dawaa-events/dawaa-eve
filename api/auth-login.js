const { createToken } = require('./_lib/auth');

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
module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { success:false, message:'Method not allowed' });
    const body = await readBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const adminEmail = String(process.env.DAWAA_ADMIN_EMAIL || '').trim().toLowerCase();
    const adminPassword = String(process.env.DAWAA_ADMIN_PASSWORD || '');
    const clientEmail = String(process.env.DAWAA_CLIENT_EMAIL || '').trim().toLowerCase();
    const clientPassword = String(process.env.DAWAA_CLIENT_PASSWORD || '');
    if (!adminEmail || !adminPassword) {
      return json(res, 500, { success:false, message:'Admin login is not configured in Vercel' });
    }
    if (email === adminEmail && password === adminPassword) {
      const user = { email, role:'admin', name:'إدارة دعوة' };
      const session = createToken(user);
      return json(res, 200, { success:true, user, token:session.token, expiresAt:session.expiresAt });
    }
    return json(res, 401, { success:false, message:'بيانات الدخول غير صحيحة' });
  } catch (error) {
    return json(res, 500, { success:false, message:String(error.message || error) });
  }
};
