import { cookies } from 'next/headers';
import type { Locale } from '@/lib/database.types';
import { LOCALE_COOKIE, isLocale, makeT } from './index';

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const v = store.get(LOCALE_COOKIE)?.value;
  return isLocale(v) ? v : 'bn';
}

export async function getT() {
  const locale = await getLocale();
  return { locale, t: makeT(locale) };
}
