// Single source of truth for rates, contacts and site links.
export const RATES = {
  nonCommercial: { firstHour: 8500, perHour: 6500, halfHour: 3500, label: 'Non-Commercial', note: 'Up to 6 pax · Personal / Creative use' },
  commercial: { firstHour: 12400, perHour: 9500, halfHour: 3500, label: 'Commercial', note: 'Above 6 pax · Commercial / Advertising use' },
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

export const SITE_URL = 'https://www.studioalora.online';
export const SITE_HOST = 'studioalora.online';
export const HOTLINE = '070 277 2774';
export const WHATSAPP_DISPLAY = '076 912 3653';
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
