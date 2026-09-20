'use client';

import { useActionState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import type { Hospital } from '@/lib/database.types';
import { useI18n } from '@/lib/i18n/client';
import type { DictKey } from '@/lib/i18n';
import { Alert, Field } from '@/components/ui';
import { SubmitButton } from '@/components/submit-button';
import { adminDeleteHospital, adminSaveHospital } from '../actions';

export function HospitalForm({ hospital }: { hospital?: Hospital }) {
  const { t } = useI18n();
  const [state, action] = useActionState(adminSaveHospital, null);
  const [pending, start] = useTransition();

  return (
    <form action={action} className="space-y-4">
      {state?.success && <Alert kind="success">{t(state.success as DictKey)}</Alert>}
      {state?.error && <Alert kind="error">{t(state.error as DictKey)}</Alert>}
      {hospital && <input type="hidden" name="id" value={hospital.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('hospitalNameEn')}><input name="name" required maxLength={160} defaultValue={hospital?.name ?? ''} className="input" /></Field>
        <Field label={t('hospitalNameBn')}><input name="name_bn" maxLength={160} defaultValue={hospital?.name_bn ?? ''} className="input" /></Field>
        <Field label={t('hospitalType')}>
          <select name="type" defaultValue={hospital?.type ?? 'hospital'} className="input">
            <option value="hospital">{t('typeHospital')}</option>
            <option value="clinic">{t('typeClinic')}</option>
            <option value="diabetic_center">{t('typeDiabetic')}</option>
          </select>
        </Field>
        <Field label={t('city')}><input name="city" required maxLength={80} defaultValue={hospital?.city ?? ''} className="input" /></Field>
        <div className="sm:col-span-2"><Field label={t('address')}><input name="address" maxLength={240} defaultValue={hospital?.address ?? ''} className="input" /></Field></div>
        <Field label={t('latitude')} hint={t('latLngHint')}><input name="lat" type="number" step="any" required min={-90} max={90} defaultValue={hospital?.lat ?? ''} className="input" placeholder="23.7391" /></Field>
        <Field label={t('longitude')}><input name="lng" type="number" step="any" required min={-180} max={180} defaultValue={hospital?.lng ?? ''} className="input" placeholder="90.3959" /></Field>
        <Field label={t('phone')}><input name="phone" maxLength={40} defaultValue={hospital?.phone ?? ''} className="input" /></Field>
        <Field label={t('website')}><input name="website" type="url" maxLength={200} defaultValue={hospital?.website ?? ''} className="input" placeholder="https://" /></Field>
        <Field label={t('countryCode')}><input name="country_code" maxLength={2} minLength={2} defaultValue={hospital?.country_code ?? 'BD'} className="input uppercase" /></Field>
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input type="checkbox" name="is_diabetes_specialized" defaultChecked={hospital?.is_diabetes_specialized ?? false} className="accent-teal-600" />
          {t('diabetesSpecialized')}
        </label>
      </div>
      <div className="flex items-center justify-between">
        {hospital ? (
          <button type="button" disabled={pending} className="btn btn-danger"
            onClick={() => { if (confirm(t('confirmDelete'))) start(() => adminDeleteHospital(hospital.id)); }}>
            <Trash2 className="h-4 w-4" />{t('delete')}
          </button>
        ) : <span />}
        <SubmitButton pendingText={t('saving')}>{t('save')}</SubmitButton>
      </div>
    </form>
  );
}
