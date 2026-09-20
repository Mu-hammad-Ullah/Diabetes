import type { Metadata } from 'next';
import { getT } from '@/lib/i18n/server';
import { createClient } from '@/lib/supabase/server';
import type { Hospital } from '@/lib/database.types';
import { PageHeader } from '@/components/ui';
import { HospitalFinder } from './hospital-finder';

export const metadata: Metadata = { title: 'Hospitals' };

export default async function HospitalsPage() {
  const { t } = await getT();
  const supabase = await createClient();
  // প্রাথমিক তালিকা: ডায়াবেটিস বিশেষায়িত আগে
  const { data } = await supabase.from('hospitals').select('*').order('is_diabetes_specialized', { ascending: false }).order('city').limit(60);
  const initial = (data ?? []) as Hospital[];

  return (
    <div>
      <PageHeader title={t('hospitalsTitle')} subtitle={t('hospitalsSub')} />
      <HospitalFinder initial={initial} />
    </div>
  );
}
