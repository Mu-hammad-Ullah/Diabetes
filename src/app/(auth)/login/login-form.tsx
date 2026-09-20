'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { useI18n } from '@/lib/i18n/client';
import { login, forgotPassword } from '../actions';
import { SubmitButton } from '@/components/submit-button';
import { Alert, Field } from '@/components/ui';

export function LoginForm({ next, callbackError }: { next?: string; callbackError?: boolean }) {
  const { t } = useI18n();
  const [state, action] = useActionState(login, null);
  const [resetState, resetAction] = useActionState(forgotPassword, null);
  const [forgot, setForgot] = useState(false);

  if (forgot) {
    return (
      <div className="card">
        <h1 className="mb-4 text-xl font-bold">{t('forgotPassword')}</h1>
        {resetState?.success && <div className="mb-4"><Alert kind="success">{t('resetSent')}</Alert></div>}
        {resetState?.error && <div className="mb-4"><Alert kind="error">{t('error')}</Alert></div>}
        <form action={resetAction} className="space-y-4">
          <Field label={t('email')}>
            <input name="email" type="email" required autoComplete="email" className="input" />
          </Field>
          <SubmitButton className="btn btn-primary w-full" pendingText={t('loading')}>{t('forgotPassword')}</SubmitButton>
        </form>
        <button onClick={() => setForgot(false)} className="mt-4 text-sm text-teal-700 hover:underline">← {t('login')}</button>
      </div>
    );
  }

  return (
    <div className="card">
      <h1 className="mb-4 text-xl font-bold">{t('login')}</h1>
      {(state?.error || callbackError) && <div className="mb-4"><Alert kind="error">{t('invalidCredentials')}</Alert></div>}
      <form action={action} className="space-y-4">
        {next && <input type="hidden" name="next" value={next} />}
        <Field label={t('email')}>
          <input name="email" type="email" required autoComplete="email" className="input" />
        </Field>
        <Field label={t('password')}>
          <input name="password" type="password" required autoComplete="current-password" className="input" />
        </Field>
        <SubmitButton className="btn btn-primary w-full" pendingText={t('loading')}>{t('login')}</SubmitButton>
      </form>
      <div className="mt-4 flex justify-between text-sm">
        <button onClick={() => setForgot(true)} className="text-slate-600 hover:underline">{t('forgotPassword')}</button>
        <span>{t('noAccount')} <Link href="/signup" className="font-medium text-teal-700 hover:underline">{t('signup')}</Link></span>
      </div>
    </div>
  );
}
