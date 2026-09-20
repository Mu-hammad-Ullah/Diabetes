'use client';

import { useActionState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import type { DoctorDirectoryEntry } from '@/lib/database.types';
import { useI18n } from '@/lib/i18n/client';
import type { DictKey } from '@/lib/i18n';
import { Alert, Field } from '@/components/ui';
import { SubmitButton } from '@/components/submit-button';
import { adminDeleteDirectoryDoctor, adminSaveDirectoryDoctor } from '../actions';

export function DirectoryForm({ doc }: { doc?: DoctorDirectoryEntry }) {
  const { t } = useI18n();
  const [state, action] = useActionState(adminSaveDirectoryDoctor, null);
  const [pending, start] = useTransition();

  return (
    <form action={action} className="space-y-4">
      {state?.success && <Alert kind="success">{t(state.success as DictKey)}</Alert>}
      {state?.error && <Alert kind="error">{t(state.error as DictKey)}</Alert>}
      {doc && <input type="hidden" name="id" value={doc.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label={t('fullName')}><input name="name" required maxLength={160} defaultValue={doc?.name ?? ''} className="input" placeholder="Prof. Dr. ..." /></Field></div>
        <div className="sm:col-span-2"><Field label={t('degrees')}><textarea name="degrees" rows={2} maxLength={600} defaultValue={doc?.degrees ?? ''} className="input" placeholder="MBBS, MD (Endocrinology)..." /></Field></div>
        <Field label={t('designation')}><input name="designation" maxLength={200} defaultValue={doc?.designation ?? ''} className="input" /></Field>
        <Field label={t('specialty')}><input name="specialty" required maxLength={120} defaultValue={doc?.specialty ?? 'Endocrinology / Diabetology'} className="input" /></Field>
        <Field label={t('hospitalName')}><input name="hospital_name" required maxLength={160} defaultValue={doc?.hospital_name ?? ''} className="input" /></Field>
        <Field label={t('branch')}><input name="branch" maxLength={120} defaultValue={doc?.branch ?? ''} className="input" /></Field>
        <Field label={t('city')}><input name="city" required maxLength={80} defaultValue={doc?.city ?? ''} className="input" placeholder="Dhaka" /></Field>
        <Field label={t('phone')}><input name="phone" maxLength={60} defaultValue={doc?.phone ?? ''} className="input" /></Field>
        <Field label={t('phoneType')}><input name="phone_type" maxLength={60} defaultValue={doc?.phone_type ?? ''} className="input" placeholder="hospital hotline" /></Field>
        <Field label={t('sourceUrl')}><input name="source_url" type="url" maxLength={300} defaultValue={doc?.source_url ?? ''} className="input" placeholder="https://" /></Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_active" defaultChecked={doc?.is_active ?? true} className="accent-teal-600" />{t('active')}
        </label>
      </div>
      <div className="flex items-center justify-between">
        {doc ? (
          <button type="button" disabled={pending} className="btn btn-danger" onClick={() => { if (confirm(t('confirmDelete'))) start(() => adminDeleteDirectoryDoctor(doc.id)); }}>
            <Trash2 className="h-4 w-4" />{t('delete')}
          </button>
        ) : <span />}
        <SubmitButton pendingText={t('saving')}>{t('save')}</SubmitButton>
      </div>
    </form>
  );
}
