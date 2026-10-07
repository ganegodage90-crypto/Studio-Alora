// Single source of truth for rates, contacts and site links.
export const RATES = {
  nonCommercial: { firstHour: 8500, perHour: 6500, halfHour: 3500, label: 'Non-Commercial', pax: 'Up to 6 people', note: 'Up to 6 people, including crew' },
  commercial: { firstHour: 12400, perHour: 9500, halfHour: 3500, label: 'Commercial', pax: 'More than 6 people', note: 'More than 6 people, including crew' },
} as const;

export type SessionKind = keyof typeof RATES;

/** 1 hour or less = first-hour rate. From 2 hours, every hour is charged at the per-hour rate. Billed in half-hour steps. */
export function priceFor(hours: number, kind: SessionKind) {
  const r = RATES[kind];
  const rounded = Math.round(hours * 2) / 2;
  if (rounded <= 1) return { roundedHours: rounded, subtotal: r.firstHour };
  const whole = Math.floor(rounded);
  return { roundedHours: rounded, subtotal: whole * r.perHour + (rounded % 1 !== 0 ? r.halfHour : 0) };
}

// Monthly packages: hours bought in advance at a lower hourly rate.
export const PACKAGES = [
  { id: '10', hours: 10, label: '10 Hours', rate: { nonCommercial: 6000, commercial: 9000 } },
  { id: '20', hours: 20, label: '20 Hours', rate: { nonCommercial: 5500, commercial: 8400 } },
  { id: '30', hours: 30, label: '30 Hours', rate: { nonCommercial: 5000, commercial: 7900 } },
] as const;

export const PAX_RULE = 'Your rate depends on how many people attend, including photographers and crew.';

export const SITE_URL = 'https://www.studioalora.online';
export const SITE_HOST = 'studioalora.online';
export const HOTLINE = '076 9 123 653';
export const WHATSAPP_DISPLAY = '076 9 123 653';
export const WHATSAPP_INTL = '94769123653';
export const EMAIL = 'studioalora@gmail.com';
export const ADDRESS = '136/B, 12th Lane, Saraboomi Residencies, Piliyandala';
export const LINKS = {
  facebook: 'https://www.facebook.com/StudioAlora/',
  instagram: 'https://www.instagram.com/studio_alora_lk/',
  maps: 'https://maps.app.goo.gl/3zy3122Kkuoy5ojv6',
};

export const waLink = (text: string) => `https://wa.me/${WHATSAPP_INTL}?text=${encodeURIComponent(text)}`;
export const lkr = (n: number) => `${n.toLocaleString('en-US')} LKR`;
