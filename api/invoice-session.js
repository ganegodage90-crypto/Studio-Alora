// Called by the check-in screen when a session is paid: stores a numbered invoice for it.
// A repeat call for the same session returns the invoice already stored.
import { dbReady, allInvoices, saveInvoice, nextInvoiceNumber, cleanInvoice, newId, send } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { ok: false });
  if (!dbReady()) return send(res, 503, { ok: false, error: 'not_configured' });
  const b = req.body || {};
  const startedAt = Number(b.startedAt), endedAt = Number(b.endedAt), now = Date.now();
  if (!(startedAt > 0 && startedAt < endedAt && endedAt <= now + 60000 && endedAt >= now - 12 * 3600000))
    return send(res, 400, { ok: false, error: 'bad_session' });
  try {
    const key = `s${startedAt}`;
    const existing = (await allInvoices()).find(x => x.sessionKey === key);
    if (existing) return send(res, 200, { ok: true, invoice: existing });
    const data = cleanInvoice({ ...(b.invoice || {}), date: endedAt });
    if (!data.client.name || data.items.length === 0) return send(res, 400, { ok: false, error: 'bad_input' });
    const invoice = { id: newId(), ...(await nextInvoiceNumber()), ...data, source: 'session', sessionKey: key, createdAt: now, updatedAt: now };
    await saveInvoice(invoice);
    return send(res, 200, { ok: true, invoice });
  } catch (e) {
    return send(res, 500, { ok: false, error: 'db_error' });
  }
}
