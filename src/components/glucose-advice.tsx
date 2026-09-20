import { AlertTriangle } from 'lucide-react';
import type { Locale, ReadingType } from '@/lib/database.types';
import { adviceFor, classify, DISCLAIMER, PANEL_CLASS, READING_TYPE_LABEL, severityLabel } from '@/lib/glucose';

/** একটা reading-এর জন্য range label + সাধারণ পরামর্শ */
export function GlucoseAdvice({ value, type, locale, title }: { value: number; type: ReadingType; locale: Locale; title?: string }) {
  const c = classify(value, type);
  const urgent = c.severity === 'critical' || c.severity === 'low';
  return (
    <div className={`rounded-xl border p-4 ${PANEL_CLASS[c.color]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          {title && <div className="text-xs font-medium opacity-70">{title}</div>}
          <div className="font-semibold">
            {READING_TYPE_LABEL[locale][type]}: {value.toFixed(1)} mmol/L — {severityLabel(c.severity, locale)}
          </div>
        </div>
        {urgent && <AlertTriangle className="h-6 w-6 shrink-0" />}
      </div>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
        {adviceFor(c.severity, locale).map((line) => <li key={line}>{line}</li>)}
      </ul>
      <p className="mt-3 text-xs opacity-70">{DISCLAIMER[locale]}</p>
    </div>
  );
}
