// GET: the default bank account (public; it is shown to customers on the Bank Transfer screen).
// POST with the staff PIN: list, save (add or edit), delete, and set the default account.
import { dbReady, bankBook, saveBankBook, defaultBank, cleanBank, newId, pinOk, send } from './_lib.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    if (!dbReady()) return send(res, 200, { ok: true, bank: null });
    try { return send(res, 200, { ok: true, bank: defaultBank(await bankBook()) }); }
    catch { return send(res, 200, { ok: true, bank: null }); }
  }
  if (req.method !== 'POST') return send(res, 405, { ok: false });
  const b = req.body || {};
  if (!process.env.STAFF_PIN) return send(res, 503, { ok: false, error: 'pin_not_configured' });
  if (!pinOk(b.pin)) { await new Promise(r => setTimeout(r, 1200)); return send(res, 401, { ok: false, error: 'bad_pin' }); }
  if (!dbReady()) return send(res, 503, { ok: false, error: 'not_configured' });
  try {
    const book = await bankBook();
    const has = id => book.accounts.some(a => a.id === id);
    if (b.action === 'save') {
      const data = cleanBank(b.account);
      if (!data) return send(res, 400, { ok: false, error: 'bad_input' });
      const id = b.account.id;
      if (id && !has(id)) return send(res, 400, { ok: false, error: 'bad_input' });
      if (id) book.accounts = book.accounts.map(a => (a.id === id ? { ...a, ...data } : a));
      else {
        if (book.accounts.length >= 20) return send(res, 400, { ok: false, error: 'too_many' });
        const created = { id: newId(), ...data };
        book.accounts.push(created);
        if (!book.defaultId || b.makeDefault) book.defaultId = created.id;
      }
      await saveBankBook(book);
    } else if (b.action === 'delete') {
      if (!has(b.id)) return send(res, 400, { ok: false, error: 'bad_input' });
      book.accounts = book.accounts.filter(a => a.id !== b.id);
      if (book.defaultId === b.id) book.defaultId = book.accounts[0]?.id || null;
      await saveBankBook(book);
    } else if (b.action === 'default') {
      if (!has(b.id)) return send(res, 400, { ok: false, error: 'bad_input' });
      book.defaultId = b.id;
      await saveBankBook(book);
    } else if (b.action !== 'list') return send(res, 400, { ok: false, error: 'bad_action' });
    return send(res, 200, { ok: true, accounts: book.accounts, defaultId: defaultBank(book)?.id || null });
  } catch {
    return send(res, 500, { ok: false, error: 'db_error' });
  }
}
