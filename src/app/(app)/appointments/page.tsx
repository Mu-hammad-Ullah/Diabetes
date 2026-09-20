import type { Metadata } from 'next';
import Link from 'next/link';
import { getT } from '@/lib/i18n/server';
import { fmtDate } from '@/lib/i18n';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import type { Appointment } from '@/lib/database.types';
import { SLOT_KEYS } from '@/lib/days';
import { PageHeader, Empty, StatusBadge, Alert } from '@/components/ui';
import { CancelButton } from './cancel-button';

export const metadata: Metadata = { title: 'Appointments' };

type Row = Appointment & { doctors: { id: string; hospital_name: string; city: string; profiles: { full_name: string } | null } | null };

export default async function AppointmentsPage({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const [{ t, locale }, { user }, { sent }] = await Promise.all([getT(), getCurrentUser(), searchParams]);
  const supabase = await createClient();
  const { data } = await supabase.from('appointments')
    .select('*, doctors(id, hospital_name, city, profiles(full_name))')
    .eq('patient_id', user!.id)
    .order('requested_date', { ascending: false });
  const rows = (data ?? []) as unknown as Row[];

  return (
    <div>
      <PageHeader title={t('appointmentsTitle')} action={<Link href="/doctors" className="btn btn-primary">{t('bookAppointment')}</Link>} />
      {sent && <div className="mb-4"><Alert kind="success">{t('requestSent')}</Alert></div>}

      {rows.length ? (
        <ul className="space-y-3">
          {rows.map((a) => (
            <li key={a.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link href={`/doctors/${a.doctor_id}`} className="font-semibold hover:text-teal-700">{a.doctors?.profiles?.full_name ?? '—'}</Link>
                  <div className="text-sm text-slate-500">{a.doctors?.hospital_name}{a.doctors?.city ? `, ${a.doctors.city}` : ''}</div>
                  <div className="mt-1 text-sm">{fmtDate(a.requested_date, locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · {t(SLOT_KEYS[a.requested_slot])}</div>
                  {a.reason && <p className="mt-1 text-sm text-slate-600">{a.reason}</p>}
                  {a.doctor_note && <p className="mt-2 rounded-lg bg-slate-50 p-2 text-sm"><span className="font-medium">{t('doctorNote')}:</span> {a.doctor_note}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={a.status} t={t} />
                  {(a.status === 'pending' || a.status === 'accepted') && <CancelButton id={a.id} />}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : <Empty text={t('noAppointments')} />}
    </div>
  );
}
