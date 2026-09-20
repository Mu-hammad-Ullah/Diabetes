import type { Metadata } from 'next';
import Link from 'next/link';
import { getT } from '@/lib/i18n/server';
import { createClient } from '@/lib/supabase/server';
import type { AdminStats, Profile } from '@/lib/database.types';
import { fmtDateTime } from '@/lib/i18n';
import { PageHeader, Empty, Alert } from '@/components/ui';

export const metadata: Metadata = { title: 'Admin' };

function fmtBytes(b: number) {
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export default async function AdminHome() {
  const { t, locale } = await getT();
  const supabase = await createClient();
  const [{ data: statsData, error: statsError }, { data: recent }] = await Promise.all([
    supabase.rpc('admin_stats'),
    supabase.from('profiles').select('id, full_name, email, role, created_at').order('created_at', { ascending: false }).limit(8),
  ]);
  const s = (statsData ?? {}) as Partial<AdminStats>;
  const n = (v?: number) => (v ?? 0).toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US');

  const tiles: { label: string; value: string; sub?: string; href?: string }[] = [
    { label: t('statUsers'), value: n(s.users_total), sub: `${t('statNew7d')}: ${n(s.users_7d)}`, href: '/admin/users' },
    { label: t('statPatients'), value: n(s.patients), href: '/admin/users?role=patient' },
    { label: t('statDoctors'), value: `${n(s.doctors_verified)} / ${n(s.doctors_total)}`, href: '/admin/doctors' },
    { label: t('statApptsPending'), value: n(s.appts_pending), sub: `${t('statAppts')}: ${n(s.appts_total)}`, href: '/admin/appointments' },
    { label: t('statReadings'), value: n(s.readings_total), sub: `${t('statReadingsToday')}: ${n(s.readings_today)}` },
    { label: t('statReports'), value: n(s.reports_total), sub: `${t('statStorage')}: ${fmtBytes(s.reports_bytes ?? 0)} / 1 GB` },
    { label: t('statHospitals'), value: n(s.hospitals), href: '/admin/hospitals' },
    { label: t('statDirectory'), value: n(s.directory), href: '/admin/directory' },
    { label: t('statAnnouncements'), value: n(s.announcements_active), href: '/admin/announcements' },
  ];

  const users = (recent ?? []) as Pick<Profile, 'id' | 'full_name' | 'email' | 'role' | 'created_at'>[];

  return (
    <div>
      <PageHeader title={t('adminStatsTitle')} />
      {statsError && <div className="mb-4"><Alert kind="error">Database error: {statsError.message} — <code>supabase/migration_002_admin.sql</code> চালানো হয়েছে?</Alert></div>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map((tile) => {
          const inner = (
            <>
              <div className="text-xs font-medium text-slate-500">{tile.label}</div>
              <div className="mt-1 text-2xl font-bold tabular-nums">{tile.value}</div>
              {tile.sub && <div className="mt-0.5 text-xs text-slate-500">{tile.sub}</div>}
            </>
          );
          return tile.href
            ? <Link key={tile.label} href={tile.href} className="card py-4 hover:ring-teal-300">{inner}</Link>
            : <div key={tile.label} className="card py-4">{inner}</div>;
        })}
      </div>

      <div className="card mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">{t('statNew7d')}</h2>
          <Link href="/admin/users" className="text-sm text-teal-700 hover:underline">{t('viewAll')}</Link>
        </div>
        {users.length ? (
          <ul className="divide-y divide-slate-100 text-sm">
            {users.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-2 py-2">
                <Link href={`/admin/users/${u.id}`} className="min-w-0 hover:text-teal-700">
                  <div className="truncate font-medium">{u.full_name || '—'}</div>
                  <div className="truncate text-xs text-slate-500">{u.email}</div>
                </Link>
                <div className="text-right text-xs text-slate-500">
                  <span className="badge bg-slate-100 text-slate-700 ring-slate-200">{u.role}</span>
                  <div>{fmtDateTime(u.created_at, locale)}</div>
                </div>
              </li>
            ))}
          </ul>
        ) : <Empty text={t('noUsers')} />}
      </div>
    </div>
  );
}
