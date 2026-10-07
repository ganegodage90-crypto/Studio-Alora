import { RATES, SessionKind, priceFor, lkr } from '../lib/site';

export const HOUR_OPTIONS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8];

export function Estimate({ kind, hours }: { kind: SessionKind; hours: number }) {
  const r = RATES[kind];
  const p = priceFor(hours, kind);
  return (
    <div className="bg-white/[0.04] border border-[#C4956A]/10 p-5 rounded-2xl space-y-3">
      <div className="flex justify-between text-xs font-bold text-white/35 uppercase">
        <span>1 Hour (Flat)</span><span className="text-[#C4956A]">{lkr(r.firstHour)}</span>
      </div>
      <div className="flex justify-between text-xs font-bold text-white/35 uppercase">
        <span>2+ Hours (Per Hour)</span><span className="text-[#C4956A]">{lkr(r.perHour)}/HR</span>
      </div>
      <div className="pt-3 border-t border-[#C4956A]/10 flex flex-wrap justify-between items-center gap-x-4 gap-y-2">
        <span className="text-black bg-[#C4956A] px-2 py-0.5 rounded font-black uppercase text-[10px] tracking-widest whitespace-nowrap">Estimate · {p.roundedHours} hr{p.roundedHours === 1 ? '' : 's'}</span>
        <span className="text-3xl font-black italic tabular-nums text-[#C4956A] whitespace-nowrap ml-auto">{lkr(p.subtotal)}</span>
      </div>
      <div className="flex justify-between text-xs font-bold text-white/35 uppercase">
        <span>50% Deposit To Confirm</span><span className="text-[#F0EDE8]">{lkr(Math.round(p.subtotal / 2))}</span>
      </div>
      <p className="text-[9px] text-white/25 uppercase tracking-wider pt-1 border-t border-white/[0.06]">
        {r.note} · Hours after 8:00 PM are charged at 1.5×
      </p>
    </div>
  );
}
