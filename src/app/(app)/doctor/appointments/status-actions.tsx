'use client';

import { useState, useTransition } from 'react';
import { Check, X, CheckCheck } from 'lucide-react';
import type { AppointmentStatus } from '@/lib/database.types';
import { useI18n } from '@/lib/i18n/client';
import { setAppointmentStatus } from '../../actions';

export function StatusActions({ id, status }: { id: string; status: AppointmentStatus }) {
  const { t } = useI18n();
  const [pending, start] = useTransition();
  const [note, setNote] = useState('');

  if (status === 'pending') {
    return (
      <div className="flex flex-col items-end gap-2">
        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder={t('doctorNote')} className="input w-56 py-1.5 text-xs" />
        <div className="flex gap-2">
          <button disabled={pending} className="btn btn-primary px-3 py-1.5 text-xs" onClick={() => start(() => setAppointmentStatus(id, 'accepted', note))}><Check className="h-3.5 w-3.5" />{t('accept')}</button>
          <button disabled={pending} className="btn btn-secondary px-3 py-1.5 text-xs text-red-600" onClick={() => start(() => setAppointmentStatus(id, 'rejected', note))}><X className="h-3.5 w-3.5" />{t('reject')}</button>
        </div>
      </div>
    );
  }
  if (status === 'accepted') {
    return (
      <button disabled={pending} className="btn btn-secondary px-3 py-1.5 text-xs" onClick={() => start(() => setAppointmentStatus(id, 'completed'))}><CheckCheck className="h-3.5 w-3.5" />{t('markCompleted')}</button>
    );
  }
  return null;
}
