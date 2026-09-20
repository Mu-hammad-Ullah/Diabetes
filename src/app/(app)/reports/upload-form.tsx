'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n/client';
import { saveReportMeta } from '../actions';
import { Alert, Field } from '@/components/ui';

const MAX = 10 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' };

export function UploadForm({ userId }: { userId: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [phase, setPhase] = useState<'idle' | 'compressing' | 'uploading'>('idle');
  const [msg, setMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    let file = fd.get('file') as File | null;
    if (!file || !file.size) return;

    if (!TYPES.includes(file.type)) return setMsg({ kind: 'error', text: t('fileTypeInvalid') });
    if (file.size > MAX) return setMsg({ kind: 'error', text: t('fileTooLarge') });

    try {
      // ছবি হলে browser-এই compress → storage বাঁচে, upload দ্রুত হয়
      if (file.type.startsWith('image/')) {
        setPhase('compressing');
        const { default: compress } = await import('browser-image-compression');
        file = await compress(file, { maxSizeMB: 0.6, maxWidthOrHeight: 2000, useWebWorker: true, fileType: 'image/webp', initialQuality: 0.85 });
      }

      setPhase('uploading');
      const supabase = createClient();
      const ext = EXT[file.type] ?? 'bin';
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('reports').upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const res = await saveReportMeta({
        title: fd.get('title'),
        report_date: fd.get('report_date'),
        file_path: path,
        file_type: file.type,
        file_size: file.size,
        hba1c: fd.get('hba1c'),
        fasting_mmol: fd.get('fasting_mmol'),
        pp_mmol: fd.get('pp_mmol'),
        notes: fd.get('notes'),
      });
      if (res?.error) {
        await supabase.storage.from('reports').remove([path]); // metadata fail হলে orphan ফাইল রাখব না
        throw new Error(res.error);
      }
      setMsg({ kind: 'success', text: t('reportUploaded') });
      form.reset();
      router.refresh();
    } catch {
      setMsg({ kind: 'error', text: t('error') });
    } finally {
      setPhase('idle');
    }
  }

  const busy = phase !== 'idle';
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
      {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
      <Field label={t('reportTitle')}>
        <input name="title" required maxLength={120} className="input" placeholder={t('reportTitlePlaceholder')} />
      </Field>
      <Field label={t('reportDate')}>
        <input name="report_date" type="date" required max={today} defaultValue={today} className="input" />
      </Field>
      <Field label={t('reportFile')}>
        <input name="file" type="file" required accept={TYPES.join(',')} className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-teal-700 hover:file:bg-teal-100" />
      </Field>

      <fieldset className="rounded-lg border border-slate-200 p-3">
        <legend className="px-1 text-xs font-medium text-slate-500">{t('reportValues')} ({t('optional')})</legend>
        <div className="grid grid-cols-3 gap-2">
          <Field label={t('hba1c')}><input name="hba1c" type="number" step="0.1" min="3" max="20" inputMode="decimal" className="input" /></Field>
          <Field label={t('fastingValue')}><input name="fasting_mmol" type="number" step="0.1" min="1" max="40" inputMode="decimal" className="input" /></Field>
          <Field label={t('ppValue')}><input name="pp_mmol" type="number" step="0.1" min="1" max="40" inputMode="decimal" className="input" /></Field>
        </div>
      </fieldset>

      <Field label={`${t('reportNotes')} (${t('optional')})`}>
        <textarea name="notes" rows={2} maxLength={1000} className="input" />
      </Field>

      <button type="submit" disabled={busy} className="btn btn-primary w-full">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {phase === 'compressing' ? t('compressing') : phase === 'uploading' ? t('uploading') : t('uploadReport')}
      </button>
    </form>
  );
}
