'use client';

import { useTransition } from 'react';
import { useI18n } from '@/lib/i18n/client';
import { cancelAppointment } from '../actions';

export function CancelButton({ id }: { id: string }) {
  const { t } = useI18n();
  const [pending, start] = useTransition();
  return (
    <button disabled={pending} className="btn btn-ghost text-red-600 hover:bg-red-50" onClick={() => { if (confirm(t('confirmDelete'))) start(() => cancelAppointment(id)); }}>
      {t('cancelAppointment')}
    </button>
  );
}
