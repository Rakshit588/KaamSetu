const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export const formatINR = (n: number | null | undefined) => inr.format(Math.round(n ?? 0));

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

export function timeAgo(input: string | Date, lang: 'en' | 'hi' = 'en'): string {
  const seconds = Math.round((new Date(input).getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(lang === 'hi' ? 'hi' : 'en', { numeric: 'auto' });
  const abs = Math.abs(seconds);
  if (abs < 60) return rtf.format(Math.round(seconds / 1), 'second');
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), 'hour');
  return rtf.format(Math.round(seconds / 86400), 'day');
}

export function formatDateTime(input: string | Date, lang: 'en' | 'hi' = 'en'): string {
  return new Date(input).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

/** Rates may be stored as 0..1 or 0..100; show a whole percentage either way. */
export function asPercent(n: number | null | undefined): number {
  const v = n ?? 0;
  return Math.round(v <= 1 ? v * 100 : v);
}

export function initials(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}
