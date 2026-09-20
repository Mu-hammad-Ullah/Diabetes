'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Users, Hospital, Calendar, Megaphone, Stethoscope, BookUser } from 'lucide-react';
import { useI18n } from '@/lib/i18n/client';
import type { DictKey } from '@/lib/i18n';

const ITEMS: { href: string; label: DictKey; icon: React.ComponentType<{ className?: string }> }[] = [
  { href: '/admin', label: 'adminStatsTitle', icon: BarChart3 },
  { href: '/admin/users', label: 'adminUsers', icon: Users },
  { href: '/admin/doctors', label: 'adminDoctors', icon: Stethoscope },
  { href: '/admin/directory', label: 'adminDirectory', icon: BookUser },
  { href: '/admin/appointments', label: 'adminAppointments', icon: Calendar },
  { href: '/admin/hospitals', label: 'adminHospitals', icon: Hospital },
  { href: '/admin/announcements', label: 'adminAnnouncements', icon: Megaphone },
];

export function AdminNav() {
  const { t } = useI18n();
  const pathname = usePathname();
  const active = (href: string) => href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
  return (
    <div className="-mx-4 mb-6 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <nav className="flex w-max gap-1 rounded-xl bg-slate-100 p-1">
        {ITEMS.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${active(href) ? 'bg-white text-teal-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:text-slate-900'}`}>
            <Icon className="h-4 w-4" />{t(label)}
          </Link>
        ))}
      </nav>
    </div>
  );
}
