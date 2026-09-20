'use client';

import { useTransition } from 'react';
import { useI18n } from '@/lib/i18n/client';
import { setDoctorVerified } from '../../actions';

export function VerifyButton({ id, verified }: { id: string; verified: boolean }) {
  const { t } = useI18n();
  const [pending, start] = useTransition();
  return (
    <button disabled={pending} className={verified ? 'btn btn-secondary' : 'btn btn-primary'} onClick={() => start(() => setDoctorVerified(id, !verified))}>
      {verified ? t('unverify') : t('verify')}
    </button>
  );
}
