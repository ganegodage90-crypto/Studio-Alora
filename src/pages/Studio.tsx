import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Instagram, Facebook, X, ArrowRight } from 'lucide-react';
import { PageShell, glass, josefin, primaryBtn } from '../components/Shell';
import { ADDRESS, HOTLINE, WHATSAPP_DISPLAY, EMAIL, LINKS, waLink } from '../lib/site';

const PHOTOS: { src: string; alt: string; tall?: boolean }[] = [
  { src: 'arch-set-light', alt: 'Arch set with projected light pattern' },
  { src: 'studio-wide', alt: 'Wide view of the studio floor with backdrops and lounge' },
  { src: 'mood-board', alt: 'Mood board wall and prop shelves', tall: true },
  { src: 'lighting-1', alt: 'Lighting setup with parabolic and softboxes' },
  { src: 'lounge-1', alt: 'Lounge set with green armchairs and wall lights' },
  { src: 'softboxes', alt: 'Ceiling-mounted softboxes above the dining area', tall: true },
  { src: 'arch-set', alt: 'Teal arch set with plinths' },
  { src: 'main-floor', alt: 'Main floor with indoor tree and arch set' },
  { src: 'lighting-2', alt: 'Lighting rig in front of the motorised backdrops' },
  { src: 'rooftop-door', alt: 'Brown feature door and fluted wall', tall: true },
  { src: 'lounge-2', alt: 'Lounge set, closer view' },
  { src: 'arch-set-angle', alt: 'Arch set from the side' },
  { src: 'dining', alt: 'Dining and meeting area' },
  { src: 'rooftop', alt: 'Rooftop pergola with string lights' },
  { src: 'garden-seating', alt: 'Garden seating under trees', tall: true },
  { src: 'garden-path', alt: 'Garden path at sunset' },
  { src: 'exterior-night', alt: 'Studio Alora exterior lit at night', tall: true },
];

const EQUIPMENT = [
  'Motorised backdrop unit', '30+ seamless paper backdrops (9 ft × 36 ft)', 'Godox BM600', 'Godox SK400II strobes × 2',
  '600W video light', '520W video lights × 2', '35×160 softboxes × 2', '30×120 softbox', '55 beauty dish', 'Godox 130W umbrella',
  'Umbrella light reflectors × 2', '90 parabolic', 'Lantern softbox', 'Heavy-duty rolling boom stand', 'Heavy-duty boom arm',
  'C-stands on wheels', 'Sandbags', 'Reflector cup with colour gels', '15+ colour gels', 'Curved reflector', 'Scrim diffuser',
  '9 colours of PVC backdrops for product shoots', 'Light projection kit (20 shadow effects)', 'Posing cubes × 4', 'Mood board',
];
const FACILITIES = [
  '6+ locations with modern interiors', '3D arch', 'Modern window location', 'Air conditioned', 'AC changing room with makeup mirror',
  'Bluetooth sound', 'Parking for 10 vehicles', 'Dining area with tea station', 'Waiting area', 'Rooftop meeting and relaxing area',
  'Smoking area', 'Hot water', 'Fridge', 'Nescafé machine',
];
const OPTIONAL = ['Tether tools with live view', 'Live one-time retouching and editing service', 'Video reels'];

