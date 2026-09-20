'use client';

import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import type { GlucoseReading } from '@/lib/database.types';
import { BADGE_CLASS, classify, READING_TYPE_LABEL, severityLabel } from '@/lib/glucose';
import { useI18n } from '@/lib/i18n/client';
import { fmtDateTime } from '@/lib/i18n';
import { deleteReading } from '../actions';

export function ReadingsList({ readings, readOnly = false }: { readings: GlucoseReading[]; readOnly?: boolean }) {
  const { t, locale } = useI18n();
  const [pending, start] = useTransition();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="py-2 pr-3">{t('measuredAt')}</th>
            <th className="py-2 pr-3">{t('readingType')}</th>
            <th className="py-2 pr-3">mmol/L</th>
            <th className="py-2 pr-3 hidden sm:table-cell">{t('note')}</th>
            {!readOnly && <th className="py-2" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {readings.map((r) => {
            const v = Number(r.value_mmol);
            const c = classify(v, r.reading_type);
            return (
              <tr key={r.id}>
                <td className="whitespace-nowrap py-2 pr-3 text-slate-600">{fmtDateTime(r.measured_at, locale)}</td>
                <td className="py-2 pr-3">{READING_TYPE_LABEL[locale][r.reading_type]}</td>
                <td className="py-2 pr-3">
                  <span className={`badge ${BADGE_CLASS[c.color]}`} title={severityLabel(c.severity, locale)}>{v.toFixed(1)}</span>
                </td>
                <td className="hidden max-w-[16rem] truncate py-2 pr-3 text-slate-500 sm:table-cell">{r.note}</td>
                {!readOnly && (
                  <td className="py-2 text-right">
                    <button disabled={pending} aria-label={t('delete')} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      onClick={() => { if (confirm(t('confirmDelete'))) start(() => deleteReading(r.id)); }}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
