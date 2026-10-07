import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageCircle, CheckCircle2 } from 'lucide-react';
import { PageShell, KindToggle, glass, field, label, primaryBtn, ghostBtn } from '../components/Shell';
import { Estimate, HOUR_OPTIONS } from '../components/Estimate';
import { RATES, SessionKind, priceFor, lkr, waLink, HOTLINE } from '../lib/site';
import { saveRequest } from '../lib/requests';

const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

export default function Book() {
  const [params] = useSearchParams();
  const [kind, setKind] = useState<SessionKind>(params.get('type') === 'commercial' ? 'commercial' : 'nonCommercial');
  const [hours, setHours] = useState(() => { const h = Number(params.get('hours')); return HOUR_OPTIONS.includes(h) ? h : 2; });
  const [f, setF] = useState({ name: '', phone: '', date: '', time: '', pax: '', shoot: '', notes: '' });
  const [agree, setAgree] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF(p => ({ ...p, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = priceFor(hours, kind);
    const msg = [
      '*STUDIO ALORA – BOOKING REQUEST*',
      `Name / Brand: ${f.name}`,
      `Phone: ${f.phone}`,
      `Type: ${RATES[kind].label}`,
      `Date: ${f.date}`,
      `Start time: ${f.time}`,
      `Duration: ${hours} hour${hours === 1 ? '' : 's'}`,
      `People: ${f.pax}`,
      f.shoot && `Shoot: ${f.shoot}`,
      f.notes && `Notes: ${f.notes}`,
      `Estimate: ${lkr(p.subtotal)} (50% deposit ${lkr(Math.round(p.subtotal / 2))})`,
    ].filter(Boolean).join('\n');
    const url = waLink(msg);
    saveRequest('booking', { ...f, type: RATES[kind].label, hours, estimate: p.subtotal });
    setSent(url);
    window.open(url, '_blank', 'noopener');
  };

  if (sent) {
    return (
      <PageShell title="Request Ready" kicker="One more step on WhatsApp">
        <div className={`${glass} p-10 text-center space-y-6`}>
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#C4956A]/10 border border-[#C4956A]/20 text-[#C4956A]"><CheckCircle2 size={48} /></div>
          <p className="text-white/60 font-bold leading-relaxed">
            WhatsApp opened with your booking details. Press send there to reach us.<br />
            <span className="text-white/35 text-sm">Your slot is confirmed once we reply and the 50% deposit is paid.</span>
          </p>
          <a href={sent} target="_blank" rel="noreferrer" className={primaryBtn}><MessageCircle size={22} /> Open WhatsApp Again</a>
          <button type="button" onClick={() => setSent(null)} className={ghostBtn}>Edit Request</button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Book The Studio" kicker="Send a booking request">
      <form onSubmit={submit} className={`${glass} p-8 space-y-6`}>
        <KindToggle value={kind} onChange={setKind} />
        <div className="space-y-4">
          <div className="space-y-1.5 min-w-0"><label htmlFor="b-name" className={label}>Name or Brand</label>
            <input id="b-name" required autoComplete="name" className={field} value={f.name} onChange={set('name')} /></div>
          <div className="space-y-1.5 min-w-0"><label htmlFor="b-phone" className={label}>Phone / WhatsApp</label>
            <input id="b-phone" required type="tel" autoComplete="tel" className={`${field} font-mono`} value={f.phone} onChange={set('phone')} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 min-w-0"><label htmlFor="b-date" className={label}>Date</label>
              <input id="b-date" required type="date" min={today()} className={field} value={f.date} onChange={set('date')} /></div>
            <div className="space-y-1.5 min-w-0"><label htmlFor="b-time" className={label}>Start Time</label>
              <input id="b-time" required type="time" className={field} value={f.time} onChange={set('time')} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 min-w-0"><label htmlFor="b-hours" className={label}>Duration</label>
              <select id="b-hours" className={field} value={hours} onChange={e => setHours(Number(e.target.value))}>
                {HOUR_OPTIONS.map(h => <option key={h} value={h} className="bg-[#1a1512]">{h} hour{h === 1 ? '' : 's'}</option>)}
              </select></div>
            <div className="space-y-1.5 min-w-0"><label htmlFor="b-pax" className={label}>People (incl. crew)</label>
              <input id="b-pax" required type="number" min={1} max={40} inputMode="numeric" className={field} value={f.pax}
                onChange={e => { set('pax')(e); const n = Number(e.target.value); if (n > 0) setKind(n > 6 ? 'commercial' : 'nonCommercial'); }} /></div>
          </div>
          <div className="space-y-1.5 min-w-0"><label htmlFor="b-shoot" className={label}>Type of Shoot (optional)</label>
            <input id="b-shoot" placeholder="Portrait, product, fashion, video…" className={field} value={f.shoot} onChange={set('shoot')} /></div>
          <div className="space-y-1.5 min-w-0"><label htmlFor="b-notes" className={label}>Notes (optional)</label>
            <textarea id="b-notes" rows={3} placeholder="Backdrop colours, pets, extra equipment…" className={field} value={f.notes} onChange={set('notes')} /></div>
        </div>

        <Estimate kind={kind} hours={hours} />

        <label className="flex items-start gap-3 text-xs text-white/50 leading-relaxed cursor-pointer">
          <input type="checkbox" required checked={agree} onChange={e => setAgree(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#C4956A]" />
          <span>I have read the <a href="/rules" target="_blank" rel="noreferrer" className="text-[#C4956A] underline">studio rules and rental terms</a>. Cancellations within 72 hours of the booking are not refunded.</span>
        </label>

        <button type="submit" className={primaryBtn}><MessageCircle size={22} /> Send Request on WhatsApp</button>
        <a href={`tel:${HOTLINE.replace(/\s/g, '')}`} className={ghostBtn}>Or call the hotline · {HOTLINE}</a>
      </form>
    </PageShell>
  );
}
