import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Instagram, Facebook, ArrowRight } from 'lucide-react';
import { PageShell, primaryBtn } from '../components/Shell';
import { Section, Defs } from '../components/Blocks';
import { ADDRESS, HOTLINE, WHATSAPP_DISPLAY, EMAIL, LINKS, waLink } from '../lib/site';

const RULES: [string, string][] = [
  ['No outdoor shoes', 'Bring indoor shoes or wear shoe coverings in the studio rooms. A 2,500 LKR cleaning fee applies if outdoor shoes are worn inside. Standing on furniture carries a damage fee.'],
  ['No food or drinks in the studio', 'Food and beverages are allowed only at the tea station next to the studio.'],
  ['Pets by approval', 'Once approved by staff, a non-refundable fee of 4,500 LKR per pet applies. Pets stay on a leash and off the furniture. Mess on the floor is a 2,500 LKR cleaning fee; damage is deducted from your deposit.'],
  ['No subleasing or time-sharing', 'Each booking is for one photographer and one client group. Mini sessions may be hosted only by professional photographers.'],
  ['Arrive on time', 'If you are early, please wait outside until your slot starts. There is no waiting room inside the studio.'],
  ['Leave things as you found them', 'Staff check the room 10 minutes before your booking ends. Return furniture and props and bin all rubbish. A 2,500 LKR fee applies if the room is not ready for the next customer.'],
  ['Capacity', 'Non-commercial sessions: maximum 6 people including photographers and videographers. Breaking the limit can end the session without a refund.'],
  ['Rest break on long shoots', 'For shoots of 6 hours or more, one rest break of up to 1 hour is available and is not counted. Ask staff to pause the session. All video lights and air conditioning must be switched off during the break.'],
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

export default function Rules() {
  useEffect(() => {
    if (location.hash) document.querySelector(location.hash)?.scrollIntoView();
  }, []);
  return (
    <PageShell wide title="Studio Rules" kicker="Please read before you book">
      <Section id="rules" title="In The Studio"><Defs items={RULES} /></Section>
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
    </PageShell>
  );
}
