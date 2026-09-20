import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getT } from '@/lib/i18n/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import type { DoctorWithProfile } from '@/lib/database.types';
import { PageHeader, Empty } from '@/components/ui';
import { VerifyButton } from './verify-button';

export const metadata: Metadata = { title: 'Admin' };

export default async function AdminDoctors() {
  const [{ t }, { profile }] = await Promise.all([getT(), getCurrentUser()]);
  if (profile?.role !== 'admin') redirect('/dashboard');
  const supabase = await createClient();
  const { data } = await supabase.from('doctors').select('*, profiles(full_name, phone)').order('is_verified').order('created_at', { ascending: false });
  const doctors = (data ?? []) as DoctorWithProfile[];

  return (
    <div>
      <PageHeader title={t('adminTitle')} />
      {doctors.length ? (
        <ul className="space-y-3">
          {doctors.map((d) => (
            <li key={d.id} className="card flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 text-sm">
                <div className="font-semibold">{d.profiles?.full_name || '—'} <span className={`badge ml-2 ${d.is_verified ? 'bg-emerald-100 text-emerald-800 ring-emerald-200' : 'bg-amber-100 text-amber-800 ring-amber-200'}`}>{d.is_verified ? t('verified') : t('notVerified')}</span></div>
                <div className="text-slate-600">{d.specialty}{d.qualification ? ` · ${d.qualification}` : ''}{d.registration_no ? ` · BMDC ${d.registration_no}` : ''}</div>
                <div className="text-slate-500">{d.hospital_name}{d.city ? `, ${d.city}` : ''}{d.profiles?.phone ? ` · ${d.profiles.phone}` : ''}</div>
              </div>
              <VerifyButton id={d.id} verified={d.is_verified} />
            </li>
          ))}
        </ul>
      ) : <Empty text={t('noPendingDoctors')} />}
    </div>
  );
}