const RULES: [string, string][] = [
  ['No outdoor shoes', 'Bring indoor shoes or wear shoe coverings in the studio rooms. A 2,500 LKR cleaning fee applies if outdoor shoes are worn inside. Standing on furniture carries a damage fee.'],
  ['No food or drinks in the studio', 'Food and beverages are allowed only at the tea station next to the studio.'],
  ['Pets by approval', 'Once approved by staff, a non-refundable fee of 4,500 LKR per pet applies. Pets stay on a leash and off the furniture. Mess on the floor is a 2,500 LKR cleaning fee; damage is deducted from your deposit.'],
  ['No subleasing or time-sharing', 'Each booking is for one photographer and one client group. Mini sessions may be hosted only by professional photographers.'],
  ['Arrive on time', 'If you are early, please wait outside until your slot starts. There is no waiting room inside the studio.'],
  ['Leave things as you found them', 'Staff check the room 10 minutes before your booking ends. Return furniture and props and bin all rubbish. A 2,500 LKR fee applies if the room is not ready for the next customer.'],
  ['Capacity', 'Non-commercial sessions: maximum 6 people including photographers and videographers. Breaking the limit can end the session without a refund.'],
  ['Not soundproof', 'Keep music and noise reasonable, with no explicit content. For video shoots that need quiet, contact us first.'],
  ['Not permitted', 'Adult or pornographic shoots, alcohol, smoking or drugs on the premises, and open flames.'],
  ['Stay within your studio', 'Your booking covers the studio you rented. Ask staff if you would like a tour of other areas.'],
  ['Staff check-ins', 'Staff may knock and enter if they hear loud noise, furniture being dragged, or suspect a rule or safety issue.'],
  ['Termination and bans', 'Failing to respect the rules, staff or other guests ends the booking immediately and can lead to a permanent ban from Studio Alora. The full damage deposit may be forfeited.'],
];
const TERMS: [string, string][] = [
  ['Payments and deposit', 'A 50% deposit is required for all rentals. The balance, plus any extra time or equipment, is due at the studio.'],
  ['Cancellations', 'Cancel 72 hours or more before your slot for a full refund. No refund for cancellations inside 72 hours.'],
  ['Rescheduling', 'Free with at least 72 hours notice. Inside 72 hours a fee of half the deposit applies.'],
  ['Length of use', 'Your time includes setup and tear-down. Going 15 minutes past your end time is charged as an additional hour. Hours after 8:00 PM are charged at 1.5×.'],
  ['Equipment', 'Equipment is provided in good working order. Tell staff immediately about any malfunction or damage.'],
  ['Damage', 'The renter is responsible for damage to the premises or equipment during the booking, including spills, marks and stains.'],
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className={`${glass} p-6 sm:p-8 space-y-5 scroll-mt-24`}>
      <h2 style={josefin} className="text-xl sm:text-2xl uppercase text-[#C4956A]">{title}</h2>
      {children}
    </section>
  );
}
const Chips = ({ items }: { items: string[] }) => (
  <ul className="flex flex-wrap gap-2">
    {items.map(i => <li key={i} className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-bold text-white/70">{i}</li>)}
  </ul>
);
const Defs = ({ items }: { items: [string, string][] }) => (
  <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
    {items.map(([t, d]) => (
      <div key={t} className="space-y-1">
        <dt className="text-[11px] font-black uppercase tracking-widest text-[#F0EDE8]">{t}</dt>
        <dd className="text-sm text-white/50 leading-relaxed">{d}</dd>
      </div>
    ))}
  </dl>
);

const Photo: React.FC<{ p: (typeof PHOTOS)[number]; eager: boolean; onOpen: () => void }> = ({ p, eager, onOpen }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <button type="button" onClick={onOpen} aria-label={`Open photo: ${p.alt}`}
      style={{ aspectRatio: p.tall ? '2 / 3' : '3 / 2' }}
      className={`relative block w-full overflow-hidden rounded-2xl border border-[#C4956A]/15 focus:outline-none focus:ring-2 focus:ring-[#C4956A] ${loaded ? '' : 'shimmer'}`}>
      <img src={`/images/thumb/${p.src}.jpg`} alt="" loading={eager ? 'eager' : 'lazy'} decoding="async"
        ref={el => { if (el?.complete && el.naturalWidth) setLoaded(true); }}
        onLoad={() => setLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`} />
    </button>
  );
};

function useColumnCount() {
  const q = '(min-width: 768px)';
  const [n, setN] = useState(() => (window.matchMedia(q).matches ? 3 : 2));
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setN(m.matches ? 3 : 2);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return n;
}

// Put each photo in the currently shortest column so the columns end at similar heights.
function layout(n: number) {
  const cols: number[][] = Array.from({ length: n }, () => []);
  const h = new Array(n).fill(0);
  PHOTOS.forEach((p, i) => {
    const c = h.indexOf(Math.min(...h));
    cols[c].push(i);
    h[c] += p.tall ? 1.5 : 0.667;
  });
  return cols;
}

export default function Studio() {
  const [open, setOpen] = useState<number | null>(null);
  const columns = layout(useColumnCount());
  useEffect(() => {
    if (location.hash) document.querySelector(location.hash)?.scrollIntoView();
  }, []);
  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') setOpen(o => (o === null ? o : (o + 1) % PHOTOS.length));
      if (e.key === 'ArrowLeft') setOpen(o => (o === null ? o : (o - 1 + PHOTOS.length) % PHOTOS.length));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <PageShell wide title="The Studio" kicker="Spaces · Equipment · Rules · Location">
      <nav className="flex flex-wrap justify-center gap-2">
        {[['#spaces', 'Spaces'], ['#equipment', 'Equipment'], ['#rules', 'Rules'], ['#terms', 'Rental Terms'], ['#visit', 'Visit']].map(([h, l]) => (
          <a key={h} href={h} className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/[0.08] bg-white/[0.04] text-white/50 hover:text-white hover:border-[#C4956A]/40 transition-all">{l}</a>
        ))}
      </nav>

      <section id="spaces" className="flex gap-3 items-start scroll-mt-24">
        {columns.map((col, c) => (
          <div key={c} className="flex-1 min-w-0 flex flex-col gap-3">
            {col.map(i => <Photo key={PHOTOS[i].src} p={PHOTOS[i]} eager={i < 4} onOpen={() => setOpen(i)} />)}
          </div>
        ))}
      </section>

      <Section id="equipment" title="Included With Every Booking">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/35">Lighting and grip</p>
        <Chips items={EQUIPMENT} />
        <p className="text-[10px] font-black uppercase tracking-widest text-white/35 pt-2">Facilities</p>
        <Chips items={FACILITIES} />
        <p className="text-[10px] font-black uppercase tracking-widest text-white/35 pt-2">Optional extras</p>
        <Chips items={OPTIONAL} />
      </Section>

      <Section id="rules" title="Studio Rules"><Defs items={RULES} /></Section>
      <Section id="terms" title="Rental Terms"><Defs items={TERMS} /></Section>

      <Section id="visit" title="Visit Us">
        <div className="grid sm:grid-cols-2 gap-3 text-sm font-bold text-white/70">
          <a href={LINKS.maps} target="_blank" rel="noreferrer" className="flex items-start gap-3 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-[#C4956A]/40"><MapPin size={18} className="text-[#C4956A] shrink-0 mt-0.5" /><span>{ADDRESS}<br /><span className="text-[#C4956A] text-xs">Open in Google Maps</span></span></a>
          <a href={`tel:${HOTLINE.replace(/\s/g, '')}`} className="flex items-start gap-3 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-[#C4956A]/40"><Phone size={18} className="text-[#C4956A] shrink-0 mt-0.5" /><span>{HOTLINE}<br /><span className="text-white/40 text-xs">Booking hotline</span></span></a>
          <a href={waLink('Hi Studio Alora, I have a question about the studio.')} target="_blank" rel="noreferrer" className="flex items-start gap-3 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-[#C4956A]/40"><Phone size={18} className="text-[#C4956A] shrink-0 mt-0.5" /><span>{WHATSAPP_DISPLAY}<br /><span className="text-white/40 text-xs">WhatsApp</span></span></a>
          <a href={`mailto:${EMAIL}`} className="flex items-start gap-3 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-[#C4956A]/40"><Mail size={18} className="text-[#C4956A] shrink-0 mt-0.5" /><span className="break-all">{EMAIL}</span></a>
          <a href={LINKS.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-[#C4956A]/40"><Instagram size={18} className="text-[#C4956A]" />@studio_alora_lk</a>
          <a href={LINKS.facebook} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-[#C4956A]/40"><Facebook size={18} className="text-[#C4956A]" />Studio Alora</a>
        </div>
        <Link to="/book" className={primaryBtn}>Book The Studio <ArrowRight size={24} /></Link>
      </Section>

      {open !== null && (
        <div role="dialog" aria-modal="true" aria-label={PHOTOS[open].alt} onClick={() => setOpen(null)}
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4">
          <img src={`/images/${PHOTOS[open].src}.jpg`} alt={PHOTOS[open].alt} className="max-w-full max-h-full rounded-2xl" />
          <button type="button" aria-label="Close" onClick={() => setOpen(null)}
            className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white"><X size={20} /></button>
        </div>
      )}
    </PageShell>
  );
}
