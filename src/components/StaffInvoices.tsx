import React, { useEffect, useMemo, useState } from 'react';
import { Download, Loader2, Plus, Search, Trash2, X } from 'lucide-react';
import { glass, field, label, primaryBtn, ghostBtn } from './Shell';
import { api } from '../lib/packages';
import { Invoice, InvoiceDraft, emptyInvoice, totals, downloadInvoicePdf } from '../lib/invoices';
import { RATES, PACKAGES, lkr } from '../lib/site';
import { cn } from '../lib/utils';

const PRESETS: { label: string; item: { desc: string; qty: number; rate: number } }[] = [
  { label: '1 hr · Non-comm', item: { desc: 'Studio session – Non-commercial, 1 hour', qty: 1, rate: RATES.nonCommercial.firstHour } },
  { label: 'Hours · Non-comm', item: { desc: 'Studio session – Non-commercial (hours)', qty: 2, rate: RATES.nonCommercial.perHour } },
  { label: '1 hr · Commercial', item: { desc: 'Studio session – Commercial, 1 hour', qty: 1, rate: RATES.commercial.firstHour } },
  { label: 'Hours · Commercial', item: { desc: 'Studio session – Commercial (hours)', qty: 2, rate: RATES.commercial.perHour } },
  ...PACKAGES.flatMap(p => (['nonCommercial', 'commercial'] as const).map(k => ({
    label: `${p.hours} hr pkg · ${k === 'commercial' ? 'Comm' : 'Non-comm'}`,
    item: { desc: `Monthly package – ${p.hours} hours (${RATES[k].label})`, qty: p.hours, rate: p.rate[k] },
  }))),
  { label: 'Pet fee', item: { desc: 'Pet fee (per pet)', qty: 1, rate: 4500 } },
  { label: 'Cleaning fee', item: { desc: 'Cleaning fee', qty: 1, rate: 2500 } },
];

