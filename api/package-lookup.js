// Customer view: hours bought, used and left for the package on this phone number.
import { dbReady, allPackages, activeFor, publicView, normPhone, send } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { ok: false });
  if (!dbReady()) return send(res, 503, { ok: false, error: 'not_configured' });
  const phone = normPhone(req.body && req.body.phone);
  if (phone.length < 9) return send(res, 200, { ok: true, package: null });
  try {
    const list = await allPackages();
    const p = activeFor(list, phone) || list.find(x => x.phone === phone) || null;
    return send(res, 200, { ok: true, package: p ? { ...publicView(p), expired: !activeFor(list, phone) } : null });
  } catch (e) {
    return send(res, 500, { ok: false, error: 'db_error' });
  }
}
