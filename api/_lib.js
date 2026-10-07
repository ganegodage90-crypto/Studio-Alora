// Shared helpers for the monthly-package tracker. Files starting with "_" are not public routes.
import { timingSafeEqual, randomUUID } from 'node:crypto';

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = 'alora:packages';
export const dbReady = () => Boolean(URL_ && TOKEN);

async function redis(cmd) {
  const r = await fetch(URL_, { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error || `db ${r.status}`);
  return j.result;
}

export async function allPackages() {
  const flat = (await redis(['HGETALL', KEY])) || [];
  const out = [];
  for (let i = 1; i < flat.length; i += 2) out.push(JSON.parse(flat[i]));
  return out.sort((a, b) => b.createdAt - a.createdAt);
}
export const savePackage = p => redis(['HSET', KEY, p.id, JSON.stringify(p)]);
export const deletePackage = id => redis(['HDEL', KEY, id]);
export const newId = () => randomUUID().slice(0, 8);

/** Sri Lankan numbers compare on their last 9 digits, so 076…, +9476… and 9476… all match. */
export const normPhone = v => String(v || '').replace(/\D/g, '').slice(-9);

export function pinOk(pin) {
  const expected = process.env.STAFF_PIN;
  if (!expected) return false;
  const a = Buffer.from(String(pin || '').slice(0, 12).padEnd(12, '\0'));
  const b = Buffer.from(expected.slice(0, 12).padEnd(12, '\0'));
  return timingSafeEqual(a, b);
}

const DAY = 86400000;
export const VALID_DAYS = 30;
export const expiresAt = p => (p.startedAt ? p.startedAt + VALID_DAYS * DAY : null);
export const isExpired = (p, now = Date.now()) => Boolean(p.startedAt) && now > expiresAt(p);

/** The package a session should be charged to: the newest one for this phone that has not expired. */
export function activeFor(list, phone, now = Date.now()) {
  const n = normPhone(phone);
  if (n.length < 9) return null;
  return list.find(p => p.phone === n && !isExpired(p, now)) || null;
}

/**
 * Hours a session uses from a package: minimum 1 hour, 30-minute steps,
 * and time after 8:00 PM Sri Lanka time counts 1.5×.
 */
export function countedHours(endMs, durationMs) {
  const OFFSET = 5.5 * 3600000; // Asia/Colombo, no daylight saving
  const start = endMs - durationMs;
  let weighted = 0;
  for (let t = start; t < endMs; ) {
    const local = t + OFFSET;
    const dayStart = Math.floor(local / DAY) * DAY;
    const eight = dayStart + 20 * 3600000 - OFFSET;
    const midnight = dayStart + DAY - OFFSET;
    const late = t >= eight;
    const next = Math.min(endMs, late ? midnight : eight);
    weighted += (next - t) * (late ? 1.5 : 1);
    t = next;
  }
  return Math.max(1, Math.round((weighted / 3600000) * 2) / 2);
}

/** What the customer (and the check-in screen) may see. No phone number is echoed back. */
export function publicView(p) {
  const used = p.sessions.reduce((s, x) => s + x.hours, 0);
  return {
    name: p.name, kind: p.kind, hours: p.hours, rate: p.rate, used,
    left: Math.max(0, p.hours - used), extra: Math.max(0, used - p.hours),
    startedAt: p.startedAt || null, expiresAt: expiresAt(p),
    sessions: p.sessions.map(s => ({ at: s.at, hours: s.hours, note: s.note || '', start: s.start || null, end: s.end || null, restMs: s.restMs || 0 })),
  };
}

export function send(res, status, body) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(body);
}

// ---- Invoices -------------------------------------------------------------
const INV = 'alora:invoices';
export async function allInvoices() {
  const flat = (await redis(['HGETALL', INV])) || [];
  const out = [];
  for (let i = 1; i < flat.length; i += 2) out.push(JSON.parse(flat[i]));
  return out.sort((a, b) => b.seq - a.seq);
}
export const saveInvoice = inv => redis(['HSET', INV, inv.id, JSON.stringify(inv)]);
export const deleteInvoice = id => redis(['HDEL', INV, id]);
/** Next number in the series: SA-0001, SA-0002, … Numbers are never reused. */
export async function nextInvoiceNumber() {
  const seq = Number(await redis(['INCR', 'alora:invoice_seq']));
  return { seq, number: `SA-${String(seq).padStart(4, '0')}` };
}

const text = (v, max) => String(v ?? '').trim().slice(0, max);
const money = v => { const n = Math.round(Number(v)); return Number.isFinite(n) && n >= 0 && n < 1e9 ? n : 0; };
/** A rate in LKR, kept exact to 2 decimals. */
const rate2 = v => { const n = Math.round(Number(v) * 100) / 100; return Number.isFinite(n) && n >= 0 && n < 1e9 ? n : 0; };
/** Keep only known fields, with sane sizes, from whatever the browser sent. */
export function cleanInvoice(b) {
  const c = b.client || {};
  const items = (Array.isArray(b.items) ? b.items : []).slice(0, 30)
    .map(i => {
      const rate = rate2(i.rate), std = rate2(i.std);
      // "std" is the standard rate, kept only when the charged rate is lower (a discounted line).
      return { desc: text(i.desc, 200), qty: Math.max(0, Math.min(1000, Number(i.qty) || 0)), rate, ...(std > rate ? { std } : {}) };
    })
    .filter(i => i.desc);
  return {
    date: Number(b.date) > 0 ? Number(b.date) : Date.now(),
    client: { name: text(c.name, 80), phone: text(c.phone, 30), address: text(c.address, 200), email: text(c.email, 120) },
    items, discount: money(b.discount), advance: money(b.advance),
    method: text(b.method, 40), status: b.status === 'paid' ? 'paid' : 'unpaid', notes: text(b.notes, 500),
  };
}
