import type { Metadata } from 'next';
import Link from 'next/link';
import { BadgeCheck, MapPin, Phone, Search, Stethoscope } from 'lucide-react';
import { getT } from '@/lib/i18n/server';
import { createClient } from '@/lib/supabase/server';
import type { DoctorDirectoryEntry, DoctorWithProfile } from '@/lib/database.types';
import { PageHeader, Empty } from '@/components/ui';

export const metadata: Metadata = { title: 'Doctors' };
const PAGE = 30;

export default async function DoctorsPage({ searchParams }: { searchParams: Promise<{ q?: string; city?: string; page?: string }> }) {
  const [{ t }, sp] = await Promise.all([getT(), searchParams]);
  const q = (sp.q ?? '').trim();
  const city = (sp.city ?? '').trim();
  const page = Math.max(1, parseInt(sp.page ?? '1') || 1);
  const supabase = await createClient();

  // 1) registered + verified doctors (app-এ appointment)
  let regQ = supabase.from('doctors').select('*, profiles(full_name, phone)').eq('is_verified', true).order('city');
  if (city) regQ = regQ.ilike('city', `%${city}%`);

  // 2) directory
  let dirQ = supabase.from('doctor_directory').select('*', { count: 'exact' }).eq('is_active', true)
    .order('city').order('hospital_name').order('name').range((page - 1) * PAGE, page * PAGE - 1);
  if (city) dirQ = dirQ.eq('city', city);
  if (q) {
    const like = `%${q.replace(/[%_]/g, '')}%`;
    dirQ = dirQ.or(`name.ilike.${like},hospital_name.ilike.${like},degrees.ilike.${like},designation.ilike.${like}`);
  }

  const [regRes, dirRes, cityRes] = await Promise.all([
    regQ, dirQ,
    supabase.from('doctor_directory').select('city').eq('is_active', true),
  ]);
  const registered = (regRes.data ?? []) as DoctorWithProfile[];
  const directory = (dirRes.data ?? []) as DoctorDirectoryEntry[];
  const total = dirRes.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const cityCounts = new Map<string, number>();
  for (const r of cityRes.data ?? []) cityCounts.set(r.city, (cityCounts.get(r.city) ?? 0) + 1);
  const cities = [...cityCounts.entries()].sort((a, b) => b[1] - a[1]);
  const link = (p: number) => `/doctors?${new URLSearchParams({ ...(q && { q }), ...(city && { city }), page: String(p) })}`;

  return (
    <div className="space-y-8">
      <PageHeader title={t('doctorsTitle')} subtitle={t('directorySub')} />

      <form className="flex flex-wrap gap-2">
        <div className="relative min-w-[12rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input name="q" defaultValue={q} placeholder={t('searchDoctors')} className="input pl-9" />
        </div>
        <select name="city" defaultValue={city} className="input w-auto">
          <option value="">{t('allDistricts')}</option>
          {cities.map(([c, n]) => <option key={c} value={c}>{c} ({n})</option>)}
        </select>
        <button className="btn btn-secondary">{t('search')}</button>
      </form>

      {/* registered doctors */}
      {registered.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-teal-700"><BadgeCheck className="h-4 w-4" />{t('registeredDoctors')}</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {registered.map((d) => (
              <li key={d.id}>
                <Link href={`/doctors/${d.id}`} className="card block h-full ring-teal-200 hover:ring-teal-400">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 font-semibold">{d.profiles?.full_name}<BadgeCheck className="h-4 w-4 text-teal-600" /></div>
                      <div className="text-sm text-slate-600">{d.specialty}{d.qualification ? ` · ${d.qualification}` : ''}</div>
                    </div>
                    {d.consultation_fee != null && <span className="badge bg-slate-100 text-slate-700 ring-slate-200">৳{d.consultation_fee}</span>}
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-sm text-slate-500"><MapPin className="h-4 w-4" />{d.hospital_name}{d.city ? `, ${d.city}` : ''}</div>
                  <div className="mt-2 text-sm font-medium text-teal-700">{t('bookAppointment')} →</div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* directory */}
      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500"><Stethoscope className="h-4 w-4" />{t('directoryTitle')} · {total}</h2>
          <p className="text-xs text-slate-500">{t('directoryNote')}</p>
        </div>
        {directory.length ? (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {directory.map((d) => (
              <li key={d.id} className="card flex flex-col gap-2 py-4">
                <div>
                  <div className="font-semibold leading-snug">{d.name}</div>
                  {d.designation && <div className="text-xs text-slate-500">{d.designation}</div>}
                  {d.degrees && <div className="mt-1 line-clamp-2 text-xs text-slate-600" title={d.degrees}>{d.degrees}</div>}
                </div>
                <div className="flex items-start gap-1.5 text-sm text-slate-600">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <span>{d.hospital_name}, {d.city}</span>
                </div>
                {d.phone && (
                  <a href={`tel:${d.phone.replace(/[^\d+]/g, '')}`} className="btn btn-secondary mt-auto w-full justify-start text-teal-700">
                    <Phone className="h-4 w-4" />{d.phone}
                    {d.phone_type && <span className="ml-auto text-xs font-normal text-slate-400">{d.phone_type}</span>}
                  </a>
                )}
              </li>
            ))}
          </ul>
        ) : <Empty text={t('noDirectory')} />}

        {pages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <Link href={link(page - 1)} className={`btn btn-secondary ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`}>{t('prev')}</Link>
            <span className="text-slate-500">{t('page')} {page} / {pages}</span>
            <Link href={link(page + 1)} className={`btn btn-secondary ${page >= pages ? 'pointer-events-none opacity-50' : ''}`}>{t('next')}</Link>
          </div>
        )}
      </section>

      {registered.length === 0 && directory.length === 0 && <Empty text={t('noDoctors')} />}
    </div>
  );
}
