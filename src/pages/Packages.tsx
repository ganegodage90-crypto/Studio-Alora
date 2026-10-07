import React, { useState } from 'react';
import { MessageCircle, CheckCircle2, Check } from 'lucide-react';
import { PageShell, Toggle, glass, field, label, primaryBtn, ghostBtn } from '../components/Shell';
import { Section } from '../components/Blocks';
import { PACKAGES, RATES, SessionKind, lkr, waLink } from '../lib/site';
import { saveRequest } from '../lib/requests';
import { cn } from '../lib/utils';

const CONDITIONS: [string, string][] = [
  ['Paid in full, in advance', 'The package is bought and paid for in full before the first session.'],
  ['Valid for 30 days', 'Hours run for 30 days from your first session. Unused hours expire and are not refunded or carried over.'],
  ['Reserve your dates', 'Share your time frame for the month when you buy, and we reserve the dates. Slots are subject to availability until reserved.'],
  ['Extra hours', 'Hours beyond your package are counted and charged at your package hourly rate, payable at the end of that session.'],
  ['Changing a slot', 'A reserved slot can be moved with at least 72 hours notice. Late cancellations and no-shows use up the reserved hours.'],
  ['How hours are counted', 'Minimum session is 1 hour, counted in 30-minute steps. Each hour after 8:00 PM counts as 1.5 hours.'],
  ['Not transferable', 'A package is for one photographer or brand. Hours cannot be shared, sublet or resold.'],
  ['No refunds once started', 'A package cannot be refunded after its first session.'],
  ['Studio rules apply', 'All studio rules and rental terms apply to every session, including the 6-person limit for non-commercial use.'],
];

const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

