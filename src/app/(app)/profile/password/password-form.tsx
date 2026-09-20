'use client';

import { useActionState } from 'react';
import { useI18n } from '@/lib/i18n/client';
import { updatePassword } from '@/app/(auth)/actions';
import { SubmitButton } from '@/components/submit-button';
import { Alert, Field } from '@/components/ui';

export function PasswordForm() {
  const { t } = useI18n();
  const [state, action] = useActionState(updatePassword, null);
  return (
    <form action={action} className="space-y-4">
      {state?.error && <Alert kind="error">{t('error')}</Alert>}
      <Field label={t('password')} hint={t('passwordHint')}>
        <input name="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" className="input" />
      </Field>
      <SubmitButton className="btn btn-primary w-full" pendingText={t('saving')}>{t('save')}</SubmitButton>
    </form>
  );
}
