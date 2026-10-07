// Staff only (PIN): list, create, adjust and delete monthly packages.
import { dbReady, allPackages, savePackage, deletePackage, newId, normPhone, pinOk, publicView, isExpired, send } from './_lib.js';

const view = p => ({ id: p.id, phone: p.phone, createdAt: p.createdAt, expired: isExpired(p), ...publicView(p) });

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { ok: false });
  const b = req.body || {};
  if (!process.env.STAFF_PIN) return send(res, 503, { ok: false, error: 'pin_not_configured' });
  if (!pinOk(b.pin)) { await new Promise(r => setTimeout(r, 1200)); return send(res, 401, { ok: false, error: 'bad_pin' }); }
  if (!dbReady()) return send(res, 503, { ok: false, error: 'not_configured' });
  try {
    const list = await allPackages();
    if (b.action === 'create') {
      const phone = normPhone(b.phone), hours = Number(b.hours), rate = Number(b.rate);
      const name = String(b.name || '').trim().slice(0, 80);
      const kind = b.kind === 'commercial' ? 'commercial' : 'nonCommercial';
      if (!name || phone.length < 9 || !(hours > 0 && hours <= 500) || !(rate > 0)) return send(res, 400, { ok: false, error: 'bad_input' });
      await savePackage({ id: newId(), name, phone, kind, hours, rate, sessions: [], startedAt: null, createdAt: Date.now() });
    } else if (b.action === 'adjust') {
      const p = list.find(x => x.id === b.id), hours = Number(b.hours);
      if (!p || !hours || Math.abs(hours) > 100) return send(res, 400, { ok: false, error: 'bad_input' });
      p.sessions.push({ key: `a${Date.now()}`, at: Date.now(), hours, note: String(b.note || 'Staff adjustment').slice(0, 80) });
      if (!p.startedAt && hours > 0) p.startedAt = Date.now();
      await savePackage(p);
    } else if (b.action === 'delete') {
      if (!list.some(x => x.id === b.id)) return send(res, 400, { ok: false, error: 'bad_input' });
      await deletePackage(b.id);
    } else if (b.action !== 'list') return send(res, 400, { ok: false, error: 'bad_action' });
    return send(res, 200, { ok: true, packages: (await allPackages()).map(view) });
  } catch (e) {
    return send(res, 500, { ok: false, error: 'db_error' });
  }
}
