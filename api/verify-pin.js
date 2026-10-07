// Checks the staff PIN on the server so it never ships in the browser code.
// Set STAFF_PIN in Vercel → Settings → Environment Variables.
import { timingSafeEqual } from 'node:crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  const expected = process.env.STAFF_PIN;
  if (!expected) return res.status(503).json({ ok: false, error: 'not_configured' });
  const pin = String((req.body && req.body.pin) || '').slice(0, 12);
  const a = Buffer.from(pin.padEnd(12, '\0'));
  const b = Buffer.from(expected.slice(0, 12).padEnd(12, '\0'));
  const ok = timingSafeEqual(a, b);
  if (!ok) await new Promise(r => setTimeout(r, 1200)); // slow down guessing
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ ok });
}
