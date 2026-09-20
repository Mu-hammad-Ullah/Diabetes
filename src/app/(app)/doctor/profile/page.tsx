import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getT } from '@/lib/i18n/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import type { Doctor } from '@/lib/database.types';
import { PageHeader, Alert } from '@/components/ui';
import { DoctorProfileForm } from './doctor-profile-form';

export const metadata: Metadata = { title: 'Doctor profile' };

export default async function DoctorProfilePage() {
  const [{ t }, { user, profile }] = await Promise.all([getT(), getCurrentUser()]);
  if (profile?.role !== 'doctor') redirect('/profile');
  const supabase = await createClient();
  const { data } = await supabase.from('doctors').select('*').eq('profile_id', user!.id).single();
  const doctor = data as Doctor | null;
  if (!doctor) redirect('/doctor');

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t('doctorProfile')} subtitle={user!.email ?? undefined} backHref="/doctor" />
      {!doctor.is_verified && <div className="mb-4"><Alert kind="warning">{t('verificationPending')}</Alert></div>}
      <div className="card"><DoctorProfileForm profile={profile} doctor={doctor} /></div>
      <div className="mt-4 text-right"><Link href="/profile/password" className="text-sm text-teal-700 hover:underline">{t('password')}</Link></div>
    </div>
  );
}
