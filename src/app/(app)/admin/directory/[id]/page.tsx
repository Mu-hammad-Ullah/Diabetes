import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getT } from '@/lib/i18n/server';
import { createClient } from '@/lib/supabase/server';
import type { DoctorDirectoryEntry } from '@/lib/database.types';
import { PageHeader } from '@/components/ui';
import { DirectoryForm } from '../directory-form';

export const metadata: Metadata = { title: 'Edit doctor' };

export default async function EditDirectoryDoctor({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, { t }] = await Promise.all([params, getT()]);
  const supabase = await createClient();
  const { data } = await supabase.from('doctor_directory').select('*').eq('id', id).maybeSingle();
  const doc = data as DoctorDirectoryEntry | null;
  if (!doc) notFound();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t('editDoctor')} subtitle={doc.name} backHref="/admin/directory" />
      <div className="card"><DirectoryForm doc={doc} /></div>
    </div>
  );
}
