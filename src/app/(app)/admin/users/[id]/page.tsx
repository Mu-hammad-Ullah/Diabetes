import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getT } from '@/lib/i18n/server';
import { fmtDateTime } from '@/lib/i18n';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Profile } from '@/lib/database.types';
import { PageHeader, Alert } from '@/components/ui';
import { UserAdminPanel } from './user-admin-panel';

export const metadata: Metadata = { title: 'User' };

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ t, locale }, { user: me }] = await Promise.all([getT(), getCurrentUser()]);
  const supabase = await createClient();
  const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  const profile = data as Profile | null;
  if (!profile) notFound();

  // Auth details (শেষ লগইন, ব্লক) — service key থাকলে
  const admin = createAdminClient();
  let auth: { last_sign_in_at: string | null; email_confirmed_at: string | null; banned_until: string | null } | null = null;
  if (admin) {
    const { data: u } = await admin.auth.admin.getUserById(id);
    if (u?.user) {
      const raw = u.user as unknown as { last_sign_in_at?: string; email_confirmed_at?: string; banned_until?: string };
      auth = { last_sign_in_at: raw.last_sign_in_at ?? null, email_confirmed_at: raw.email_confirmed_at ?? null, banned_until: raw.banned_until ?? null };
    }
  }
  const isBlocked = !!auth?.banned_until && new Date(auth.banned_until) > new Date();

  const [{ count: readings }, { count: reports }, { count: appts }] = await Promise.all([
    supabase.from('glucose_readings').select('id', { count: 'exact', head: true }).eq('user_id', id),
    supabase.from('reports').select('id', { count: 'exact', head: true }).eq('user_id', id),
    supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('patient_id', id),
  ]);

  return (
    <div>
      <PageHeader title={profile.full_name || '—'} subtitle={profile.email ?? undefined} backHref="/admin/users" />
      {!admin && <div className="mb-4"><Alert kind="warning">{t('secretKeyMissing')}</Alert></div>}

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          <div className="card text-sm">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
              <dt className="text-slate-500">{t('role')}</dt><dd className="font-medium">{profile.role}</dd>
              <dt className="text-slate-500">{t('phone')}</dt><dd>{profile.phone ?? '—'}</dd>
              <dt className="text-slate-500">{t('joined')}</dt><dd>{fmtDateTime(profile.created_at, locale)}</dd>
              {auth && (<>
                <dt className="text-slate-500">{t('lastSignIn')}</dt><dd>{auth.last_sign_in_at ? fmtDateTime(auth.last_sign_in_at, locale) : '—'}</dd>
                <dt className="text-slate-500">{t('emailConfirmed')}</dt><dd>{auth.email_confirmed_at ? t('yes') : t('no')}</dd>
                <dt className="text-slate-500">{t('blocked')}</dt><dd>{isBlocked ? <span className="badge bg-red-100 text-red-800 ring-red-200">{t('yes')}</span> : t('no')}</dd>
              </>)}
            </dl>
          </div>
          <div className="card text-sm">
            <h3 className="mb-2 font-semibold">{t('userData')}</h3>
            <ul className="space-y-1">
              <li>{t('statReadings')}: <strong>{readings ?? 0}</strong></li>
              <li>{t('statReports')}: <strong>{reports ?? 0}</strong></li>
              <li>{t('appointmentsTitle')}: <strong>{appts ?? 0}</strong></li>
            </ul>
            {profile.role !== 'admin' && (
              <Link href={`/doctor/patients/${id}`} className="mt-3 inline-block text-teal-700 hover:underline">{t('patientData')} →</Link>
            )}
          </div>
        </div>

        <div className="lg:col-span-3">
          <UserAdminPanel profile={profile} isSelf={me!.id === id} isBlocked={isBlocked} hasAdminKey={!!admin} />
        </div>
      </div>
    </div>
  );
}
