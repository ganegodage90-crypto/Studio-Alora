import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PageShell, Toggle, glass, label, primaryBtn } from '../components/Shell';
import { Estimate, HOUR_OPTIONS } from '../components/Estimate';
import { SessionKind } from '../lib/site';
import { cn } from '../lib/utils';

export default function Calculator() {
  const [kind, setKind] = useState<SessionKind>('nonCommercial');
  const [hours, setHours] = useState(2);
  return (
    <PageShell title="Price Calculator" kicker="Know your total before you book">
      <div className={`${glass} p-8 space-y-6`}>
        <Toggle value={kind} onChange={setKind} options={[{ value: 'nonCommercial', label: 'Non-Commercial' }, { value: 'commercial', label: 'Commercial' }]} />
        <div className="space-y-2">
          <p className={label}>Session Length</p>
          <div className="flex gap-2 flex-wrap">
            {HOUR_OPTIONS.map(h => (
              <button key={h} type="button" onClick={() => setHours(h)}
                className={cn('px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide border transition-all',
                  hours === h ? 'bg-[#C4956A] text-black border-[#C4956A]' : 'bg-white/[0.04] text-white/40 border-white/[0.08] hover:border-[#C4956A]/40 hover:text-white/70')}>
                {h} HR
              </button>
            ))}
          </div>
        </div>
        <Estimate kind={kind} hours={hours} />
        <p className="text-xs text-white/40 leading-relaxed">
          Booking time includes check-in and check-out, light setup, outfit changes, and returning furniture and props to their place.
        </p>
        <Link to={`/book?type=${kind}&hours=${hours}`} className={primaryBtn}>Book This Session <ArrowRight size={24} /></Link>
      </div>
    </PageShell>
  );
}
