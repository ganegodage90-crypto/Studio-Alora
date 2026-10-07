import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X, MessageCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { waLink } from '../lib/site';

// Solid translucent card: no backdrop blur, which is very slow on phones.
export const glass = 'bg-[#1b1510]/85 border border-[#C4956A]/15 rounded-3xl shadow-[0_0_60px_rgba(196,149,106,0.06)]';
export const josefin: React.CSSProperties = { fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.25em' };
export const field = 'w-full min-w-0 bg-white/[0.06] border border-white/[0.08] rounded-2xl py-4 px-4 focus:outline-none focus:border-[#C4956A] focus:ring-1 focus:ring-[#C4956A]/40 transition-all font-medium placeholder:text-white/20 text-[#F0EDE8] [color-scheme:dark]';
export const label = 'text-[10px] font-black uppercase tracking-widest text-white/35 ml-1';
export const primaryBtn = 'w-full bg-[#C4956A] text-black font-black py-5 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform uppercase tracking-tighter text-base sm:text-lg px-4 text-center disabled:opacity-40 disabled:hover:scale-100';
export const ghostBtn = 'w-full flex items-center justify-center gap-2 bg-white/[0.04] border border-white/[0.08] text-white/60 hover:text-white hover:border-[#C4956A]/40 font-bold py-3 rounded-2xl transition-all uppercase tracking-widest text-[11px]';

// One static glow behind every page. No blur filters and no animation, so phones stay cool.
export function Orbs() {
  return (
    <div aria-hidden className="fixed inset-0 pointer-events-none" style={{ background:
      'radial-gradient(60% 45% at 50% 30%, rgba(196,149,106,0.26), rgba(196,149,106,0) 70%), radial-gradient(40% 35% at 78% 78%, rgba(139,94,60,0.16), rgba(139,94,60,0) 70%), radial-gradient(38% 32% at 20% 22%, rgba(232,196,160,0.10), rgba(232,196,160,0) 70%)' }} />
  );
}

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/equipment', label: 'Equipment' },
  { to: '/rules', label: 'Rules' },
  { to: '/packages', label: 'Packages' },
  { to: '/book', label: 'Book' },
  { to: '/collab', label: 'Collab' },
];

export function TopBar() {
  const [open, setOpen] = useState(false);
  const link = ({ isActive }: { isActive: boolean }) =>
    cn('px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
      isActive ? 'bg-[#C4956A] text-black' : 'text-white/45 hover:text-white');
  const wa = waLink('Hi Studio Alora, I would like to book the studio.');
  return (
    <header className="fixed top-0 left-0 right-0 z-[60] p-3">
      <nav className="mx-auto max-w-5xl bg-[#0f0b08]/95 border border-[#C4956A]/15 rounded-2xl px-4 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" style={josefin} className="text-base uppercase text-[#C4956A] whitespace-nowrap leading-none pt-1">Studio Alora</Link>
          <div className="hidden lg:flex items-center gap-1">
            {NAV.map(n => <NavLink key={n.to} to={n.to} end className={link}>{n.label}</NavLink>)}
            <a href={wa} target="_blank" rel="noreferrer"
              className="ml-2 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#C4956A]/40 text-[#C4956A] hover:bg-[#C4956A] hover:text-black text-[10px] font-black uppercase tracking-widest transition-all">
              <MessageCircle size={13} /> WhatsApp
            </a>
          </div>
          <button type="button" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(o => !o)}
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl border border-white/[0.08] text-white/70">
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
        {open && (
          <div className="lg:hidden grid grid-cols-2 gap-2 pt-3 pb-1">
            {NAV.map(n => <NavLink key={n.to} to={n.to} end onClick={() => setOpen(false)} className={(s) => cn(link(s), 'text-center py-3 border border-white/[0.06]')}>{n.label}</NavLink>)}
            <a href={wa} target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-1.5 py-3 rounded-xl border border-[#C4956A]/40 text-[#C4956A] text-[10px] font-black uppercase tracking-widest">
              <MessageCircle size={13} /> WhatsApp
            </a>
          </div>
        )}
      </nav>
    </header>
  );
}

export function PageShell({ title, kicker, wide, children }: { title: string; kicker: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className="min-h-screen text-[#F0EDE8] font-sans selection:bg-[#C4956A] selection:text-black flex flex-col items-center px-4 pt-24 pb-16 overflow-x-hidden">
      <main className={cn('w-full relative z-10 space-y-6 page-in', wide ? 'max-w-5xl' : 'max-w-lg')}>
        <div className="space-y-2 text-center pt-4 pb-2">
          <h1 style={josefin} className="text-2xl sm:text-4xl uppercase leading-tight text-[#C4956A]">{title}</h1>
          <p className="text-[10px] font-bold tracking-[0.2em] text-white/30 uppercase">{kicker}</p>
        </div>
        {children}
      </main>
    </div>
  );
}

export function Toggle<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="flex rounded-2xl border border-white/[0.08] overflow-hidden bg-white/[0.03]">
      {options.map(o => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          className={cn('flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all',
            value === o.value ? 'bg-[#C4956A] text-black' : 'text-white/35 hover:text-white/60')}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
