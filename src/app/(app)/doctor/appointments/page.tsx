import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getT } from '@/lib/i18n/server';
import { fmtDate } from '@/lib/i18n';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import type { Appointment, AppointmentStatus } from '@/lib/database.types';
import { SLOT_KEYS } from '@/lib/days';
import { PageHeader, Empty, StatusBadge } from '@/components/ui';
import { StatusActions } from './status-actions';

export const metadata: Metadata = { title: 'Appointments' };

type Row = Appointment & { profiles: { full_name: string; phone: string | null } | null };
const FILTERS: (AppointmentStatus | 'all')[] = ['pending', 'accepted', 'completed', 'rejected', 'cancelled', 'all'];

export default async function DoctorAppointments({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const [{ t, locale }, { user, profile }, { status }] = await Promise.all([getT(), getCurrentUser(), searchParams]);
  if (profile?.role !== 'doctor') redirect('/dashboard');
  const supabase = await createClient();
  const { data: doc } = await supabase.from('doctors').select('id').eq('profile_id', user!.id).single();

  const filter = (FILTERS.includes(status as AppointmentStatus) ? status : 'pending') as AppointmentStatus | 'all';
  let q = supabase.from('appointments').select('*, profiles!appointments_patient_id_fkey(full_name, phone)').eq('doctor_id', doc?.id ?? '').order('requested_date');
  if (filter !== 'all') q = q.eq('status', filter);
  const rows = ((await q).data ?? []) as unknown as Row[];

  const label = (f: typeof filter) => f === 'all' ? '∗' : t(`status${f.charAt(0).toUpperCase()}${f.slice(1)}` as 'statusPending');

  return (
    <div>
      <PageHeader title={t('appointmentsTitle')} />
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link key={f} href={`/doctor/appointments?status=${f}`} className={`rounded-full px-3 py-1 text-sm ${filter === f ? 'bg-teal-600 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-300'}`}>{label(f)}</Link>
        ))}
      </div>

      {rows.length ? (
        <ul className="space-y-3">
          {rows.map((a) => (
            <li key={a.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/doctor/patients/${a.patient_id}`} className="font-semibold hover:text-teal-700">{a.profiles?.full_name ?? '—'}</Link>
                  {a.profiles?.phone && <span className="ml-2 text-sm text-slate-500">{a.profiles.phone}</span>}
                  <div className="mt-1 text-sm">{fmtDate(a.requested_date, locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · {t(SLOT_KEYS[a.requested_slot])}</div>
                  {a.reason && <p className="mt-1 text-sm text-slate-600">{a.reason}</p>}
                  {a.doctor_note && <p className="mt-1 text-xs text-slate-500">{t('doctorNote')}: {a.doctor_note}</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={a.status} t={t} />
                  <StatusActions id={a.id} status={a.status} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : <Empty text={t('noAppointments')} />}
    </div>
  );
}
