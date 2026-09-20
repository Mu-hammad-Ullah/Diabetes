import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, Image as ImageIcon } from 'lucide-react';
import { getT } from '@/lib/i18n/server';
import { fmtDate } from '@/lib/i18n';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import type { Report } from '@/lib/database.types';
import { BADGE_CLASS, classifyHba1c } from '@/lib/glucose';
import { PageHeader, Empty } from '@/components/ui';
import { UploadForm } from './upload-form';

export const metadata: Metadata = { title: 'Reports' };

export default async function ReportsPage() {
  const [{ t, locale }, { user }] = await Promise.all([getT(), getCurrentUser()]);
  const supabase = await createClient();
  const { data } = await supabase.from('reports').select('*').eq('user_id', user!.id).order('report_date', { ascending: false });
  const reports = (data ?? []) as Report[];

  return (
    <div>
      <PageHeader title={t('reportsTitle')} />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="mb-4 font-semibold">{t('uploadReport')}</h2>
            <UploadForm userId={user!.id} />
          </div>
        </div>
        <div className="lg:col-span-3">
          {reports.length ? (
            <ul className="space-y-3">
              {reports.map((r) => (
                <li key={r.id}>
                  <Link href={`/reports/${r.id}`} className="card flex items-center gap-4 py-4 hover:ring-teal-300">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      {r.file_type === 'application/pdf' ? <FileText className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{r.title}</div>
                      <div className="text-xs text-slate-500">{fmtDate(r.report_date, locale)} · {(r.file_size / 1024).toFixed(0)} KB</div>
                    </div>
                    {r.hba1c != null && (
                      <span className={`badge ${BADGE_CLASS[classifyHba1c(Number(r.hba1c)).color]}`}>HbA1c {Number(r.hba1c).toFixed(1)}%</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          ) : <Empty text={t('noReports')} />}
        </div>
      </div>
    </div>
  );
}
