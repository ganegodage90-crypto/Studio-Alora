import React, { useState } from 'react';
import { Check, Loader2, Pencil, Plus, Star, Trash2, X } from 'lucide-react';
import { glass, field, label, primaryBtn, ghostBtn } from './Shell';
import { api } from '../lib/packages';
import { BankAccount, BankDetails, BUILT_IN_BANK, resetBankCache } from '../lib/banks';
import { cn } from '../lib/utils';

export interface BankBook { accounts: BankAccount[]; defaultId: string | null }

const ERR: Record<string, string> = {
  bad_input: 'Add at least the account name and account number.',
  too_many: 'You can keep up to 20 accounts. Delete one first.',
  not_configured: 'The database is not connected in Vercel.',
  bad_pin: 'PIN expired. Reload the page and sign in again.',
};
const blank: BankDetails = { bank: '', branch: '', name: '', account: '' };

/** Staff list of bank accounts: add, edit, delete, and choose the default. */
export function StaffBanks({ pin, book, onBook, onClose }: { pin: string; book: BankBook; onBook: (b: BankBook) => void; onClose: () => void }) {
  // With no saved accounts yet, the form starts filled with the account from the site code so it can be saved in one tap.
  const [form, setForm] = useState<(BankDetails & { id?: string }) | null>(book.accounts.length ? null : { ...BUILT_IN_BANK });
  const [makeDefault, setMakeDefault] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const call = async (body: Record<string, unknown>) => {
    setBusy(true); setError('');
    try {
      const r = await api<BankBook>('bank-accounts', { pin, ...body });
      setBusy(false);
      if (!r.ok) { setError(ERR[r.error || ''] || 'Something went wrong. Try again.'); return false; }
      onBook({ accounts: r.accounts, defaultId: r.defaultId });
      resetBankCache();
      return true;
    } catch { setBusy(false); setError('No connection. Try again.'); return false; }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form && await call({ action: 'save', account: form, makeDefault })) { setForm(null); setMakeDefault(false); }
  };
  const setF = (k: keyof BankDetails) => (e: React.ChangeEvent<HTMLInputElement>) => form && setForm({ ...form, [k]: e.target.value });

  return (
    <div className={`${glass} p-5 sm:p-6 space-y-4`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-black uppercase tracking-widest text-[#C4956A]">Bank Accounts</p>
        <button type="button" onClick={onClose} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white"><X size={14} /> Close</button>
      </div>
      <p className="text-xs text-white/45">The <span className="text-[#C4956A] font-bold">default</span> account is shown on the check-in Bank Transfer screen and on new invoices. You can pick a different account inside any invoice.</p>

      {book.accounts.length === 0 && (
        <p className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3">
          No saved accounts yet. The site is using the built-in account ({BUILT_IN_BANK.name}, {BUILT_IN_BANK.account}). Save it below, or replace it with another account.
        </p>
      )}

      <ul className="space-y-2">
        {book.accounts.map(a => {
          const isDefault = a.id === book.defaultId;
          return (
            <li key={a.id} className={cn('rounded-2xl border p-4 space-y-2', isDefault ? 'border-[#C4956A]/50 bg-[#C4956A]/[0.07]' : 'border-white/[0.08] bg-white/[0.03]')}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-black uppercase tracking-tight truncate">{a.name}</p>
                  <p className="text-lg font-black tabular-nums tracking-wider text-[#C4956A]">{a.account}</p>
                  <p className="text-xs text-white/50">{a.bank}{a.branch ? ` — ${a.branch}` : ''}</p>
                </div>
                {isDefault && <span className="shrink-0 flex items-center gap-1 px-2 py-1 rounded bg-[#C4956A] text-black text-[9px] font-black uppercase tracking-widest"><Star size={10} /> Default</span>}
              </div>
              {confirmDel === a.id ? (
                <div className="flex gap-2">
                  <button type="button" disabled={busy} className={`${ghostBtn} py-2 border-red-500/40 text-red-400`} onClick={async () => { await call({ action: 'delete', id: a.id }); setConfirmDel(null); }}>Yes, delete</button>
                  <button type="button" className={`${ghostBtn} py-2`} onClick={() => setConfirmDel(null)}>Keep</button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-4 pt-1">
                  {!isDefault && <button type="button" disabled={busy} onClick={() => call({ action: 'default', id: a.id })} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#C4956A] hover:text-white"><Check size={12} /> Make default</button>}
                  <button type="button" onClick={() => { setForm({ ...a }); setError(''); }} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white"><Pencil size={12} /> Edit</button>
                  <button type="button" onClick={() => setConfirmDel(a.id)} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-red-400"><Trash2 size={12} /> Delete</button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {form ? (
        <form onSubmit={save} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 space-y-3">
          <p className={label}>{form.id ? 'Edit account' : 'New account'}</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 min-w-0"><label htmlFor="b-bank" className={label}>Bank</label>
              <input id="b-bank" className={field} placeholder="e.g. Commercial Bank" value={form.bank} onChange={setF('bank')} /></div>
            <div className="space-y-1.5 min-w-0"><label htmlFor="b-branch" className={label}>Branch</label>
              <input id="b-branch" className={field} value={form.branch} onChange={setF('branch')} /></div>
            <div className="space-y-1.5 min-w-0"><label htmlFor="b-name" className={label}>Account Name</label>
              <input id="b-name" required className={field} value={form.name} onChange={setF('name')} /></div>
            <div className="space-y-1.5 min-w-0"><label htmlFor="b-acc" className={label}>Account Number</label>
              <input id="b-acc" required inputMode="numeric" className={`${field} font-mono`} value={form.account} onChange={setF('account')} /></div>
          </div>
          {!form.id && book.accounts.length > 0 && (
            <label className="flex items-center gap-2 text-xs font-bold text-white/60">
              <input type="checkbox" checked={makeDefault} onChange={e => setMakeDefault(e.target.checked)} className="accent-[#C4956A] w-4 h-4" /> Make this the default account
            </label>
          )}
          {error && <p role="alert" className="text-red-400 text-xs font-bold text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className={`${ghostBtn} py-3`} onClick={() => { setForm(null); setError(''); }}>Cancel</button>
            <button type="submit" disabled={busy} className={`${primaryBtn} py-3`}>{busy ? <Loader2 size={16} className="animate-spin" /> : null} Save Account</button>
          </div>
        </form>
      ) : (
        <>
          {error && <p role="alert" className="text-red-400 text-xs font-bold text-center">{error}</p>}
          <button type="button" onClick={() => { setForm({ ...blank }); setError(''); }} className="flex items-center gap-1 px-4 py-3 rounded-xl bg-[#C4956A] text-black text-[10px] font-black uppercase tracking-widest"><Plus size={13} /> Add bank account</button>
        </>
      )}
    </div>
  );
}
