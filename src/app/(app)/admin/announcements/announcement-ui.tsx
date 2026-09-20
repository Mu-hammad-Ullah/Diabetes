'use client';

import { useActionState, useEffect, useRef, useState, useTransition } from 'react';
import { Pencil, Power, Trash2, X } from 'lucide-react';
import type { Announcement } from '@/lib/database.types';
import { useI18n } from '@/lib/i18n/client';
import { fmtDateTime, type DictKey } from '@/lib/i18n';
import { Alert, Field } from '@/components/ui';
import { SubmitButton } from '@/components/submit-button';
import { adminDeleteAnnouncement, adminSaveAnnouncement, adminToggleAnnouncement } from '../actions';

const LEVEL_CLASS: Record<Announcement['level'], string> = {
  info: 'bg-sky-100 text-sky-800 ring-sky-200',
  success: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  warning: 'bg-amber-100 text-amber-800 ring-amber-200',
  danger: 'bg-red-100 text-red-800 ring-red-200',
};

export function AnnouncementForm({ a, onDone }: { a?: Announcement; onDone?: () => void }) {
  const { t } = useI18n();
  const [state, action] = useActionState(adminSaveAnnouncement, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      if (!a) formRef.current?.reset();
      onDone?.();
    }
  }, [state, a, onDone]);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      {state?.success && <Alert kind="success">{t(state.success as DictKey)}</Alert>}
      {state?.error && <Alert kind="error">{t(state.error as DictKey)}</Alert>}
      {a && <input type="hidden" name="id" value={a.id} />}
      <Field label={t('announcementTitle')}><input name="title" required maxLength={120} defaultValue={a?.title ?? ''} className="input" /></Field>
      <Field label={t('announcementBody')}><textarea name="body" rows={4} maxLength={2000} defaultValue={a?.body ?? ''} className="input" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('level')}>
          <select name="level" defaultValue={a?.level ?? 'info'} className="input">
            <option value="info">{t('levelInfo')}</option>
            <option value="success">{t('levelSuccess')}</option>
            <option value="warning">{t('levelWarning')}</option>
            <option value="danger">{t('levelDanger')}</option>
          </select>
        </Field>
        <Field label={t('audience')}>
          <select name="audience" defaultValue={a?.audience ?? 'all'} className="input">
            <option value="all">{t('audienceAll')}</option>
            <option value="patient">{t('audiencePatient')}</option>
            <option value="doctor">{t('audienceDoctor')}</option>
          </select>
        </Field>
      </div>
      <Field label={`${t('endsAt')} (${t('optional')})`}>
        <input name="ends_at" type="date" defaultValue={a?.ends_at ? a.ends_at.slice(0, 10) : ''} className="input" />
      </Field>
      <div className="text-right"><SubmitButton pendingText={t('saving')}>{a ? t('save') : t('publish')}</SubmitButton></div>
    </form>
  );
}

export function AnnouncementRow({ a }: { a: Announcement }) {
  const { t, locale } = useI18n();
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const levelLabel = { info: t('levelInfo'), success: t('levelSuccess'), warning: t('levelWarning'), danger: t('levelDanger') }[a.level];
  const audienceLabel = { all: t('audienceAll'), patient: t('audiencePatient'), doctor: t('audienceDoctor') }[a.audience];

  if (editing) {
    return (
      <div className="card">
        <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">{t('edit')}</h3>
          <button onClick={() => setEditing(false)} className="btn btn-ghost px-2"><X className="h-4 w-4" /></button></div>
        <AnnouncementForm a={a} onDone={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className={`card ${a.is_active ? '' : 'opacity-60'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`badge ${LEVEL_CLASS[a.level]}`}>{levelLabel}</span>
            <span className="badge bg-slate-100 text-slate-700 ring-slate-200">{audienceLabel}</span>
            <span className={`badge ${a.is_active ? 'bg-emerald-100 text-emerald-800 ring-emerald-200' : 'bg-slate-100 text-slate-600 ring-slate-200'}`}>{a.is_active ? t('active') : t('inactive')}</span>
          </div>
          <h3 className="mt-2 font-semibold">{a.title}</h3>
          {a.body && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{a.body}</p>}
          <div className="mt-2 text-xs text-slate-500">{fmtDateTime(a.created_at, locale)}{a.ends_at ? ` → ${fmtDateTime(a.ends_at, locale)}` : ''}</div>
        </div>
        <div className="flex shrink-0 flex-col gap-1">
          <button disabled={pending} className="btn btn-ghost px-2" title={t('edit')} onClick={() => setEditing(true)}><Pencil className="h-4 w-4" /></button>
          <button disabled={pending} className="btn btn-ghost px-2" title={a.is_active ? t('deactivate') : t('activate')}
            onClick={() => start(() => adminToggleAnnouncement(a.id, !a.is_active))}><Power className={`h-4 w-4 ${a.is_active ? 'text-emerald-600' : 'text-slate-400'}`} /></button>
          <button disabled={pending} className="btn btn-ghost px-2 text-red-600" title={t('delete')}
            onClick={() => { if (confirm(t('confirmDelete'))) start(() => adminDeleteAnnouncement(a.id)); }}><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}
