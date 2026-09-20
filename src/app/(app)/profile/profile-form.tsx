'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import type { Profile } from '@/lib/database.types';
import { useI18n } from '@/lib/i18n/client';
import type { DictKey } from '@/lib/i18n';
import { updateProfile } from '../actions';
import { SubmitButton } from '@/components/submit-button';
import { Alert, Field } from '@/components/ui';

export function ProfileForm({ profile }: { profile: Profile }) {
  const { t } = useI18n();
  const [state, action] = useActionState(updateProfile, null);
  const year = new Date().getFullYear();

  return (
    <form action={action} className="space-y-4">
      {state?.success && <Alert kind="success">{t(state.success as DictKey)}</Alert>}
      {state?.error && <Alert kind="error">{t('error')}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('fullName')}><input name="full_name" required minLength={2} maxLength={80} defaultValue={profile.full_name} className="input" /></Field>
        <Field label={t('phone')}><input name="phone" type="tel" maxLength={20} defaultValue={profile.phone ?? ''} className="input" /></Field>
        <Field label={t('dateOfBirth')}><input name="date_of_birth" type="date" defaultValue={profile.date_of_birth ?? ''} className="input" /></Field>
        <Field label={t('gender')}>
          <select name="gender" defaultValue={profile.gender ?? ''} className="input">
            <option value="">—</option>
            <option value="male">{t('male')}</option>
            <option value="female">{t('female')}</option>
            <option value="other">{t('other')}</option>
          </select>
        </Field>
        <Field label={t('diabetesType')}>
          <select name="diabetes_type" defaultValue={profile.diabetes_type} className="input">
            <option value="type2">{t('type2')}</option>
            <option value="type1">{t('type1')}</option>
            <option value="gestational">{t('gestational')}</option>
            <option value="prediabetes">{t('prediabetes')}</option>
            <option value="unknown">{t('unknown')}</option>
          </select>
        </Field>
        <Field label={t('diagnosedYear')}><input name="diagnosed_year" type="number" min={1900} max={year} defaultValue={profile.diagnosed_year ?? ''} className="input" /></Field>
        <Field label={t('height')}><input name="height_cm" type="number" step="0.1" min={50} max={250} inputMode="decimal" defaultValue={profile.height_cm ?? ''} className="input" /></Field>
        <Field label={t('weight')}><input name="weight_kg" type="number" step="0.1" min={10} max={400} inputMode="decimal" defaultValue={profile.weight_kg ?? ''} className="input" /></Field>
        <Field label={t('preferredLanguage')}>
          <select name="locale" defaultValue={profile.locale} className="input">
            <option value="bn">বাংলা</option>
            <option value="en">English</option>
          </select>
        </Field>
      </div>

      <div className="flex items-center justify-between">
        <Link href="/profile/password" className="text-sm text-teal-700 hover:underline">{t('password')}</Link>
        <SubmitButton pendingText={t('saving')}>{t('save')}</SubmitButton>
      </div>
    </form>
  );
}
