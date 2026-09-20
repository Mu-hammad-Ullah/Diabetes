import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CalendarClock, Users, UserCog } from 'lucide-react';
import { getT } from '@/lib/i18n/server';
import { fmtDate } from '@/lib/i18n';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import type { Appointment, Doctor } from '@/lib/database.types';
import { SLOT_KEYS } from '@/lib/days';
import { PageHeader, Alert, Empty, StatusBadge } from '@/components/ui';
import { Announcements } from '@/components/announcements';

export const metadata: Metadata = { title: 'Doctor panel' };

type Row = Appointment & { profiles: { full_name: string } | null };

export default async function DoctorHome() {
  const [{ t, locale }, { user, profile }] = await Promise.all([getT(), getCurrentUser()]);
  if (profile?.role !== 'doctor') redirect('/dashboard');
  const supabase = await createClient();

  const { data: doc } = await supabase.from('doctors').select('*').eq('profile_id', user!.id).single();
  const doctor = doc as Doctor | null;
  const today = new Date().toISOString().slice(0, 10);

  const [pendingRes, upcomingRes, patientsRes] = await Promise.all([
    supabase.from('appointments').select('*, profiles!appointments_patient_id_fkey(full_name)').eq('doctor_id', doctor?.id ?? '').eq('status', 'pending').order('requested_date').limit(5),
    supabase.from('appointments').select('*, profiles!appointments_patient_id_fkey(full_name)').eq('doctor_id', doctor?.id ?? '').eq('status', 'accepted').gte('requested_date', today).order('requested_date').limit(5),
    supabase.from('appointments').select('patient_id').eq('doctor_id', doctor?.id ?? '').in('status', ['accepted', 'completed']),
  ]);
  const pending = (pendingRes.data ?? []) as unknown as Row[];
  const upcoming = (upcomingRes.data ?? []) as unknown as Row[];
  const patientCount = new Set((patientsRes.data ?? []).map((r) => r.patient_id)).size;

  return (
    <div className="space-y-6">
      <PageHeader title={t('doctorPanelTitle')} subtitle={profile.full_name}
        action={<Link href="/doctor/profile" className="btn btn-secondary"><UserCog className="h-4 w-4" />{t('doctorProfile')}</Link>} />

      {doctor && !doctor.is_verified && <Alert kind="warning">{t('verificationPending')}</Alert>}
      <Announcements role="doctor" />

      <div className="grid grid-cols-3 gap-3">
        <div className="card py-4"><div className="text-xs text-slate-500">{t('pendingRequests')}</div><div className="text-2xl font-bold">{pending.length}</div></div>
        <div className="card py-4"><div className="text-xs text-slate-500">{t('upcomingAppointments')}</div><div className="text-2xl font-bold">{upcoming.length}</div></div>
        <div className="card py-4"><div className="text-xs text-slate-500">{t('myPatients')}</div><div className="text-2xl font-bold">{patientCount}</div></div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold"><CalendarClock className="h-4 w-4 text-amber-600" />{t('pendingRequests')}</h2>
            <Link href="/doctor/appointments" className="text-sm text-teal-700 hover:underline">{t('viewAll')}</Link>
          </div>
          {pending.length ? <List rows={pending} locale={locale} t={t} /> : <Empty text={t('none')} />}
        </section>
        <section className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold"><Users className="h-4 w-4 text-teal-600" />{t('upcomingAppointments')}</h2>
            <Link href="/doctor/appointments?status=accepted" className="text-sm text-teal-700 hover:underline">{t('viewAll')}</Link>
          </div>
          {upcoming.length ? <List rows={upcoming} locale={locale} t={t} /> : <Empty text={t('none')} />}
        </section>
      </div>
    </div>
  );
}

function List({ rows, locale, t }: { rows: Row[]; locale: 'bn' | 'en'; t: ReturnType<typeof import('@/lib/i18n').makeT> }) {
  return (
    <ul className="divide-y divide-slate-100 text-sm">
      {rows.map((a) => (
        <li key={a.id} className="flex items-center justify-between gap-2 py-2">
          <div>
            <Link href={`/doctor/patients/${a.patient_id}`} className="font-medium hover:text-teal-700">{a.profiles?.full_name ?? '—'}</Link>
            <div className="text-xs text-slate-500">{fmtDate(a.requested_date, locale)} · {t(SLOT_KEYS[a.requested_slot])}</div>
          </div>
          <StatusBadge status={a.status} t={t} />
        </li>
      ))}
    </ul>
  );
}
