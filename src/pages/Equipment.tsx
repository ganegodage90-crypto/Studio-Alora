import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PageShell, primaryBtn } from '../components/Shell';
import { Section, Chips } from '../components/Blocks';

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

const sub = 'text-[10px] font-black uppercase tracking-widest text-white/35';

export default function Equipment() {
  return (
    <PageShell wide title="Equipment" kicker="Included with every booking">
      <Section id="lighting" title="Lighting And Grip"><Chips items={EQUIPMENT} /></Section>
      <Section id="facilities" title="Facilities"><Chips items={FACILITIES} /></Section>
      <Section id="optional" title="Optional Extras">
        <p className={sub}>Available on request</p>
        <Chips items={OPTIONAL} />
      </Section>
      <div className="max-w-lg mx-auto w-full pt-2">
        <Link to="/book" className={primaryBtn}>Book The Studio <ArrowRight size={24} /></Link>
      </div>
    </PageShell>
  );
}
