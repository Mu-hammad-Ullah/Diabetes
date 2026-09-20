import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Download, ExternalLink } from 'lucide-react';
import { getT } from '@/lib/i18n/server';
import { fmtDate } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/server';
import type { Report } from '@/lib/database.types';
import { PageHeader } from '@/components/ui';
import { ReportAdvice } from '@/components/report-advice';
import { DeleteReportButton } from './delete-button';

export const metadata: Metadata = { title: 'Report' };

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ t, locale }] = await Promise.all([getT()]);
  const supabase = await createClient();

  // RLS: নিজের report বা (ডাক্তার হলে) accepted appointment-এর রোগীর report
  const { data } = await supabase.from('reports').select('*').eq('id', id).maybeSingle();
  const report = data as Report | null;
  if (!report) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user?.id === report.user_id;

  // Signed URL — ১০ মিনিট valid; bucket private
  const { data: signed } = await supabase.storage.from('reports').createSignedUrl(report.file_path, 600);
  const url = signed?.signedUrl ?? null;
  const isPdf = report.file_type === 'application/pdf';

  return (
    <div>
      <PageHeader title={report.title} subtitle={fmtDate(report.report_date, locale)} backHref={isOwner ? '/reports' : undefined}
        action={isOwner ? <DeleteReportButton id={report.id} /> : undefined} />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="card lg:col-span-3">
          {url ? (
            isPdf ? (
              <iframe src={url} title={report.title} className="h-[70vh] w-full rounded-lg border border-slate-200" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt={report.title} className="mx-auto max-h-[70vh] rounded-lg object-contain" />
            )
          ) : (
            <p className="text-sm text-slate-500">{t('error')}</p>
          )}
          {url && (
            <div className="mt-3 flex gap-2">
              <a href={url} target="_blank" rel="noopener" className="btn btn-secondary"><ExternalLink className="h-4 w-4" />{t('viewFile')}</a>
              <a href={url} download className="btn btn-secondary"><Download className="h-4 w-4" />{t('download')}</a>
            </div>
          )}
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="card">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <dt className="text-slate-500">{t('hba1c')}</dt><dd className="font-semibold">{report.hba1c != null ? `${Number(report.hba1c).toFixed(1)}%` : '—'}</dd>
              <dt className="text-slate-500">{t('fastingValue')}</dt><dd className="font-semibold">{report.fasting_mmol != null ? Number(report.fasting_mmol).toFixed(1) : '—'}</dd>
              <dt className="text-slate-500">{t('ppValue')}</dt><dd className="font-semibold">{report.pp_mmol != null ? Number(report.pp_mmol).toFixed(1) : '—'}</dd>
            </dl>
            {report.notes && <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{report.notes}</p>}
          </div>
          <ReportAdvice report={report} locale={locale} />
        </div>
      </div>
    </div>
  );
}
