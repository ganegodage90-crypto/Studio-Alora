// Called by the check-in screen when a session ends: charges the session to the customer's package.
import { dbReady, allPackages, savePackage, activeFor, publicView, countedHours, send } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { ok: false });
  if (!dbReady()) return send(res, 503, { ok: false, error: 'not_configured' });
  const b = req.body || {};
  const startedAt = Number(b.startedAt), endedAt = Number(b.endedAt), durationMs = Number(b.durationMs);
  const now = Date.now();
  // Only accept a session that really just ended, and of a believable length.
  if (!(durationMs > 0 && durationMs <= 16 * 3600000) || !(endedAt <= now + 60000 && endedAt >= now - 6 * 3600000) || !(startedAt < endedAt))
    return send(res, 400, { ok: false, error: 'bad_session' });
  try {
    const p = activeFor(await allPackages(), b.phone);
    if (!p) return send(res, 200, { ok: true, package: null });
    const before = publicView(p);
    const key = `s${startedAt}`;
    let entry = p.sessions.find(s => s.key === key); // a repeat call for the same session never charges twice
    if (!entry) {
      entry = { key, at: endedAt, hours: countedHours(endedAt, durationMs) };
      p.sessions.push(entry);
      if (!p.startedAt) p.startedAt = startedAt;
      await savePackage(p);
    }
    const leftBefore = Math.max(0, p.hours - p.sessions.filter(s => s.key !== key).reduce((s, x) => s + x.hours, 0));
    const extraHours = Math.max(0, entry.hours - leftBefore);
    return send(res, 200, { ok: true, package: publicView(p), charged: entry.hours, extraHours, extraDue: extraHours * p.rate, leftBefore: before.left });
  } catch (e) {
    return send(res, 500, { ok: false, error: 'db_error' });
  }
}
