import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Activity, Calendar, FileText, Hospital, Plus, Stethoscope } from 'lucide-react';
import { getT } from '@/lib/i18n/server';
import { fmtDate, fmtDateTime } from '@/lib/i18n';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import type { Appointment, GlucoseReading, Report } from '@/lib/database.types';
import { BADGE_CLASS, classify, READING_TYPE_LABEL } from '@/lib/glucose';
import { GlucoseAdvice } from '@/components/glucose-advice';
import { StatusBadge, Empty } from '@/components/ui';

export const metadata: Metadata = { title: 'Dashboard' };

function bmiOf(h?: number | null, w?: number | null) {
  if (!h || !w) return null;
  const m = h / 100;
  return w / (m * m);
}

export default async function DashboardPage() {
  const [{ t, locale }, { user, profile }] = await Promise.all([getT(), getCurrentUser()]);
  if (profile?.role === 'doctor') redirect('/doctor');
  const supabase = await createClient();

  const since30 = new Date(); since30.setDate(since30.getDate() - 30);
  const today = new Date().toISOString().slice(0, 10);

  const [readingsRes, apptRes, reportsRes] = await Promise.all([
    supabase.from('glucose_readings').select('*').eq('user_id', user!.id).gte('measured_at', since30.toISOString()).order('measured_at', { ascending: false }),
    supabase.from('appointments').select('*, doctors(hospital_name, city, profiles(full_name))').eq('patient_id', user!.id)
      .in('status', ['pending', 'accepted']).gte('requested_date', today).order('requested_date').limit(3),
    supabase.from('reports').select('id, title, report_date, hba1c').eq('user_id', user!.id).order('report_date', { ascending: false }).limit(3),
  ]);

  const readings = (readingsRes.data ?? []) as GlucoseReading[];
  const latest = readings[0];
  const since7 = new Date(); since7.setDate(since7.getDate() - 7);
  const avg = (list: GlucoseReading[]) => list.length ? list.reduce((s, r) => s + Number(r.value_mmol), 0) / list.length : null;
  const avg7 = avg(readings.filter((r) => new Date(r.measured_at) >= since7));
  const avg30 = avg(readings);

  type ApptRow = Appointment & { doctors: { hospital_name: string; city: string; profiles: { full_name: string } | null } | null };
  const appts = (apptRes.data ?? []) as unknown as ApptRow[];
  const reports = (reportsRes.data ?? []) as Pick<Report, 'id' | 'title' | 'report_date' | 'hba1c'>[];

  const bmi = bmiOf(profile?.height_cm, profile?.weight_kg);
  const bmiLabel = bmi == null ? null : bmi < 18.5 ? t('bmiUnderweight') : bmi < 23 ? t('bmiNormal') : bmi < 27.5 ? t('bmiOverweight') : t('bmiObese');

  const actions = [
    { href: '/readings', icon: Activity, label: t('addReading') },
    { href: '/reports', icon: FileText, label: t('uploadReport') },
    { href: '/doctors', icon: Stethoscope, label: t('bookAppointment') },
    { href: '/hospitals', icon: Hospital, label: t('findNearMe') },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('welcome')}, {profile?.full_name || ''}</h1>
        <p className="text-sm text-slate-500">{fmtDate(new Date(), locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* stat tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={t('lastReading')} value={latest ? `${Number(latest.value_mmol).toFixed(1)}` : '—'}
          sub={latest ? READING_TYPE_LABEL[locale][latest.reading_type] : undefined}
          badge={latest ? BADGE_CLASS[classify(Number(latest.value_mmol), latest.reading_type).color] : undefined} />
        <Stat label={t('avg7')} value={avg7 != null ? avg7.toFixed(1) : '—'} sub="mmol/L" />
        <Stat label={t('avg30')} value={avg30 != null ? avg30.toFixed(1) : '—'} sub="mmol/L" />
        <Stat label={t('bmi')} value={bmi != null ? bmi.toFixed(1) : '—'} sub={bmiLabel ?? t('setHeightWeight')} />
      </div>

      {latest ? (
        <GlucoseAdvice value={Number(latest.value_mmol)} type={latest.reading_type} locale={locale} title={`${t('lastReading')} · ${fmtDateTime(latest.measured_at, locale)}`} />
      ) : (
        <div className="card flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-slate-600">{t('noReadingsYet')}</p>
          <Link href="/readings" className="btn btn-primary"><Plus className="h-4 w-4" />{t('addReading')}</Link>
        </div>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{t('quickActions')}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {actions.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href} className="card flex items-center gap-3 py-4 hover:ring-teal-300">
              <Icon className="h-5 w-5 text-teal-600" /><span className="text-sm font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">{t('upcomingAppointments')}</h2>
            <Link href="/appointments" className="text-sm text-teal-700 hover:underline">{t('viewAll')}</Link>
          </div>
          {appts.length ? (
            <ul className="divide-y divide-slate-100">
              {appts.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <div>
                    <div className="font-medium">{a.doctors?.profiles?.full_name ?? '—'}</div>
                    <div className="text-xs text-slate-500">{fmtDate(a.requested_date, locale)} · {t(a.requested_slot === 'morning' ? 'slotMorning' : a.requested_slot === 'afternoon' ? 'slotAfternoon' : 'slotEvening')}</div>
                  </div>
                  <StatusBadge status={a.status} t={t} />
                </li>
              ))}
            </ul>
          ) : <Empty text={t('noAppointments')} />}
        </section>

        <section className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">{t('recentReports')}</h2>
            <Link href="/reports" className="text-sm text-teal-700 hover:underline">{t('viewAll')}</Link>
          </div>
          {reports.length ? (
            <ul className="divide-y divide-slate-100">
              {reports.map((r) => (
                <li key={r.id} className="py-2 text-sm">
                  <Link href={`/reports/${r.id}`} className="flex items-center justify-between gap-2 hover:text-teal-700">
                    <span className="font-medium">{r.title}</span>
                    <span className="text-xs text-slate-500">{fmtDate(r.report_date, locale)}{r.hba1c != null ? ` · HbA1c ${r.hba1c}%` : ''}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <Empty text={t('noReports')} />}
        </section>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500"><Calendar className="h-3.5 w-3.5" />{t('disclaimerShort')}</div>
    </div>
  );
}

function Stat({ label, value, sub, badge }: { label: string; value: string; sub?: string; badge?: string }) {
  return (
    <div className="card py-4">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-bold tabular-nums">{value}</span>
        {badge && <span className={`badge ${badge}`}>{sub}</span>}
      </div>
      {!badge && sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  );
}
