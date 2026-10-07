import React, { useState } from 'react';
import { MessageCircle, CheckCircle2 } from 'lucide-react';
import { PageShell, glass, josefin, field, label, primaryBtn, ghostBtn } from '../components/Shell';
import { waLink } from '../lib/site';
import { saveRequest } from '../lib/requests';

const CONDITIONS: [string, string[]][] = [
  ['Brand credit (mandatory)', [
    'All published content must clearly credit Studio Alora, e.g. “Shoot at STUDIO ALORA – The Visual Collective” or “Location Partner: STUDIO ALORA – The Visual Collective”.',
    'Official studio social accounts must be tagged and visible on every platform.',
    'Credit must stay permanently visible and must not be removed, hidden or altered after publication.',
  ]],
  ['Content sharing and usage', [
    'Studio Alora may capture and use behind-the-scenes photos, videos and short promotional content from the shoot.',
    'This content is used only for studio promotion, portfolio, website and social media marketing. It is never sold or licensed to third parties.',
  ]],
  ['Minimum deliverables', [
    'At least one feed post, reel or equivalent, and one story or short-form mention.',
    'Published within 7 days of the shoot unless agreed otherwise in writing.',
    'Studio Alora may re-share all tagged or credited content.',
  ]],
  ['Brand visibility on set', [
    'Studio branding (logo, signage, name, identifiable interior) must not be concealed or removed during the shoot.',
    'Branding should be visible in behind-the-scenes or setup footage where applicable.',
  ]],
  ['Approval', [
    'Studio Alora may approve or decline any collaboration at its sole discretion, based on brand alignment, profile, content nature and reputational considerations.',
  ]],
];

export default function Collab() {
  const [f, setF] = useState({ name: '', phone: '', handle: '', followers: '', kind: '', date: '', idea: '' });
  const [agree, setAgree] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF(p => ({ ...p, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = [
      '*STUDIO ALORA – COLLABORATION APPLICATION*',
      `Name / Brand: ${f.name}`,
      `Phone: ${f.phone}`,
      `Instagram / page: ${f.handle}`,
      f.followers && `Followers: ${f.followers}`,
      `Content: ${f.kind}`,
      f.date && `Preferred date: ${f.date}`,
      `Idea: ${f.idea}`,
      'I accept the Studio Alora collaboration conditions.',
    ].filter(Boolean).join('\n');
    const url = waLink(msg);
    saveRequest('collab', { ...f, acceptedConditions: true });
    setSent(url);
    window.open(url, '_blank', 'noopener');
  };

  return (
    <PageShell wide title="Collaborations" kicker="Conditions and application">
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <section className={`${glass} p-6 sm:p-8 space-y-6`}>
          <h2 style={josefin} className="text-xl uppercase text-[#C4956A]">Collaboration Conditions</h2>
          {CONDITIONS.map(([t, items]) => (
            <div key={t} className="space-y-2">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-[#F0EDE8]">{t}</h3>
              <ul className="space-y-2 text-sm text-white/50 leading-relaxed list-disc pl-5 marker:text-[#C4956A]/60">
                {items.map(i => <li key={i}>{i}</li>)}
              </ul>
            </div>
          ))}
        </section>

        {sent ? (
          <div className={`${glass} p-10 text-center space-y-6`}>
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#C4956A]/10 border border-[#C4956A]/20 text-[#C4956A]"><CheckCircle2 size={48} /></div>
            <p className="text-white/60 font-bold leading-relaxed">WhatsApp opened with your application. Press send there to reach us.<br />
              <span className="text-white/35 text-sm">We review every request and reply with a decision.</span></p>
            <a href={sent} target="_blank" rel="noreferrer" className={primaryBtn}><MessageCircle size={22} /> Open WhatsApp Again</a>
            <button type="button" onClick={() => setSent(null)} className={ghostBtn}>Edit Application</button>
          </div>
        ) : (
          <form onSubmit={submit} className={`${glass} p-6 sm:p-8 space-y-4`}>
            <h2 style={josefin} className="text-xl uppercase text-[#C4956A] pb-2">Apply</h2>
            <div className="space-y-1.5 min-w-0"><label htmlFor="c-name" className={label}>Name or Brand</label>
              <input id="c-name" required autoComplete="name" className={field} value={f.name} onChange={set('name')} /></div>
            <div className="space-y-1.5 min-w-0"><label htmlFor="c-phone" className={label}>Phone / WhatsApp</label>
              <input id="c-phone" required type="tel" autoComplete="tel" className={`${field} font-mono`} value={f.phone} onChange={set('phone')} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 min-w-0"><label htmlFor="c-handle" className={label}>Instagram / Page</label>
                <input id="c-handle" required placeholder="@yourhandle" className={field} value={f.handle} onChange={set('handle')} /></div>
              <div className="space-y-1.5 min-w-0"><label htmlFor="c-followers" className={label}>Followers (optional)</label>
                <input id="c-followers" placeholder="e.g. 25k" className={field} value={f.followers} onChange={set('followers')} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 min-w-0"><label htmlFor="c-kind" className={label}>Content Type</label>
                <input id="c-kind" required placeholder="Fashion, music video…" className={field} value={f.kind} onChange={set('kind')} /></div>
              <div className="space-y-1.5 min-w-0"><label htmlFor="c-date" className={label}>Preferred Date (optional)</label>
                <input id="c-date" type="date" className={field} value={f.date} onChange={set('date')} /></div>
            </div>
            <div className="space-y-1.5 min-w-0"><label htmlFor="c-idea" className={label}>Your Idea</label>
              <textarea id="c-idea" required rows={4} placeholder="What you want to shoot and where it will be published" className={field} value={f.idea} onChange={set('idea')} /></div>
            <label className="flex items-start gap-3 text-xs text-white/50 leading-relaxed cursor-pointer py-2">
              <input type="checkbox" required checked={agree} onChange={e => setAgree(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#C4956A]" />
              <span>I have read and accept the collaboration conditions, including mandatory brand credit and the minimum deliverables.</span>
            </label>
            <button type="submit" className={primaryBtn}><MessageCircle size={22} /> Apply on WhatsApp</button>
          </form>
        )}
      </div>
    </PageShell>
  );
}
