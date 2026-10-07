import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, ArrowRight } from 'lucide-react';
import { PageShell, primaryBtn } from '../components/Shell';

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

export default function Gallery() {
  const [open, setOpen] = useState<number | null>(null);
  const columns = layout(useColumnCount());
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
    <PageShell wide title="Gallery" kicker="Sets · Lounge · Rooftop · Garden">
      <section id="spaces" className="flex gap-3 items-start scroll-mt-24">
        {columns.map((col, c) => (
          <div key={c} className="flex-1 min-w-0 flex flex-col gap-3">
            {col.map(i => <Photo key={PHOTOS[i].src} p={PHOTOS[i]} eager={i < 4} onOpen={() => setOpen(i)} />)}
          </div>
        ))}
      </section>
      <div className="max-w-lg mx-auto w-full pt-4">
        <Link to="/book" className={primaryBtn}>Book The Studio <ArrowRight size={24} /></Link>
      </div>

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