const dateInput = (ms: number) => new Date(ms - new Date(ms).getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const shortDate = (ms: number) => new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const ERR: Record<string, string> = { bad_input: 'Add the client name and at least one line with a description.', not_configured: 'The database is not connected in Vercel.', bad_pin: 'PIN expired. Reload the page and sign in again.' };

export function StaffInvoices({ pin }: { pin: string }) {
  const [list, setList] = useState<Invoice[] | null>(null);
  const [draft, setDraft] = useState<InvoiceDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [only, setOnly] = useState<'all' | 'unpaid'>('all');
  const [confirmDel, setConfirmDel] = useState(false);

  const call = async (body: Record<string, unknown>) => {
    setBusy(true); setError('');
    try {
      const r = await api<{ invoices: Invoice[]; saved: Invoice | null }>('invoice-admin', { pin, ...body });
      setBusy(false);
      if (!r.ok) { setError(ERR[r.error || ''] || 'Something went wrong. Try again.'); return null; }
      setList(r.invoices);
      return r;
    } catch { setBusy(false); setError('No connection. Try again.'); return null; }
  };
  useEffect(() => { call({ action: 'list' }); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const shown = useMemo(() => (list || []).filter(i =>
    (only === 'all' || i.status === 'unpaid') &&
    (!q || `${i.number} ${i.client.name} ${i.client.phone}`.toLowerCase().includes(q.toLowerCase()))), [list, q, only]);
  const outstanding = useMemo(() => (list || []).reduce((s, i) => s + totals(i).balance, 0), [list]);

  if (draft) {
    const t = totals(draft);
    const set = (patch: Partial<InvoiceDraft>) => setDraft({ ...draft, ...patch });
    const setClient = (k: keyof InvoiceDraft['client']) => (e: React.ChangeEvent<HTMLInputElement>) => set({ client: { ...draft.client, [k]: e.target.value } });
    const setItem = (i: number, patch: Partial<InvoiceDraft['items'][number]>) => set({ items: draft.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) });
    const addItem = (item = { desc: '', qty: 1, rate: 0 }) => set({ items: [...draft.items.filter(i => i.desc || i.rate), item] });
    const save = async (thenDownload: boolean) => {
      const r = await call({ action: 'save', invoice: draft });
      if (!r?.saved) return;
      setDraft(r.saved);
      if (thenDownload) await downloadInvoicePdf(r.saved);
    };
    return (
      <form onSubmit={e => { e.preventDefault(); save(false); }} className={`${glass} p-6 sm:p-8 space-y-5 max-w-3xl mx-auto w-full`}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#C4956A]">{draft.number ? `Invoice ${draft.number}` : 'New Invoice'}</p>
          <button type="button" onClick={() => { setDraft(null); setError(''); setConfirmDel(false); }} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white"><X size={14} /> Close</button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5 min-w-0"><label htmlFor="i-name" className={label}>Client or Brand</label>
            <input id="i-name" required className={field} value={draft.client.name} onChange={setClient('name')} /></div>
          <div className="space-y-1.5 min-w-0"><label htmlFor="i-phone" className={label}>Phone</label>
            <input id="i-phone" type="tel" className={`${field} font-mono`} value={draft.client.phone} onChange={setClient('phone')} /></div>
          <div className="space-y-1.5 min-w-0"><label htmlFor="i-addr" className={label}>Address (optional)</label>
            <input id="i-addr" className={field} value={draft.client.address} onChange={setClient('address')} /></div>
          <div className="space-y-1.5 min-w-0"><label htmlFor="i-email" className={label}>Email (optional)</label>
            <input id="i-email" type="email" className={field} value={draft.client.email} onChange={setClient('email')} /></div>
          <div className="space-y-1.5 min-w-0"><label htmlFor="i-date" className={label}>Invoice Date</label>
            <input id="i-date" type="date" required className={field} value={dateInput(draft.date)} onChange={e => e.target.value && set({ date: new Date(`${e.target.value}T12:00:00`).getTime() })} /></div>
          <div className="space-y-1.5 min-w-0"><label htmlFor="i-method" className={label}>Payment Method</label>
            <select id="i-method" className={field} value={draft.method} onChange={e => set({ method: e.target.value })}>
              {[...new Set(['Cash', 'Bank Transfer', 'Monthly Package', draft.method])].filter(Boolean).map(m => <option key={m} className="bg-[#1a1512]">{m}</option>)}
            </select></div>
        </div>

        <div className="space-y-3">
          <p className={label}>Lines</p>
          {draft.items.map((it, i) => (
            <div key={i} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-3 space-y-2">
              <div className="flex gap-2">
                <input aria-label={`Line ${i + 1} description`} placeholder="Description" className={`${field} py-3`} value={it.desc} onChange={e => setItem(i, { desc: e.target.value })} />
                <button type="button" aria-label={`Remove line ${i + 1}`} disabled={draft.items.length === 1} onClick={() => set({ items: draft.items.filter((_, j) => j !== i) })}
                  className="shrink-0 w-11 rounded-2xl border border-white/[0.08] text-white/40 hover:text-red-400 disabled:opacity-30 flex items-center justify-center"><Trash2 size={15} /></button>
              </div>
              <div className="grid grid-cols-3 gap-2 items-end">
                <div className="space-y-1 min-w-0"><label htmlFor={`i-q${i}`} className={label}>Qty / Hrs</label>
                  <input id={`i-q${i}`} type="number" min={0} step={0.5} className={`${field} py-3`} value={it.qty} onChange={e => setItem(i, { qty: Number(e.target.value) })} /></div>
                <div className="space-y-1 min-w-0"><label htmlFor={`i-r${i}`} className={label}>Rate</label>
                  <input id={`i-r${i}`} type="number" min={0} className={`${field} py-3`} value={it.rate || ''} onChange={e => setItem(i, { rate: Number(e.target.value) })} /></div>
                <p className="text-right text-sm font-black tabular-nums text-[#C4956A] pb-3">{lkr(Math.round(it.qty * it.rate))}</p>
              </div>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => addItem()} className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#C4956A] text-black text-[10px] font-black uppercase tracking-widest"><Plus size={13} /> Blank line</button>
            {PRESETS.map(p => (
              <button key={p.label} type="button" onClick={() => addItem({ ...p.item })}
                className="px-3 py-2 rounded-xl border border-white/[0.1] bg-white/[0.04] text-white/60 hover:border-[#C4956A]/40 hover:text-white text-[10px] font-black uppercase tracking-wide">{p.label}</button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5 min-w-0"><label htmlFor="i-disc" className={label}>Discount (LKR)</label>
            <input id="i-disc" type="number" min={0} className={field} value={draft.discount || ''} onChange={e => set({ discount: Number(e.target.value) })} /></div>
          <div className="space-y-1.5 min-w-0"><label htmlFor="i-adv" className={label}>Advance Already Paid (LKR)</label>
            <input id="i-adv" type="number" min={0} className={field} value={draft.advance || ''} onChange={e => set({ advance: Number(e.target.value) })} /></div>
        </div>
        <div className="space-y-1.5"><label htmlFor="i-notes" className={label}>Notes (optional)</label>
          <textarea id="i-notes" rows={2} className={field} value={draft.notes} onChange={e => set({ notes: e.target.value })} /></div>

        <div className="flex rounded-2xl border border-white/[0.08] overflow-hidden bg-white/[0.03]">
          {(['unpaid', 'paid'] as const).map(s => (
            <button key={s} type="button" aria-pressed={draft.status === s} onClick={() => set({ status: s })}
              className={cn('flex-1 py-3 text-[10px] font-black uppercase tracking-widest', draft.status === s ? 'bg-[#C4956A] text-black' : 'text-white/40')}>{s}</button>
          ))}
        </div>

        <div className="bg-white/[0.04] border border-[#C4956A]/10 p-5 rounded-2xl space-y-2">
          <div className="flex justify-between text-xs font-bold text-white/40 uppercase"><span>Subtotal</span><span>{lkr(t.subtotal)}</span></div>
          <div className="flex justify-between text-xs font-bold text-white/40 uppercase"><span>Total</span><span className="text-[#F0EDE8]">{lkr(t.total)}</span></div>
          <div className="pt-2 border-t border-[#C4956A]/10 flex justify-between items-center">
            <span className="text-black bg-[#C4956A] px-2 py-0.5 rounded font-black uppercase text-[10px] tracking-widest">{draft.status === 'paid' ? 'Paid in full' : 'Balance due'}</span>
            <span className="text-2xl font-black italic tabular-nums text-[#C4956A]">{lkr(draft.status === 'paid' ? t.total : t.balance)}</span>
          </div>
        </div>

        {error && <p role="alert" className="text-red-400 text-xs font-bold text-center">{error}</p>}
        <div className="grid sm:grid-cols-2 gap-3">
          <button type="submit" disabled={busy} className={ghostBtn + ' py-4'}>{busy ? <Loader2 size={16} className="animate-spin" /> : null} Save</button>
          <button type="button" disabled={busy} onClick={() => save(true)} className={primaryBtn + ' py-4'}><Download size={20} /> Save & Download PDF</button>
        </div>
        {draft.id && (confirmDel ? (
          <div className="flex gap-2">
            <button type="button" className={`${ghostBtn} border-red-500/40 text-red-400`} onClick={async () => { if (await call({ action: 'delete', id: draft.id })) { setDraft(null); setConfirmDel(false); } }}>Yes, delete this invoice</button>
            <button type="button" className={ghostBtn} onClick={() => setConfirmDel(false)}>Keep</button>
          </div>
        ) : (
          <button type="button" className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-red-400" onClick={() => setConfirmDel(true)}><Trash2 size={12} /> Delete invoice</button>
        ))}
      </form>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto w-full">
      <div className={`${glass} p-5 space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className={label}>Outstanding</p>
            <p className="text-2xl font-black italic tabular-nums text-[#C4956A]">{lkr(outstanding)}</p>
          </div>
          <button type="button" onClick={() => setDraft(emptyInvoice())} className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#C4956A] text-black font-black uppercase tracking-tighter"><Plus size={18} /> New Invoice</button>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
            <input aria-label="Search invoices" placeholder="Search number, name or phone" className={`${field} py-3 pl-11`} value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <button type="button" aria-pressed={only === 'unpaid'} onClick={() => setOnly(only === 'all' ? 'unpaid' : 'all')}
            className={cn('shrink-0 px-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest', only === 'unpaid' ? 'bg-[#C4956A] text-black border-[#C4956A]' : 'border-white/[0.1] text-white/50')}>Unpaid only</button>
        </div>
      </div>
      {error && <p role="alert" className="text-red-400 text-sm font-bold text-center">{error}</p>}
      {!list && busy && <p className="text-center text-white/40 py-8"><Loader2 className="inline animate-spin" size={20} /></p>}
      {list && shown.length === 0 && <div className={`${glass} p-8 text-center text-white/50 font-bold`}>{list.length === 0 ? 'No invoices yet. One is created automatically after each session.' : 'No invoices match.'}</div>}
      <ul className="space-y-2">
        {shown.map(i => { const t = totals(i); return (
          <li key={i.id} className={`${glass} rounded-2xl flex items-stretch`}>
            <button type="button" onClick={() => setDraft(i)} className="flex-1 min-w-0 text-left px-4 py-3 space-y-1 focus:outline-none focus:ring-2 focus:ring-[#C4956A] rounded-l-2xl">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest text-[#C4956A]">{i.number}</span>
                <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest', i.status === 'paid' ? 'bg-white/10 text-white/60' : 'bg-amber-500/15 text-amber-400')}>{i.status}</span>
                {i.source === 'session' && <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Session</span>}
              </div>
              <p className="font-black uppercase tracking-tight truncate">{i.client.name}</p>
              <p className="text-xs text-white/45">{shortDate(i.date)} · {lkr(t.total)}{t.balance > 0 ? ` · ${lkr(t.balance)} due` : ''}</p>
            </button>
            <button type="button" aria-label={`Download ${i.number} as PDF`} onClick={() => downloadInvoicePdf(i)}
              className="shrink-0 w-14 flex items-center justify-center border-l border-white/[0.08] text-white/50 hover:text-[#C4956A]"><Download size={18} /></button>
          </li>
        ); })}
      </ul>
    </div>
  );
}