export default function Packages() {
  const [kind, setKind] = useState<SessionKind>('nonCommercial');
  const [pkgId, setPkgId] = useState<string>('20');
  const [openHours, setOpenHours] = useState(30);
  const [f, setF] = useState({ name: '', phone: '', start: '', schedule: '' });
  const [agree, setAgree] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF(p => ({ ...p, [k]: e.target.value }));

  const pkg = PACKAGES.find(p => p.id === pkgId)!;
  const hours = pkg.open ? Math.max(30, Math.round(openHours) || 30) : pkg.hours;
  const rate = pkg.rate[kind];
  const total = hours * rate;
  const standard = RATES[kind].perHour;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = [
      '*STUDIO ALORA – MONTHLY PACKAGE REQUEST*',
      `Name / Brand: ${f.name}`,
      `Phone: ${f.phone}`,
      `Type: ${RATES[kind].label}`,
      `Package: ${hours} hours at ${lkr(rate)}/hr`,
      `Total: ${lkr(total)}`,
      `Start date: ${f.start}`,
      `Preferred days and times: ${f.schedule}`,
      'I accept the monthly package conditions.',
    ].join('\n');
    const url = waLink(msg);
    saveRequest('booking', { ...f, type: RATES[kind].label, package: `${hours} hours`, rate, total });
    setSent(url);
    window.open(url, '_blank', 'noopener');
  };

  return (
    <PageShell wide title="Monthly Packages" kicker="Buy hours in advance and save">
      <div className="max-w-lg mx-auto w-full">
        <Toggle value={kind} onChange={setKind} options={[{ value: 'nonCommercial', label: 'Non-Commercial' }, { value: 'commercial', label: 'Commercial' }]} />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {PACKAGES.map(p => {
          const r = p.rate[kind];
          const active = p.id === pkgId;
          return (
            <button key={p.id} type="button" onClick={() => setPkgId(p.id)} aria-pressed={active}
              className={cn(glass, 'p-6 text-left space-y-4 transition-all focus:outline-none focus:ring-2 focus:ring-[#C4956A]',
                active ? 'border-[#C4956A] bg-[#C4956A]/10' : 'hover:border-[#C4956A]/40')}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-widest text-white/50">{p.label} / month</span>
                <span className={cn('w-6 h-6 rounded-full border flex items-center justify-center', active ? 'bg-[#C4956A] border-[#C4956A] text-black' : 'border-white/20 text-transparent')}><Check size={14} strokeWidth={3} /></span>
              </div>
              <p className="text-3xl font-black italic tabular-nums text-[#C4956A]">{lkr(r)}<span className="text-sm font-bold not-italic text-white/40"> /hr</span></p>
              <p className="text-sm font-bold text-white/70">{p.open ? 'From ' : ''}{lkr(p.hours * r)}{p.open ? '' : ' total'}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/35">Save {lkr((standard - r) * p.hours)}{p.open ? ' or more' : ''} vs hourly</p>
            </button>
          );
        })}
      </div>
      <p className="text-center text-[10px] text-white/30 uppercase tracking-wider">{RATES[kind].note} · Savings compared with the standard {lkr(standard)}/hr rate</p>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <Section id="conditions" title="Package Conditions">
          <dl className="space-y-4">
            {CONDITIONS.map(([t, d]) => (
              <div key={t} className="space-y-1">
                <dt className="text-[11px] font-black uppercase tracking-widest text-[#F0EDE8]">{t}</dt>
                <dd className="text-sm text-white/50 leading-relaxed">{d}</dd>
              </div>
            ))}
          </dl>
        </Section>

        {sent ? (
          <div className={`${glass} p-10 text-center space-y-6`}>
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#C4956A]/10 border border-[#C4956A]/20 text-[#C4956A]"><CheckCircle2 size={48} /></div>
            <p className="text-white/60 font-bold leading-relaxed">WhatsApp opened with your package request. Press send there to reach us.<br />
              <span className="text-white/35 text-sm">Your package starts once we confirm your dates and payment is received.</span></p>
            <a href={sent} target="_blank" rel="noreferrer" className={primaryBtn}><MessageCircle size={22} /> Open WhatsApp Again</a>
            <button type="button" onClick={() => setSent(null)} className={ghostBtn}>Edit Request</button>
          </div>
        ) : (
          <form onSubmit={submit} className={`${glass} p-6 sm:p-8 space-y-4`}>
            <div className="bg-white/[0.04] border border-[#C4956A]/10 p-5 rounded-2xl space-y-3">
              <div className="flex justify-between gap-3 text-xs font-bold text-white/35 uppercase">
                <span>{RATES[kind].label} · {hours} hours</span><span className="text-[#C4956A] whitespace-nowrap">{lkr(rate)}/HR</span>
              </div>
              <div className="pt-3 border-t border-[#C4956A]/10 flex flex-wrap justify-between items-center gap-x-4 gap-y-2">
                <span className="text-black bg-[#C4956A] px-2 py-0.5 rounded font-black uppercase text-[10px] tracking-widest whitespace-nowrap">Package Total</span>
                <span className="text-3xl font-black italic tabular-nums text-[#C4956A] whitespace-nowrap ml-auto">{lkr(total)}</span>
              </div>
            </div>
            {pkg.open && (
              <div className="space-y-1.5"><label htmlFor="p-hours" className={label}>Hours This Month (30 or more)</label>
                <input id="p-hours" type="number" min={30} max={300} inputMode="numeric" className={field} value={openHours}
                  onChange={e => setOpenHours(Number(e.target.value))} /></div>
            )}
            <div className="space-y-1.5"><label htmlFor="p-name" className={label}>Name or Brand</label>
              <input id="p-name" required autoComplete="name" className={field} value={f.name} onChange={set('name')} /></div>
            <div className="space-y-1.5"><label htmlFor="p-phone" className={label}>Phone / WhatsApp</label>
              <input id="p-phone" required type="tel" autoComplete="tel" className={`${field} font-mono`} value={f.phone} onChange={set('phone')} /></div>
            <div className="space-y-1.5"><label htmlFor="p-start" className={label}>First Session Date</label>
              <input id="p-start" required type="date" min={today()} className={field} value={f.start} onChange={set('start')} /></div>
            <div className="space-y-1.5"><label htmlFor="p-sched" className={label}>Preferred Days And Times For The Month</label>
              <textarea id="p-sched" required rows={3} placeholder="e.g. Tuesdays and Saturdays, 9 AM to 12 PM" className={field} value={f.schedule} onChange={set('schedule')} /></div>
            <label className="flex items-start gap-3 text-xs text-white/50 leading-relaxed cursor-pointer py-2">
              <input type="checkbox" required checked={agree} onChange={e => setAgree(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#C4956A]" />
              <span>I accept the package conditions and the <a href="/rules" target="_blank" rel="noreferrer" className="text-[#C4956A] underline">studio rules</a>.</span>
            </label>
            <button type="submit" className={primaryBtn}><MessageCircle size={22} /> Request Package on WhatsApp</button>
          </form>
        )}
      </div>
    </PageShell>
  );
}
