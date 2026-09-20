'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useI18n } from '@/lib/i18n/client';
import { READING_TYPE_LABEL } from '@/lib/glucose';
import type { ReadingType } from '@/lib/database.types';
import { addReading } from '../actions';
import { SubmitButton } from '@/components/submit-button';
import { Alert, Field } from '@/components/ui';
import type { DictKey } from '@/lib/i18n';

const TYPES: ReadingType[] = ['fasting', 'after_meal', 'random', 'bedtime'];

// datetime-local input-এর জন্য local time string
function nowLocal() {
  const d = new Date();
  d.setSeconds(0, 0);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export function ReadingForm() {
  const { t, locale } = useI18n();
  const [state, action] = useActionState(addReading, null);
  const [unit, setUnit] = useState<'mmol' | 'mgdl'>('mmol');
  const formRef = useRef<HTMLFormElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);

  // datetime-local-এর default "এখন" — client-side timezone-এ, তাই DOM-এ সরাসরি বসানো
  useEffect(() => { if (timeRef.current) timeRef.current.value = nowLocal(); }, []);
  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      if (timeRef.current) timeRef.current.value = nowLocal();
    }
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-4">
      {state?.success && <Alert kind="success">{t(state.success as DictKey)}</Alert>}
      {state?.error && <Alert kind="error">{t(state.error as DictKey)}</Alert>}

      <Field label={t('readingType')}>
        <select name="reading_type" className="input" defaultValue="fasting">
          {TYPES.map((tp) => <option key={tp} value={tp}>{READING_TYPE_LABEL[locale][tp]}</option>)}
        </select>
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <Field label={t('value')} hint={unit === 'mgdl' ? t('mgdlHint') : undefined}>
            <input name="value" type="number" inputMode="decimal" required
              step={unit === 'mmol' ? 0.1 : 1} min={unit === 'mmol' ? 1 : 18} max={unit === 'mmol' ? 40 : 720}
              className="input" placeholder={unit === 'mmol' ? '5.6' : '100'} />
          </Field>
        </div>
        <Field label={t('unit')}>
          <select name="unit" className="input" value={unit} onChange={(e) => setUnit(e.target.value as 'mmol' | 'mgdl')}>
            <option value="mmol">mmol/L</option>
            <option value="mgdl">mg/dL</option>
          </select>
        </Field>
      </div>

      <Field label={t('measuredAt')}>
        <input ref={timeRef} name="measured_at" type="datetime-local" required className="input" />
      </Field>

      <Field label={`${t('note')} (${t('optional')})`}>
        <input name="note" maxLength={500} className="input" placeholder={t('notePlaceholder')} />
      </Field>

      <SubmitButton className="btn btn-primary w-full" pendingText={t('saving')}>{t('save')}</SubmitButton>
    </form>
  );
}
