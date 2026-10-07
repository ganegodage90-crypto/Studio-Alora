export interface PackageView {
  name: string; kind: 'nonCommercial' | 'commercial'; hours: number; rate: number;
  used: number; left: number; extra: number; startedAt: number | null; expiresAt: number | null;
  sessions: { at: number; hours: number; note: string; start?: number | null; end?: number | null; restMs?: number }[]; expired?: boolean;
}
export interface StaffPackage extends PackageView { id: string; phone: string; createdAt: number; expired: boolean }

export async function api<T>(path: string, body: unknown): Promise<T & { ok: boolean; error?: string }> {
  const r = await fetch(`/api/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return r.json();
}

export const hrs = (n: number) => `${n} hr${n === 1 ? '' : 's'}`;
export const day = (ms: number) => new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
export const clock = (ms: number) => new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Colombo' });
/** 95 minutes -> "1 hr 35 min" */
export const span = (ms: number) => { const m = Math.round(ms / 60000); const h = Math.floor(m / 60); return [h ? `${h} hr` : '', m % 60 || !h ? `${m % 60} min` : ''].filter(Boolean).join(' '); };
export const daysLeft = (p: PackageView) => (p.expiresAt ? Math.max(0, Math.ceil((p.expiresAt - Date.now()) / 86400000)) : null);
