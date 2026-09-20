import type { Locale, Report } from '@/lib/database.types';
import { classifyHba1c, DISCLAIMER, PANEL_CLASS } from '@/lib/glucose';
import { makeT } from '@/lib/i18n';
import { GlucoseAdvice } from './glucose-advice';

/** Report-এ হাতে লেখা মান থেকে সাধারণ পরামর্শ — diagnosis নয় */
export function ReportAdvice({ report, locale }: { report: Report; locale: Locale }) {
  const t = makeT(locale);
  const hasAny = report.hba1c != null || report.fasting_mmol != null || report.pp_mmol != null;
  if (!hasAny) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{t('reportAdvice')}</h2>
      {report.hba1c != null && (() => {
        const c = classifyHba1c(Number(report.hba1c));
        const key = c.severity === 'normal' ? 'hba1cNormal' : c.severity === 'moderate' ? 'hba1cPre' : c.severity === 'high' ? 'hba1cHigh' : 'hba1cCritical';
        return (
          <div className={`rounded-xl border p-4 text-sm ${PANEL_CLASS[c.color]}`}>
            <div className="font-semibold">HbA1c {Number(report.hba1c).toFixed(1)}%</div>
            <p className="mt-1">{t(key)}</p>
            <p className="mt-2 text-xs opacity-70">{DISCLAIMER[locale]}</p>
          </div>
        );
      })()}
      {report.fasting_mmol != null && <GlucoseAdvice value={Number(report.fasting_mmol)} type="fasting" locale={locale} />}
      {report.pp_mmol != null && <GlucoseAdvice value={Number(report.pp_mmol)} type="after_meal" locale={locale} />}
    </div>
  );
}
