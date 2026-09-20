import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getT } from '@/lib/i18n/server';
import { getCurrentUser } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui';
import { ProfileForm } from './profile-form';

export const metadata: Metadata = { title: 'Profile' };

export default async function ProfilePage() {
  const [{ t }, { user, profile }] = await Promise.all([getT(), getCurrentUser()]);
  if (!profile) redirect('/login');
  if (profile.role === 'doctor') redirect('/doctor/profile');

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t('profileTitle')} subtitle={user!.email ?? undefined} />
      <div className="card"><ProfileForm profile={profile} /></div>
    </div>
  );
}
