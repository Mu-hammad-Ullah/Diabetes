import type { Metadata } from 'next';
import { getT } from '@/lib/i18n/server';
import { PageHeader } from '@/components/ui';
import { DirectoryForm } from '../directory-form';

export const metadata: Metadata = { title: 'Add doctor' };

export default async function NewDirectoryDoctor() {
  const { t } = await getT();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t('addDoctor')} backHref="/admin/directory" />
      <div className="card"><DirectoryForm /></div>
    </div>
  );
}
