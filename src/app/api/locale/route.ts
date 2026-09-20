import { NextResponse } from 'next/server';
import { LOCALE_COOKIE, isLocale } from '@/lib/i18n';

// ভাষা বদল: cookie set করে আগের পেজে ফেরত
export async function POST(request: Request) {
  const form = await request.formData();
  const locale = form.get('locale');
  const back = (form.get('back') as string) || '/';
  const safeBack = back.startsWith('/') && !back.startsWith('//') ? back : '/';
  const res = NextResponse.redirect(new URL(safeBack, request.url), { status: 303 });
  if (isLocale(locale)) {
    res.cookies.set(LOCALE_COOKIE, locale, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
  }
  return res;
}
