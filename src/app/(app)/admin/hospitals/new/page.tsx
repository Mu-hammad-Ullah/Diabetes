import type { Metadata } from 'next';
import { getT } from '@/lib/i18n/server';
import { PageHeader } from '@/components/ui';
import { HospitalForm } from '../hospital-form';

export const metadata: Metadata = { title: 'Add hospital' };

export default async function NewHospital() {
  const { t } = await getT();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t('addHospital')} backHref="/admin/hospitals" />
      <div className="card"><HospitalForm /></div>
    </div>
  );
}
