import React, { useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { PageShell, KindToggle, glass, field, label, primaryBtn, ghostBtn } from '../components/Shell';
import { PackageCard } from '../components/PackageCard';
import { api, StaffPackage } from '../lib/packages';
import { PACKAGES, SessionKind, lkr } from '../lib/site';

const ERRORS: Record<string, string> = {
  bad_pin: 'Incorrect PIN.',
  pin_not_configured: 'STAFF_PIN is not set in Vercel yet.',
  not_configured: 'The database is not connected in Vercel yet.',
  bad_input: 'Check the details and try again.',
};

export default function Staff() {
  const [pin, setPin] = useState('');
  const [list, setList] = useState<StaffPackage[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [kind, setKind] = useState<SessionKind>('nonCommercial');
  const [f, setF] = useState({ name: '', phone: '', hours: '10', rate: '' });
  const [adjust, setAdjust] = useState<Record<string, string>>({});
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const tier = PACKAGES.find(p => String(p.hours) === f.hours);
  const rate = Number(f.rate) || (tier ? tier.rate[kind] : 0);

  const call = async (body: Record<string, unknown>) => {
    setBusy(true); setError('');
    try {
      const r = await api<{ packages: StaffPackage[] }>('package-admin', { pin, ...body });
      if (!r.ok) { setError(ERRORS[r.error || ''] || 'Something went wrong. Try again.'); setBusy(false); return false; }
      setList(r.packages);
    } catch { setError('No connection. Try again.'); setBusy(false); return false; }
    setBusy(false);
    return true;
  };

  if (!list) {
    return (
      <PageShell title="Staff" kicker="Monthly package records">
        <form onSubmit={e => { e.preventDefault(); call({ action: 'list' }); }} className={`${glass} p-8 space-y-4`}>
          <div className="space-y-1.5"><label htmlFor="s-pin" className={label}>Staff PIN</label>
            <input id="s-pin" required type="password" inputMode="numeric" autoComplete="off" className={`${field} text-center text-2xl font-black tracking-[0.5em]`}
              value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))} /></div>
          <button type="submit" disabled={busy} className={primaryBtn}>{busy ? <Loader2 size={20} className="animate-spin" /> : null} Open</button>
          {error && <p role="alert" className="text-red-400 text-xs font-bold text-center">{error}</p>}
        </form>
      </PageShell>
    );
  }

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await call({ action: 'create', name: f.name, phone: f.phone, kind, hours: Number(f.hours), rate })) setF({ name: '', phone: '', hours: '10', rate: '' });
  };

  return (
    <PageShell wide title="Staff" kicker="Monthly package records">
      {error && <p role="alert" className="text-red-400 text-sm font-bold text-center">{error}</p>}
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <form onSubmit={create} className={`${glass} p-6 sm:p-8 space-y-4`}>
          <p className="text-[11px] font-black uppercase tracking-widest text-[#C4956A]">New Package</p>
          <KindToggle value={kind} onChange={setKind} />
          <div className="space-y-1.5"><label htmlFor="s-name" className={label}>Customer or Brand</label>
            <input id="s-name" required className={field} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></div>
          <div className="space-y-1.5"><label htmlFor="s-phone" className={label}>Phone (the number they check in with)</label>
            <input id="s-phone" required type="tel" className={`${field} font-mono`} value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 min-w-0"><label htmlFor="s-hours" className={label}>Hours</label>
              <input id="s-hours" required type="number" min={1} max={500} step={0.5} className={field} value={f.hours} onChange={e => setF({ ...f, hours: e.target.value })} /></div>
            <div className="space-y-1.5 min-w-0"><label htmlFor="s-rate" className={label}>Rate / hr (LKR)</label>
              <input id="s-rate" type="number" min={1} placeholder={tier ? String(tier.rate[kind]) : 'Custom'} required={!tier} className={field} value={f.rate} onChange={e => setF({ ...f, rate: e.target.value })} /></div>
          </div>
          <p className="text-sm text-white/50">Total to collect: <span className="font-black text-[#C4956A]">{lkr(rate * (Number(f.hours) || 0))}</span></p>
          <button type="submit" disabled={busy} className={primaryBtn}><Plus size={20} /> Add Package</button>
        </form>

        <div className="space-y-4">
          {list.length === 0 && <div className={`${glass} p-8 text-center text-white/50 font-bold`}>No packages yet.</div>}
          {list.map(p => (
            <div key={p.id} className={`${glass} p-6`}>
              <PackageCard p={p}>
                <p className="text-xs font-mono text-white/40">0{p.phone}</p>
                <div className="flex gap-2">
                  <input aria-label="Hours to add or remove" type="number" step={0.5} placeholder="± hours" className={`${field} py-3`}
                    value={adjust[p.id] || ''} onChange={e => setAdjust({ ...adjust, [p.id]: e.target.value })} />
                  <button type="button" disabled={busy || !Number(adjust[p.id])} className="shrink-0 px-4 rounded-2xl border border-white/[0.12] bg-white/[0.04] text-white/70 hover:border-[#C4956A]/40 font-bold uppercase tracking-widest text-[11px] disabled:opacity-40"
                    onClick={async () => { if (await call({ action: 'adjust', id: p.id, hours: Number(adjust[p.id]) })) setAdjust({ ...adjust, [p.id]: '' }); }}>
                    Adjust Used
                  </button>
                </div>
                <p className="text-[10px] text-white/30">Enter 2 to add two used hours, or -2 to give two back.</p>
                {confirmDel === p.id ? (
                  <div className="flex gap-2">
                    <button type="button" className={`${ghostBtn} border-red-500/40 text-red-400`} onClick={async () => { await call({ action: 'delete', id: p.id }); setConfirmDel(null); }}>Yes, delete</button>
                    <button type="button" className={ghostBtn} onClick={() => setConfirmDel(null)}>Keep</button>
                  </div>
                ) : (
                  <button type="button" className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-red-400" onClick={() => setConfirmDel(p.id)}><Trash2 size={12} /> Delete package</button>
                )}
              </PackageCard>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
