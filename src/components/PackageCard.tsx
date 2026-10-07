import React from 'react';
import { PackageView, hrs, day, daysLeft } from '../lib/packages';
import { RATES, lkr } from '../lib/site';

/** Hours bought, used and left, with the session list. Used on My Hours and the staff page. */
export function PackageCard({ p, children }: { p: PackageView; children?: React.ReactNode }) {
  const pct = Math.min(100, (p.used / p.hours) * 100);
  const d = daysLeft(p);
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-black uppercase tracking-tight truncate">{p.name}</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{RATES[p.kind].label} · {hrs(p.hours)} at {lkr(p.rate)}/hr</p>
        </div>
        <span className={`shrink-0 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${p.expired ? 'bg-red-500/15 text-red-400' : 'bg-[#C4956A] text-black'}`}>
          {p.expired ? 'Expired' : p.startedAt ? `${d} day${d === 1 ? '' : 's'} left` : 'Not started'}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[['Bought', p.hours], ['Used', p.used], ['Left', p.left]].map(([l, v], i) => (
          <div key={l} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl py-3">
            <p className={`text-2xl font-black tabular-nums ${i === 2 ? 'text-[#C4956A]' : ''}`}>{v}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-white/35">{l} · hrs</p>
          </div>
        ))}
      </div>
      <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Hours used">
        <div className="h-full bg-[#C4956A]" style={{ width: `${pct}%` }} />
      </div>
      {p.extra > 0 && (
        <p className="text-amber-400 text-xs font-bold bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
          {hrs(p.extra)} over the package, charged at {lkr(p.rate)}/hr ({lkr(p.extra * p.rate)} in total).
        </p>
      )}
      <p className="text-xs text-white/45">
        {p.startedAt && p.expiresAt ? `Started ${day(p.startedAt)} · valid until ${day(p.expiresAt)}` : 'The 30 days start with the first session.'}
      </p>
      {p.sessions.length > 0 && (
        <ul className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
          {[...p.sessions].reverse().map((s, i) => (
            <li key={i} className="flex justify-between gap-3 py-2 text-sm">
              <span className="text-white/60">{day(s.at)}{s.note ? ` · ${s.note}` : ''}</span>
              <span className="font-black tabular-nums">{s.hours > 0 ? '' : '−'}{hrs(Math.abs(s.hours))}</span>
            </li>
          ))}
        </ul>
      )}
      {children}
    </div>
  );
}
