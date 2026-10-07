import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Loader2 } from 'lucide-react';
import { PageShell, glass, field, label, primaryBtn, ghostBtn } from '../components/Shell';
import { PackageCard } from '../components/PackageCard';
import { api, PackageView } from '../lib/packages';

export default function MyPackage() {
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PackageView | null | undefined>(undefined);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const r = await api<{ package: PackageView | null }>('package-lookup', { phone });
      if (!r.ok) throw new Error(r.error);
      setResult(r.package);
    } catch {
      setError('Could not load your hours right now. Please try again in a moment.');
    }
    setBusy(false);
  };

  return (
    <PageShell title="My Hours" kicker="Check your monthly package">
      <form onSubmit={submit} className={`${glass} p-8 space-y-4`}>
        <div className="space-y-1.5"><label htmlFor="m-phone" className={label}>Phone number used for your package</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C4956A]/50" size={18} />
            <input id="m-phone" required type="tel" autoComplete="tel" inputMode="tel" placeholder="07X XXX XXXX"
              className={`${field} pl-12 font-mono`} value={phone} onChange={e => setPhone(e.target.value)} />
          </div></div>
        <button type="submit" disabled={busy} className={primaryBtn}>{busy ? <Loader2 size={20} className="animate-spin" /> : null} Show My Hours</button>
        {error && <p role="alert" className="text-red-400 text-xs font-bold text-center">{error}</p>}
      </form>

      {result === null && (
        <div className={`${glass} p-8 text-center space-y-4`}>
          <p className="text-white/60 font-bold">No monthly package found for that number.</p>
          <p className="text-sm text-white/40">Check the number, or ask us if you have just bought one.</p>
          <Link to="/packages" className={ghostBtn}>See Monthly Packages</Link>
        </div>
      )}
      {result && <div className={`${glass} p-6 sm:p-8`}><PackageCard p={result} /></div>}
    </PageShell>
  );
}
