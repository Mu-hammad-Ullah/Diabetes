import type { Metadata } from 'next';
import Link from 'next/link';
import { getT } from '@/lib/i18n/server';
import { fmtDate } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/server';
import type { Appointment, AppointmentStatus } from '@/lib/database.types';
import { SLOT_KEYS } from '@/lib/days';
import { PageHeader, Empty, StatusBadge } from '@/components/ui';
import { AppointmentAdminActions } from './appointment-actions';

export const metadata: Metadata = { title: 'Appointments' };

type Row = Appointment & {
  patient: { id: string; full_name: string; phone: string | null } | null;
  doctors: { id: string; hospital_name: string; profiles: { id: string; full_name: string } | null } | null;
};
const STATUSES: AppointmentStatus[] = ['pending', 'accepted', 'completed', 'rejected', 'cancelled'];
const PAGE = 30;

export default async function AdminAppointments({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const [{ t, locale }, sp] = await Promise.all([getT(), searchParams]);
  const status = STATUSES.includes(sp.status as AppointmentStatus) ? (sp.status as AppointmentStatus) : '';
  const page = Math.max(1, parseInt(sp.page ?? '1') || 1);

  const supabase = await createClient();
  let q = supabase.from('appointments')
    .select('*, patient:profiles!appointments_patient_id_fkey(id, full_name, phone), doctors(id, hospital_name, profiles(id, full_name))', { count: 'exact' })
    .order('requested_date', { ascending: false }).range((page - 1) * PAGE, page * PAGE - 1);
  if (status) q = q.eq('status', status);
  const { data, count } = await q;
  const rows = (data ?? []) as unknown as Row[];
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE));
  const link = (p: number) => `/admin/appointments?${new URLSearchParams({ ...(status && { status }), page: String(p) })}`;
  const statusLabel = (s: AppointmentStatus) => t(`status${s.charAt(0).toUpperCase()}${s.slice(1)}` as 'statusPending');

  return (
    <div>
      <PageHeader title={t('adminAppointments')} subtitle={`${count ?? 0}`} />
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/admin/appointments" className={`rounded-full px-3 py-1 text-sm ${!status ? 'bg-teal-600 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-300'}`}>{t('allStatuses')}</Link>
        {STATUSES.map((s) => (
          <Link key={s} href={`/admin/appointments?status=${s}`} className={`rounded-full px-3 py-1 text-sm ${status === s ? 'bg-teal-600 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-300'}`}>{statusLabel(s)}</Link>
        ))}
      </div>

      {rows.length ? (
        <ul className="space-y-3">
          {rows.map((a) => (
            <li key={a.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 text-sm">
                  <div>
                    <span className="text-slate-500">{t('patient')}:</span>{' '}
                    <Link href={`/admin/users/${a.patient_id}`} className="font-semibold hover:text-teal-700">{a.patient?.full_name ?? '—'}</Link>
                    {a.patient?.phone && <span className="ml-2 text-slate-500">{a.patient.phone}</span>}
                  </div>
                  <div>
                    <span className="text-slate-500">{t('doctor')}:</span>{' '}
                    {a.doctors?.profiles ? <Link href={`/admin/users/${a.doctors.profiles.id}`} className="font-semibold hover:text-teal-700">{a.doctors.profiles.full_name}</Link> : '—'}
                    {a.doctors?.hospital_name && <span className="ml-2 text-slate-500">{a.doctors.hospital_name}</span>}
                  </div>
                  <div className="mt-1">{fmtDate(a.requested_date, locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · {t(SLOT_KEYS[a.requested_slot])}</div>
                  {a.reason && <p className="mt-1 text-slate-600">{a.reason}</p>}
                  {a.doctor_note && <p className="mt-1 text-xs text-slate-500">{t('doctorNote')}: {a.doctor_note}</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={a.status} t={t} />
                  <AppointmentAdminActions id={a.id} status={a.status} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : <Empty text={t('noAppointments')} />}

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <Link href={link(page - 1)} className={`btn btn-secondary ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`}>{t('prev')}</Link>
          <span className="text-slate-500">{t('page')} {page} / {pages}</span>
          <Link href={link(page + 1)} className={`btn btn-secondary ${page >= pages ? 'pointer-events-none opacity-50' : ''}`}>{t('next')}</Link>
        </div>
      )}
    </div>
  );
}
