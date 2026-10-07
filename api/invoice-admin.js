// Staff only (PIN): list, create, edit and delete invoices.
import { dbReady, allInvoices, saveInvoice, deleteInvoice, nextInvoiceNumber, cleanInvoice, newId, pinOk, send } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { ok: false });
  const b = req.body || {};
  if (!process.env.STAFF_PIN) return send(res, 503, { ok: false, error: 'pin_not_configured' });
  if (!pinOk(b.pin)) { await new Promise(r => setTimeout(r, 1200)); return send(res, 401, { ok: false, error: 'bad_pin' }); }
  if (!dbReady()) return send(res, 503, { ok: false, error: 'not_configured' });
  try {
    const list = await allInvoices();
    let saved = null;
    if (b.action === 'save') {
      const data = cleanInvoice(b.invoice || {});
      if (!data.client.name || data.items.length === 0) return send(res, 400, { ok: false, error: 'bad_input' });
      const old = b.invoice.id ? list.find(x => x.id === b.invoice.id) : null;
      if (b.invoice.id && !old) return send(res, 400, { ok: false, error: 'bad_input' });
      saved = old
        ? { ...old, ...data, updatedAt: Date.now() }
        : { id: newId(), ...(await nextInvoiceNumber()), ...data, source: 'staff', createdAt: Date.now(), updatedAt: Date.now() };
      await saveInvoice(saved);
    } else if (b.action === 'delete') {
      if (!list.some(x => x.id === b.id)) return send(res, 400, { ok: false, error: 'bad_input' });
      await deleteInvoice(b.id);
    } else if (b.action !== 'list') return send(res, 400, { ok: false, error: 'bad_action' });
    return send(res, 200, { ok: true, invoices: await allInvoices(), saved });
  } catch (e) {
    return send(res, 500, { ok: false, error: 'db_error' });
  }
}
