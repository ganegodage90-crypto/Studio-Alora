import { STUDIO_NAME, ADDRESS, HOTLINE, EMAIL, BANK, SITE_HOST } from './site';

/** `rate` is what the client pays per unit. `std` is the standard rate, set only on a discounted line. */
export interface InvoiceItem { desc: string; qty: number; rate: number; std?: number }
export const rate2 = (v: number) => Math.round(v * 100) / 100;
/** Rates are shown exactly, with up to 2 decimals. */
export const rateStr = (v: number) => v.toLocaleString('en-US', { maximumFractionDigits: 2 });
export interface InvoiceDraft {
  id?: string; number?: string; date: number;
  client: { name: string; phone: string; address: string; email: string };
  items: InvoiceItem[]; discount: number; advance: number;
  method: string; status: 'paid' | 'unpaid'; notes: string;
}
export interface Invoice extends InvoiceDraft { id: string; number: string; seq: number; source: 'staff' | 'session'; createdAt: number; updatedAt: number }

export const emptyInvoice = (): InvoiceDraft => ({
  date: Date.now(), client: { name: '', phone: '', address: '', email: '' },
  items: [{ desc: '', qty: 1, rate: 0 }], discount: 0, advance: 0, method: 'Cash', status: 'unpaid', notes: '',
});

export function totals(inv: InvoiceDraft) {
  const subtotal = inv.items.reduce((s, i) => s + Math.round(i.qty * i.rate), 0);
  const standard = inv.items.reduce((s, i) => s + Math.round(i.qty * (i.std && i.std > i.rate ? i.std : i.rate)), 0);
  const saving = standard - subtotal;
  const total = Math.max(0, subtotal - inv.discount);
  const balance = inv.status === 'paid' ? 0 : Math.max(0, total - inv.advance);
  return { subtotal, standard, saving, total, balance };
}

const n = (v: number) => v.toLocaleString('en-US');
const dateStr = (ms: number) => new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Colombo' });

let logoCache: Promise<string | null> | null = null;
const loadLogo = () => (logoCache ||= fetch('/logo.png').then(r => r.blob()).then(b => new Promise<string | null>(res => {
  const fr = new FileReader(); fr.onload = () => res(String(fr.result)); fr.onerror = () => res(null); fr.readAsDataURL(b);
})).catch(() => null));

