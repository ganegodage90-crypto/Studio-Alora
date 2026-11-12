import { BANK } from './site';

export interface BankDetails { bank: string; branch: string; name: string; account: string }
export interface BankAccount extends BankDetails { id: string }

/** The account in the site code, used until staff save one on /staff and if the database cannot be reached. */
export const BUILT_IN_BANK: BankDetails = BANK;

let cache: Promise<BankDetails> | null = null;
/** The studio's current default account, as set by staff. */
export const currentBank = () => (cache ||= fetch('/api/bank-accounts')
  .then(r => r.json())
  .then(j => (j?.bank?.account ? (j.bank as BankDetails) : BUILT_IN_BANK))
  .catch(() => { cache = null; return BUILT_IN_BANK; }));
/** Forget the cached default, after staff change it. */
export const resetBankCache = () => { cache = null; };

export const bankLine = (b: BankDetails) => `${b.bank}${b.branch ? ` (${b.branch})` : ''} · ${b.name} · ${b.account}`;
export const sameBank = (a?: BankDetails | null, b?: BankDetails | null) => Boolean(a && b && a.account === b.account && a.name === b.name && a.bank === b.bank && a.branch === b.branch);
