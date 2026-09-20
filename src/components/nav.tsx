'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Activity, Calendar, FileText, Hospital, LayoutDashboard, LogOut, Menu, ShieldCheck,
  Stethoscope, User, X, HeartPulse, Languages,
} from 'lucide-react';
import type { Profile } from '@/lib/database.types';
import { useI18n } from '@/lib/i18n/client';
import { ThemeToggle } from './theme-toggle';
import type { DictKey } from '@/lib/i18n';

type Item = { href: string; label: DictKey; icon: React.ComponentType<{ className?: string }> };

const PATIENT_ITEMS: Item[] = [
  { href: '/dashboard', label: 'navDashboard', icon: LayoutDashboard },
  { href: '/readings', label: 'navReadings', icon: Activity },
  { href: '/reports', label: 'navReports', icon: FileText },
  { href: '/doctors', label: 'navDoctors', icon: Stethoscope },
  { href: '/appointments', label: 'navAppointments', icon: Calendar },
  { href: '/hospitals', label: 'navHospitals', icon: Hospital },
];

const DOCTOR_ITEMS: Item[] = [
  { href: '/doctor', label: 'navDoctorPanel', icon: Stethoscope },
  { href: '/doctor/appointments', label: 'navAppointments', icon: Calendar },
  { href: '/hospitals', label: 'navHospitals', icon: Hospital },
];

export function Nav({ profile }: { profile: Profile | null }) {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const items = !profile ? [] : profile.role === 'doctor' ? DOCTOR_ITEMS : PATIENT_ITEMS;
  const isActive = (href: string) => pathname === href || (href !== '/doctor' && pathname.startsWith(href + '/')) || (href === '/doctor' && pathname === '/doctor');

  const LangSwitch = (
    <form action="/api/locale" method="post" className="inline">
      <input type="hidden" name="locale" value={locale === 'bn' ? 'en' : 'bn'} />
      <input type="hidden" name="back" value={pathname} />
      <button type="submit" className="btn btn-ghost px-2" aria-label={t('language')} title={t('language')}>
        <Languages className="h-4 w-4" />
        <span className="text-xs">{locale === 'bn' ? 'EN' : 'বাং'}</span>
      </button>
    </form>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
        <Link href={profile ? (profile.role === 'doctor' ? '/doctor' : '/dashboard') : '/'} className="flex shrink-0 items-center gap-1.5 whitespace-nowrap font-bold text-teal-700 sm:gap-2">
          <HeartPulse className="h-6 w-6 shrink-0" />
          <span className="text-[15px] sm:text-base">{t('appName')}</span>
        </Link>

        {/* desktop */}
        <nav className="hidden items-center gap-0.5 lg:flex xl:gap-1">
          {items.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-2 text-sm font-medium xl:px-3 ${isActive(href) ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-100'}`}>
              <Icon className="h-4 w-4" />{t(label)}
            </Link>
          ))}
          {profile?.role === 'admin' && (
            <Link href="/admin/doctors" className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-2 text-sm font-medium xl:px-3 ${isActive('/admin') ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-100'}`}>
              <ShieldCheck className="h-4 w-4" />{t('navAdmin')}
            </Link>
          )}
        </nav>

        <div className="hidden shrink-0 items-center gap-0.5 lg:flex">
          <ThemeToggle />
          {LangSwitch}
          {profile ? (
            <>
              <Link href={profile.role === 'doctor' ? '/doctor/profile' : '/profile'} className="btn btn-ghost px-2">
                <User className="h-4 w-4" /><span className="hidden max-w-[10rem] truncate xl:inline">{profile.full_name || t('navProfile')}</span>
              </Link>
              <form action="/auth/signout" method="post">
                <button className="btn btn-ghost px-2" title={t('logout')}><LogOut className="h-4 w-4" /></button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost">{t('login')}</Link>
              <Link href="/signup" className="btn btn-primary">{t('signup')}</Link>
            </>
          )}
        </div>

        {/* mobile toggle */}
        <div className="flex items-center gap-0 sm:gap-1 lg:hidden">
          <ThemeToggle />
          {LangSwitch}
          <button className="btn btn-ghost px-2" onClick={() => setOpen((v) => !v)} aria-label="menu" aria-expanded={open}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
          <nav className="flex flex-col gap-1">
            {items.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive(href) ? 'bg-teal-50 text-teal-700' : 'text-slate-700'}`}>
                <Icon className="h-4 w-4" />{t(label)}
              </Link>
            ))}
            {profile?.role === 'admin' && (
              <Link href="/admin/doctors" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700">
                <ShieldCheck className="h-4 w-4" />{t('navAdmin')}
              </Link>
            )}
            {profile ? (
              <>
                <Link href={profile.role === 'doctor' ? '/doctor/profile' : '/profile'} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700">
                  <User className="h-4 w-4" />{t('navProfile')}
                </Link>
                <form action="/auth/signout" method="post">
                  <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700">
                    <LogOut className="h-4 w-4" />{t('logout')}
                  </button>
                </form>
              </>
            ) : (
              <div className="mt-2 flex gap-2">
                <Link href="/login" onClick={() => setOpen(false)} className="btn btn-secondary flex-1">{t('login')}</Link>
                <Link href="/signup" onClick={() => setOpen(false)} className="btn btn-primary flex-1">{t('signup')}</Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
