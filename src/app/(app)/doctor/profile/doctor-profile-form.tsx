'use client';

import { useActionState } from 'react';
import type { Doctor, Profile } from '@/lib/database.types';
import { useI18n } from '@/lib/i18n/client';
import type { DictKey } from '@/lib/i18n';
import { DAYS, DAY_KEYS } from '@/lib/days';
import { updateDoctorProfile } from '../../actions';
import { SubmitButton } from '@/components/submit-button';
import { Alert, Field } from '@/components/ui';

export function DoctorProfileForm({ profile, doctor }: { profile: Profile; doctor: Doctor }) {
  const { t } = useI18n();
  const [state, action] = useActionState(updateDoctorProfile, null);

  return (
    <form action={action} className="space-y-4">
      {state?.success && <Alert kind="success">{t(state.success as DictKey)}</Alert>}
      {state?.error && <Alert kind="error">{t('error')}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('fullName')}><input name="full_name" required minLength={2} maxLength={80} defaultValue={profile.full_name} className="input" /></Field>
        <Field label={t('phone')}><input name="phone" type="tel" maxLength={20} defaultValue={profile.phone ?? ''} className="input" /></Field>
        <Field label={t('specialty')}><input name="specialty" required maxLength={80} defaultValue={doctor.specialty} className="input" /></Field>
        <Field label={t('qualification')}><input name="qualification" maxLength={200} defaultValue={doctor.qualification} className="input" placeholder="MBBS, FCPS (Medicine)" /></Field>
        <Field label={t('registrationNo')}><input name="registration_no" maxLength={40} defaultValue={doctor.registration_no ?? ''} className="input" /></Field>
        <Field label={t('fee')}><input name="consultation_fee" type="number" min={0} max={100000} defaultValue={doctor.consultation_fee ?? ''} className="input" /></Field>
        <Field label={t('hospitalName')}><input name="hospital_name" maxLength={120} defaultValue={doctor.hospital_name} className="input" /></Field>
        <Field label={t('city')}><input name="city" maxLength={60} defaultValue={doctor.city} className="input" /></Field>
      </div>
      <Field label={t('chamberAddress')}><input name="chamber_address" maxLength={240} defaultValue={doctor.chamber_address} className="input" /></Field>

      <Field label={t('availableDays')}>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => (
            <label key={d} className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50">
              <input type="checkbox" name={`day_${d}`} defaultChecked={doctor.available_days.includes(d)} className="accent-teal-600" />{t(DAY_KEYS[d])}
            </label>
          ))}
        </div>
      </Field>
      <Field label={t('availableHours')}><input name="available_hours" maxLength={80} defaultValue={doctor.available_hours ?? ''} className="input" placeholder="বিকাল ৫টা – রাত ৯টা" /></Field>
      <Field label={t('bio')}><textarea name="bio" rows={3} maxLength={1000} defaultValue={doctor.bio ?? ''} className="input" /></Field>

      <div className="text-right"><SubmitButton pendingText={t('saving')}>{t('save')}</SubmitButton></div>
    </form>
  );
}
