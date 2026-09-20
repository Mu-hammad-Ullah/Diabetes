import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Sans_Bengali } from 'next/font/google';
import './globals.css';
import { cookies } from 'next/headers';
import { getLocale } from '@/lib/i18n/server';
import { I18nProvider } from '@/lib/i18n/client';
import { getCurrentUser } from '@/lib/supabase/server';
import { Nav } from '@/components/nav';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const bengali = Noto_Sans_Bengali({ subsets: ['bengali'], variable: '--font-bengali', display: 'swap', weight: ['400', '500', '600', '700'] });

export const metadata: Metadata = {
  title: { default: 'ডায়াবেটিস কেয়ার | Diabetes Care', template: '%s | Diabetes Care' },
  description: 'ডায়াবেটিস রোগীদের জন্য সুগার ট্র্যাকার, রিপোর্ট সংরক্ষণ, ডাক্তার অ্যাপয়েন্টমেন্ট ও কাছের হাসপাতাল — এক জায়গায়।',
};

export const viewport: Viewport = {
  themeColor: '#0d9488',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [locale, { profile }, cookieStore] = await Promise.all([getLocale(), getCurrentUser(), cookies()]);
  const theme = cookieStore.get('theme')?.value; // 'dark' | 'light' | undefined (= system)

  return (
    <html lang={locale} suppressHydrationWarning
      className={`${inter.variable} ${bengali.variable} h-full antialiased${theme === 'dark' ? ' dark' : ''}`}>
      <head>
        {/* cookie না থাকলে system preference — paint-এর আগেই class বসে, flash হয় না */}
        {!theme && (
          <script dangerouslySetInnerHTML={{ __html:
            "if(matchMedia('(prefers-color-scheme: dark)').matches)document.documentElement.classList.add('dark')" }} />
        )}
      </head>
      <body className="flex min-h-full flex-col">
        <I18nProvider locale={locale}>
          <Nav profile={profile} />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
            <div className="mx-auto max-w-5xl px-4">
              {locale === 'bn'
                ? 'শুধুমাত্র শিক্ষামূলক উদ্দেশ্যে। চিকিৎসার জন্য অবশ্যই ডাক্তারের পরামর্শ নিন।'
                : 'For educational purposes only. Always consult a doctor for treatment.'}
              <div className="mt-1">
                © {new Date().getFullYear()} Diabetes Care · All rights reserved · MUHAMMADULLAH ·{' '}
                <a href="tel:+8801718237713" className="hover:underline">01718237713</a>
              </div>
            </div>
          </footer>
        </I18nProvider>
      </body>
    </html>
  );
}