/** Builds the A4 invoice and saves it as "Studio-Alora-SA-0001-Client.pdf". */
export async function downloadInvoicePdf(inv: InvoiceDraft) {
  const [{ jsPDF }, logo] = await Promise.all([import('jspdf'), loadLogo()]);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210, M = 18, R = W - M;
  const gold: [number, number, number] = [166, 120, 72], ink: [number, number, number] = [20, 16, 12], grey: [number, number, number] = [120, 115, 108];
  const t = totals(inv);
  const text = (s: string, x: number, y: number, o: { size?: number; bold?: boolean; color?: [number, number, number]; align?: 'left' | 'right' | 'center' } = {}) => {
    doc.setFont('helvetica', o.bold ? 'bold' : 'normal'); doc.setFontSize(o.size ?? 10); doc.setTextColor(...(o.color ?? ink));
    doc.text(s, x, y, { align: o.align ?? 'left' });
  };
  const label = (s: string, x: number, y: number, align: 'left' | 'right' = 'left') => { doc.setCharSpace(0.4); text(s.toUpperCase(), x, y, { size: 7.5, bold: true, color: grey, align }); doc.setCharSpace(0); };
  const rule = (y: number, color: [number, number, number] = [225, 220, 212], w = 0.2) => { doc.setDrawColor(...color); doc.setLineWidth(w); doc.line(M, y, R, y); };

  // Header
  if (logo) doc.addImage(logo, 'PNG', M, 16, 46, 46 * (305 / 900)); else text('STUDIO ALORA', M, 26, { size: 20, bold: true });
  text('INVOICE', R, 24, { size: 22, bold: true, align: 'right' });
  text(inv.number || 'DRAFT', R, 31, { size: 11, bold: true, color: gold, align: 'right' });
  text(dateStr(inv.date), R, 36.5, { size: 9.5, color: grey, align: 'right' });
  rule(44, gold, 0.6);

  // Parties
  let y = 54;
  label('From', M, y); label('Billed to', 112, y);
  text(STUDIO_NAME, M, y + 6, { size: 10.5, bold: true });
  const from = [...doc.splitTextToSize(ADDRESS, 78), HOTLINE, EMAIL] as string[];
  from.forEach((l, i) => text(l, M, y + 11.5 + i * 4.8, { size: 9.5, color: grey }));
  text(inv.client.name || '—', 112, y + 6, { size: 10.5, bold: true });
  const to = [inv.client.phone, ...(inv.client.address ? doc.splitTextToSize(inv.client.address, 78) as string[] : []), inv.client.email].filter(Boolean);
  to.forEach((l, i) => text(l, 112, y + 11.5 + i * 4.8, { size: 9.5, color: grey }));
  y += 14 + Math.max(from.length, to.length) * 4.8 + 6;

  // Items
  const twoRates = inv.items.some(i => i.std && i.std > i.rate);
  const cQty = twoRates ? 104 : 128, cStd = 132, cRate = 160, descW = twoRates ? 70 : 92;
  doc.setFillColor(...ink); doc.rect(M, y, R - M, 8, 'F');
  const head = (s: string, x: number, align: 'left' | 'right' = 'left') => text(s, x, y + 5.3, { size: 7.5, bold: true, color: [255, 255, 255], align });
  head('DESCRIPTION', M + 3); head('QTY / HRS', cQty, 'right');
  if (twoRates) { head('STANDARD RATE', cStd, 'right'); head('YOUR RATE', cRate, 'right'); } else head('RATE (LKR)', cRate, 'right');
  head('AMOUNT (LKR)', R - 3, 'right');
  y += 8;
  for (const it of inv.items) {
    const lines = doc.splitTextToSize(it.desc, descW) as string[];
    const h = Math.max(9, lines.length * 4.6 + 4.4);
    if (y + h > 250) { doc.addPage(); y = 20; }
    lines.forEach((l, i) => text(l, M + 3, y + 6 + i * 4.6, { size: 9.5 }));
    text(String(it.qty), cQty, y + 6, { size: 9.5, align: 'right' });
    const disc = Boolean(it.std && it.std > it.rate);
    if (twoRates) {
      text(rateStr(disc ? it.std! : it.rate), cStd, y + 6, { size: 9.5, color: disc ? grey : ink, align: 'right' });
      if (disc) { const w = doc.getTextWidth(rateStr(it.std!)); doc.setDrawColor(...grey); doc.setLineWidth(0.25); doc.line(cStd - w, y + 5, cStd, y + 5); }
      text(disc ? rateStr(it.rate) : '', cRate, y + 6, { size: 9.5, bold: true, color: gold, align: 'right' });
    } else text(rateStr(it.rate), cRate, y + 6, { size: 9.5, align: 'right' });
    text(n(Math.round(it.qty * it.rate)), R - 3, y + 6, { size: 9.5, bold: true, align: 'right' });
    y += h; rule(y);
  }

  // Totals
  if (y > 215) { doc.addPage(); y = 20; }
  y += 12;
  const row = (l: string, v: string, bold = false) => { text(l, 120, y, { size: 9.5, color: bold ? ink : grey, bold }); text(v, R - 3, y, { size: 9.5, bold, align: 'right' }); y += 6.2; };
  const top = y;
  if (t.saving > 0) { row('Total at standard rates', `${n(t.standard)} LKR`); row('You save', `- ${n(t.saving)} LKR`, true); }
  else row('Subtotal', `${n(t.subtotal)} LKR`);
  if (inv.discount > 0) row(t.saving > 0 ? 'Additional discount' : 'Discount', `- ${n(inv.discount)} LKR`);
  row('Total', `${n(t.total)} LKR`, true);
  if (inv.status !== 'paid' && inv.advance > 0) row('Advance paid', `- ${n(inv.advance)} LKR`);
  y += 1;
  doc.setFillColor(...gold); doc.rect(118, y - 4.6, R - 118, 10, 'F');
  text(inv.status === 'paid' ? 'PAID IN FULL' : 'BALANCE DUE', 122, y + 1.8, { size: 9, bold: true, color: [255, 255, 255] });
  text(`${n(inv.status === 'paid' ? t.total : t.balance)} LKR`, R - 3, y + 1.8, { size: 12, bold: true, color: [255, 255, 255], align: 'right' });
  const afterTotals = y + 12;

  // Payment details (left of totals)
  y = top;
  label('Payment details', M, y - 1);
  [['Bank', BANK.bank], ['Account name', BANK.name], ['Account number', BANK.account], ['Method', inv.method || '—']].forEach(([l, v], i) => {
    text(l, M, y + 5 + i * 5.4, { size: 9, color: grey }); text(v, M + 30, y + 5 + i * 5.4, { size: 9.5, bold: true });
  });
  y = Math.max(afterTotals, top + 30);

  if (inv.notes) {
    y += 4; label('Notes', M, y);
    (doc.splitTextToSize(inv.notes, R - M) as string[]).forEach((l, i) => text(l, M, y + 5.5 + i * 4.8, { size: 9.5, color: grey }));
  }

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p); rule(280);
    text('Thank you for choosing Studio Alora', M, 286, { size: 8.5, color: grey });
    text(SITE_HOST, R, 286, { size: 8.5, bold: true, color: gold, align: 'right' });
  }
  const safe = (inv.client.name || 'invoice').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  doc.save(`Studio-Alora-${inv.number || 'draft'}-${safe}.pdf`);
}
