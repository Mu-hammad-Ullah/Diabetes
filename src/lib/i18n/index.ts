import type { Locale } from '@/lib/database.types';
import { dictionaries, type DictKey } from './dict';

export type { DictKey };
export const LOCALE_COOKIE = 'locale';
export const LOCALES: Locale[] = ['bn', 'en'];

export function isLocale(v: unknown): v is Locale {
  return v === 'bn' || v === 'en';
}

export function makeT(locale: Locale) {
  const dict = dictionaries[locale];
  return (key: DictKey): string => dict[key];
}

export type T = ReturnType<typeof makeT>;

// Date/number formatting per locale
export function fmtDate(iso: string | Date, locale: Locale, opts?: Intl.DateTimeFormatOptions) {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return d.toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-GB', opts ?? { year: 'numeric', month: 'short', day: 'numeric' });
}

export function fmtDateTime(iso: string | Date, locale: Locale) {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return d.toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-GB', {
    year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export function fmtNum(n: number, locale: Locale, digits = 1) {
  return n.toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US', { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}
