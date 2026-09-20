'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { useI18n } from '@/lib/i18n/client';
import { signup } from '../actions';
import { SubmitButton } from '@/components/submit-button';
import { Alert, Field } from '@/components/ui';

export function SignupForm() {
  const { t, locale } = useI18n();
  const [state, action] = useActionState(signup, null);
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');

  if (state?.success === 'checkEmail') {
    return <div className="card"><Alert kind="success">{t('checkEmail')}</Alert></div>;
  }

  return (
    <div className="card">
      <h1 className="mb-4 text-xl font-bold">{t('signup')}</h1>
      {state?.error && <div className="mb-4"><Alert kind="error">{state.error === 'invalid' ? t('error') : state.error}</Alert></div>}
      <form action={action} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <Field label={t('iAmA')}>
          <div className="grid grid-cols-2 gap-2">
            {(['patient', 'doctor'] as const).map((r) => (
              <label key={r} className={`flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium ${role === r ? 'border-teal-600 bg-teal-50 text-teal-800' : 'border-slate-300 text-slate-700'}`}>
                <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} className="sr-only" />
                {r === 'patient' ? t('rolePatient') : t('roleDoctor')}
              </label>
            ))}
          </div>
          {role === 'doctor' && <p className="mt-2 text-xs text-slate-500">{t('doctorSignupNote')}</p>}
        </Field>
        <Field label={t('fullName')}>
          <input name="full_name" required minLength={2} maxLength={80} autoComplete="name" className="input" />
        </Field>
        <Field label={`${t('phone')} (${t('optional')})`}>
          <input name="phone" type="tel" maxLength={20} autoComplete="tel" className="input" placeholder="01XXXXXXXXX" />
        </Field>
        <Field label={t('email')}>
          <input name="email" type="email" required autoComplete="email" className="input" />
        </Field>
        <Field label={t('password')} hint={t('passwordHint')}>
          <input name="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" className="input" />
        </Field>
        <SubmitButton className="btn btn-primary w-full" pendingText={t('loading')}>{t('signup')}</SubmitButton>
      </form>
      <p className="mt-4 text-center text-sm">
        {t('haveAccount')} <Link href="/login" className="font-medium text-teal-700 hover:underline">{t('login')}</Link>
      </p>
    </div>
  );
}
