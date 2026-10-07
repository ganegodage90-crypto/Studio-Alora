import React from 'react';
import { glass, josefin } from './Shell';

export function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className={`${glass} p-6 sm:p-8 space-y-5 scroll-mt-24`}>
      <h2 style={josefin} className="text-xl sm:text-2xl uppercase text-[#C4956A]">{title}</h2>
      {children}
    </section>
  );
}
export const Chips = ({ items }: { items: string[] }) => (
  <ul className="flex flex-wrap gap-2">
    {items.map(i => <li key={i} className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-bold text-white/70">{i}</li>)}
  </ul>
);
export const Defs = ({ items }: { items: [string, string][] }) => (
  <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
    {items.map(([t, d]) => (
      <div key={t} className="space-y-1">
        <dt className="text-[11px] font-black uppercase tracking-widest text-[#F0EDE8]">{t}</dt>
        <dd className="text-sm text-white/50 leading-relaxed">{d}</dd>
      </div>
    ))}
  </dl>
);
