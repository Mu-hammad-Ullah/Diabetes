import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ExternalLink, GraduationCap, Hospital as HospitalIcon, MapPin, Phone, Stethoscope } from 'lucide-react';
import { getT } from '@/lib/i18n/server';
import { createClient } from '@/lib/supabase/server';
import type { DoctorDirectoryEntry, Hospital } from '@/lib/database.types';
import { PageHeader } from '@/components/ui';
import { DoctorCard, hospitalLabel, telHref } from '@/components/doctor-card';

export const metadata: Metadata = { title: 'Doctor' };

export default async function DirectoryDoctorPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, { t, locale }] = await Promise.all([params, getT()]);
  const supabase = await createClient();
  const { data } = await supabase.from('doctor_directory').select('*').eq('id', id).eq('is_active', true).maybeSingle();
  const d = data as DoctorDirectoryEntry | null;
  if (!d) notFound();

  const [hospRes, othersRes] = await Promise.all([
    d.hospital_id ? supabase.from('hospitals').select('*').eq('id', d.hospital_id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from('doctor_directory').select('*').eq('is_active', true).eq('hospital_name', d.hospital_name).neq('id', d.id).order('name').limit(12),
  ]);
  const hospital = (hospRes.data ?? null) as Hospital | null;
  const others = (othersRes.data ?? []) as DoctorDirectoryEntry[];
  const hospitalName = hospital && locale === 'bn' && hospital.name_bn ? hospital.name_bn : d.hospital_name;

  return (
    <div className="space-y-6">
      <PageHeader title={d.name} subtitle={d.designation ?? undefined} backHref="/doctors" />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="card space-y-3 text-sm lg:col-span-3">
          <div className="flex items-start gap-2"><Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /><span>{d.specialty}</span></div>
          {d.degrees && <div className="flex items-start gap-2"><GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /><span className="text-slate-700">{d.degrees}</span></div>}
          <div className="flex items-start gap-2">
            <HospitalIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <span>
              {hospital ? <Link href={`/hospitals/${hospital.id}`} className="font-medium text-teal-700 hover:underline">{hospitalName}</Link> : <span className="font-medium">{hospitalLabel(d.hospital_name, d.city)}</span>}
              {d.branch && !d.hospital_name.includes(d.branch) && <span className="text-slate-500"> · {d.branch}</span>}
            </span>
          </div>
          {hospital && (
            <div className="flex items-start gap-2 text-slate-600"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /><span>{[hospital.address, hospital.city].filter(Boolean).join(', ')}</span></div>
          )}
          {d.source_url && <a href={d.source_url} target="_blank" rel="noopener" className="flex items-center gap-2 text-xs text-slate-500 hover:underline"><ExternalLink className="h-3.5 w-3.5" />{t('source')}</a>}
        </div>

        <div className="card lg:col-span-2">
          <h2 className="mb-1 font-semibold">{t('callForAppointment')}</h2>
          <p className="mb-3 text-xs text-slate-500">{t('directoryNote')}</p>
          {d.phone ? (
            <a href={telHref(d.phone)} className="btn btn-primary w-full text-base"><Phone className="h-5 w-5" />{d.phone}</a>
          ) : hospital?.phone ? (
            <a href={telHref(hospital.phone)} className="btn btn-primary w-full text-base"><Phone className="h-5 w-5" />{hospital.phone}</a>
          ) : <p className="text-sm text-slate-500">—</p>}
          {d.phone_type && <p className="mt-2 text-center text-xs text-slate-400">{d.phone_type}</p>}
          {hospital && <Link href={`/hospitals/${hospital.id}`} className="btn btn-secondary mt-3 w-full">{t('viewHospital')}</Link>}
        </div>
      </div>

      {others.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{t('otherDoctorsHere')} · {others.length}</h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{others.map((o) => <DoctorCard key={o.id} d={o} hideHospital />)}</ul>
        </section>
      )}
    </div>
  );
}
