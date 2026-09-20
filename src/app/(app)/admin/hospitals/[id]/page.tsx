import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getT } from '@/lib/i18n/server';
import { createClient } from '@/lib/supabase/server';
import type { Hospital } from '@/lib/database.types';
import { PageHeader } from '@/components/ui';
import { HospitalForm } from '../hospital-form';

export const metadata: Metadata = { title: 'Edit hospital' };

export default async function EditHospital({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, { t }] = await Promise.all([params, getT()]);
  const supabase = await createClient();
  const { data } = await supabase.from('hospitals').select('*').eq('id', id).maybeSingle();
  const hospital = data as Hospital | null;
  if (!hospital) notFound();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t('editHospital')} subtitle={hospital.name} backHref="/admin/hospitals" />
      <div className="card"><HospitalForm hospital={hospital} /></div>
    </div>
  );
}
