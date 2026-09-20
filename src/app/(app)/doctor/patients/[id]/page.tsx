import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { FileText } from 'lucide-react';
import { getT } from '@/lib/i18n/server';
import { fmtDate } from '@/lib/i18n';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import type { GlucoseReading, Profile, Report } from '@/lib/database.types';
import { BADGE_CLASS, classifyHba1c } from '@/lib/glucose';
import { PageHeader, Empty, Alert } from '@/components/ui';
import { ReadingsChart } from '@/app/(app)/readings/readings-chart';
import { ReadingsList } from '@/app/(app)/readings/readings-list';

export const metadata: Metadata = { title: 'Patient' };

function ageFrom(dob: string) {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}

const DT = { type1: 'type1', type2: 'type2', gestational: 'gestational', prediabetes: 'prediabetes', unknown: 'unknown' } as const;

export default async function PatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ t, locale }, { profile }] = await Promise.all([getT(), getCurrentUser()]);
  if (profile?.role !== 'doctor' && profile?.role !== 'admin') redirect('/dashboard');
  const supabase = await createClient();

  // RLS: accepted/completed appointment না থাকলে profile-ই আসবে না
  const { data: p } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  const patient = p as Profile | null;
  if (!patient) notFound();

  const since = new Date(); since.setDate(since.getDate() - 90);
  const [readingsRes, reportsRes] = await Promise.all([
    supabase.from('glucose_readings').select('*').eq('user_id', id).gte('measured_at', since.toISOString()).order('measured_at', { ascending: false }).limit(200),
    supabase.from('reports').select('*').eq('user_id', id).order('report_date', { ascending: false }),
  ]);
  const readings = (readingsRes.data ?? []) as GlucoseReading[];
  const reports = (reportsRes.data ?? []) as Report[];
  const age = patient.date_of_birth ? ageFrom(patient.date_of_birth) : null;

  return (
    <div className="space-y-6">
      <PageHeader title={patient.full_name} backHref="/doctor/appointments"
        subtitle={[patient.phone, age != null ? `${age}y` : null, patient.gender ? t(patient.gender) : null, t(DT[patient.diabetes_type]), patient.diagnosed_year ? `${t('diagnosedYear')}: ${patient.diagnosed_year}` : null].filter(Boolean).join(' · ')} />

      {readings.length === 0 && reports.length === 0 && <Alert kind="info">{t('none')}</Alert>}

      {readings.length > 1 && (
        <div className="card"><h2 className="mb-3 font-semibold">{t('trend')}</h2><ReadingsChart readings={readings} /></div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="card lg:col-span-3">
          <h2 className="mb-3 font-semibold">{t('history')}</h2>
          {readings.length ? <ReadingsList readings={readings} readOnly /> : <Empty text={t('noReadings')} />}
        </div>
        <div className="card lg:col-span-2">
          <h2 className="mb-3 font-semibold">{t('reportsTitle')}</h2>
          {reports.length ? (
            <ul className="divide-y divide-slate-100 text-sm">
              {reports.map((r) => (
                <li key={r.id} className="py-2">
                  <Link href={`/reports/${r.id}`} className="flex items-center gap-2 hover:text-teal-700">
                    <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="min-w-0 flex-1 truncate font-medium">{r.title}</span>
                    <span className="text-xs text-slate-500">{fmtDate(r.report_date, locale)}</span>
                    {r.hba1c != null && <span className={`badge ${BADGE_CLASS[classifyHba1c(Number(r.hba1c)).color]}`}>{Number(r.hba1c).toFixed(1)}%</span>}
                  </Link>
                </li>
              ))}
            </ul>
          ) : <Empty text={t('noReports')} />}
        </div>
      </div>
    </div>
  );
}
