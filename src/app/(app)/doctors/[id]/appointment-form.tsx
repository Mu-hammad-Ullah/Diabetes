'use client';

import { useActionState } from 'react';
import { useI18n } from '@/lib/i18n/client';
import type { DictKey } from '@/lib/i18n';
import { requestAppointment } from '../../actions';
import { SubmitButton } from '@/components/submit-button';
import { Alert, Field } from '@/components/ui';

export function AppointmentForm({ doctorId }: { doctorId: string }) {
  const { t } = useI18n();
  const [state, action] = useActionState(requestAppointment, null);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="doctor_id" value={doctorId} />
      {state?.error && <Alert kind="error">{t(state.error as DictKey)}</Alert>}
      <Field label={t('requestedDate')}>
        <input name="requested_date" type="date" required min={today} className="input" />
      </Field>
      <Field label={t('requestedSlot')}>
        <select name="requested_slot" className="input" defaultValue="evening">
          <option value="morning">{t('slotMorning')}</option>
          <option value="afternoon">{t('slotAfternoon')}</option>
          <option value="evening">{t('slotEvening')}</option>
        </select>
      </Field>
      <Field label={`${t('reason')} (${t('optional')})`}>
        <textarea name="reason" rows={3} maxLength={500} className="input" placeholder={t('reasonPlaceholder')} />
      </Field>
      <SubmitButton className="btn btn-primary w-full" pendingText={t('loading')}>{t('sendRequest')}</SubmitButton>
    </form>
  );
}
