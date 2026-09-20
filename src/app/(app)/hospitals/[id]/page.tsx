import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BadgeCheck, ExternalLink, MapPin, Navigation, Phone, Star } from 'lucide-react';
import { getT } from '@/lib/i18n/server';
import { createClient } from '@/lib/supabase/server';
import type { DoctorDirectoryEntry, DoctorWithProfile, Hospital } from '@/lib/database.types';
import { PageHeader, Empty } from '@/components/ui';
import { DoctorCard, telHref } from '@/components/doctor-card';
import { HospitalMiniMap } from './mini-map';

export const metadata: Metadata = { title: 'Hospital' };

export default async function HospitalPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, { t, locale }] = await Promise.all([params, getT()]);
  const supabase = await createClient();
  const { data } = await supabase.from('hospitals').select('*').eq('id', id).maybeSingle();
  const h = data as Hospital | null;
  if (!h) notFound();

  const [dirRes, regRes] = await Promise.all([
    // linked (hospital_id) অথবা নাম মিললে
    supabase.from('doctor_directory').select('*').eq('is_active', true)
      .or(`hospital_id.eq.${id},hospital_name.eq.${JSON.stringify(h.name)}`).order('name'),
    supabase.from('doctors').select('*, profiles(full_name, phone)').eq('is_verified', true).ilike('hospital_name', `%${h.name.split(',')[0]}%`),
  ]);
  const directory = (dirRes.data ?? []) as DoctorDirectoryEntry[];
  const registered = (regRes.data ?? []) as DoctorWithProfile[];
  const name = locale === 'bn' && h.name_bn ? h.name_bn : h.name;
  const typeLabel = h.type === 'diabetic_center' ? t('typeDiabetic') : h.type === 'clinic' ? t('typeClinic') : t('typeHospital');

  return (
    <div className="space-y-6">
      <PageHeader title={name} subtitle={locale === 'bn' && h.name_bn ? h.name : undefined} backHref="/hospitals" />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="card space-y-3 text-sm lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge bg-slate-100 text-slate-700 ring-slate-200">{typeLabel}</span>
            {h.is_diabetes_specialized && <span className="badge bg-amber-100 text-amber-800 ring-amber-200"><Star className="mr-1 h-3 w-3 fill-amber-500 text-amber-500" />{t('diabetesSpecialized')}</span>}
          </div>
          <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /><span>{[h.address, h.city].filter(Boolean).join(', ')}</span></div>
          {h.phone && <a href={telHref(h.phone)} className="flex items-center gap-2 text-teal-700 hover:underline"><Phone className="h-4 w-4" />{h.phone}</a>}
          {h.website && <a href={h.website} target="_blank" rel="noopener" className="flex items-center gap-2 text-teal-700 hover:underline"><ExternalLink className="h-4 w-4" />{t('openWebsite')}</a>}
          <div className="flex flex-wrap gap-2 pt-2">
            {h.phone && <a href={telHref(h.phone)} className="btn btn-primary"><Phone className="h-4 w-4" />{t('callHospital')}</a>}
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}`} target="_blank" rel="noopener" className="btn btn-secondary"><Navigation className="h-4 w-4" />{t('directions')}</a>
          </div>
        </div>
        <div className="lg:col-span-3"><HospitalMiniMap lat={h.lat} lng={h.lng} name={name} /></div>
      </div>

      {registered.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-teal-700"><BadgeCheck className="h-4 w-4" />{t('registeredDoctors')}</h2>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {registered.map((d) => (
              <li key={d.id}>
                <Link href={`/doctors/${d.id}`} className="card block h-full ring-teal-200 hover:ring-teal-400">
                  <div className="flex items-center gap-1.5 font-semibold">{d.profiles?.full_name}<BadgeCheck className="h-4 w-4 text-teal-600" /></div>
                  <div className="text-sm text-slate-600">{d.specialty}{d.qualification ? ` · ${d.qualification}` : ''}</div>
                  <div className="mt-2 text-sm font-medium text-teal-700">{t('bookAppointment')} →</div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{t('doctorsAtHospital')} · {directory.length}</h2>
        {directory.length ? (
          <>
            <p className="mb-3 text-xs text-slate-500">{t('appointmentHow')}</p>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{directory.map((d) => <DoctorCard key={d.id} d={d} hideHospital />)}</ul>
          </>
        ) : <Empty text={t('noDoctorsAtHospital')} />}
      </section>
    </div>
  );
}
