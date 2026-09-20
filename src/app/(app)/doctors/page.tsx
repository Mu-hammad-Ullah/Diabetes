import type { Metadata } from 'next';
import Link from 'next/link';
import { BadgeCheck, MapPin, Search } from 'lucide-react';
import { getT } from '@/lib/i18n/server';
import { createClient } from '@/lib/supabase/server';
import type { DoctorWithProfile } from '@/lib/database.types';
import { PageHeader, Empty } from '@/components/ui';

export const metadata: Metadata = { title: 'Doctors' };

export default async function DoctorsPage({ searchParams }: { searchParams: Promise<{ city?: string }> }) {
  const [{ t }, { city }] = await Promise.all([getT(), searchParams]);
  const supabase = await createClient();

  let q = supabase.from('doctors').select('*, profiles(full_name, phone)').eq('is_verified', true).order('city');
  if (city?.trim()) q = q.ilike('city', `%${city.trim()}%`);
  const { data } = await q;
  const doctors = (data ?? []) as DoctorWithProfile[];

  return (
    <div>
      <PageHeader title={t('doctorsTitle')} subtitle={t('doctorsSub')} />

      <form className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input name="city" defaultValue={city ?? ''} placeholder={t('searchCity')} className="input pl-9" />
        </div>
        <button className="btn btn-secondary">{t('searchCity')}</button>
      </form>

      {doctors.length ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {doctors.map((d) => (
            <li key={d.id}>
              <Link href={`/doctors/${d.id}`} className="card block h-full hover:ring-teal-300">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold">
                      {d.profiles?.full_name}
                      <BadgeCheck className="h-4 w-4 text-teal-600" aria-label={t('verified')} />
                    </div>
                    <div className="text-sm text-slate-600">{d.specialty}{d.qualification ? ` · ${d.qualification}` : ''}</div>
                  </div>
                  {d.consultation_fee != null && <span className="badge bg-slate-100 text-slate-700 ring-slate-200">৳{d.consultation_fee}</span>}
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-sm text-slate-500">
                  <MapPin className="h-4 w-4" />{d.hospital_name}{d.city ? `, ${d.city}` : ''}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : <Empty text={t('noDoctors')} />}
    </div>
  );
}
