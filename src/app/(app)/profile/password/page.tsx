import type { Metadata } from 'next';
import { getT } from '@/lib/i18n/server';
import { PageHeader } from '@/components/ui';
import { PasswordForm } from './password-form';

export const metadata: Metadata = { title: 'Password' };

export default async function PasswordPage() {
  const { t } = await getT();
  return (
    <div className="mx-auto max-w-md">
      <PageHeader title={t('password')} backHref="/profile" />
      <div className="card"><PasswordForm /></div>
    </div>
  );
}
