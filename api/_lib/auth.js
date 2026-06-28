const crypto = require('crypto');

function getSecret() {
  return process.env.DAWAA_AUTH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'change-me-now';
}
function b64url(input) {
  return Buffer.from(JSON.stringify(input)).toString('base64url');
}
function sign(payload) {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');
}
function createToken(user, ttlMs = 12 * 60 * 60 * 1000) {
  const expiresAt = Date.now() + ttlMs;
  const payload = b64url({ user, expiresAt });
  const sig = sign(payload);
  return { token: `${payload}.${sig}`, expiresAt };
}
function verifyToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  const expected = sign(payload);
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch (_) { return null; }
  const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  if (!decoded.expiresAt || Date.now() > decoded.expiresAt) return null;
  return decoded;
}
function getAuthFromReq(req) {
  const token = req.headers['x-dawaa-auth'] || req.headers.authorization?.replace(/^Bearer\s+/i, '');
  return verifyToken(token);
}
function requireAuth(req, res, role = '') {
  const session = getAuthFromReq(req);
  if (!session?.user) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ success:false, message:'Unauthorized' }));
    return null;
  }
  if (role && session.user.role !== role) {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ success:false, message:'Forbidden' }));
    return null;
  }
  return session;
}
module.exports = { createToken, verifyToken, getAuthFromReq, requireAuth };
