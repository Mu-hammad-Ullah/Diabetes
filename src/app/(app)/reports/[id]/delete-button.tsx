'use client';

import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n/client';
import { deleteReport } from '../../actions';

export function DeleteReportButton({ id }: { id: string }) {
  const { t } = useI18n();
  const [pending, start] = useTransition();
  return (
    <button disabled={pending} className="btn btn-danger" onClick={() => { if (confirm(t('confirmDelete'))) start(() => deleteReport(id)); }}>
      <Trash2 className="h-4 w-4" />{t('delete')}
    </button>
  );
}
