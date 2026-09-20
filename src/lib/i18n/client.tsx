'use client';

import { createContext, useContext, useMemo } from 'react';
import type { Locale } from '@/lib/database.types';
import { makeT, type T } from './index';

const Ctx = createContext<{ locale: Locale; t: T }>({ locale: 'bn', t: makeT('bn') });

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const value = useMemo(() => ({ locale, t: makeT(locale) }), [locale]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  return useContext(Ctx);
}
