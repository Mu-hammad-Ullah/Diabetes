import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import type { AppointmentStatus } from '@/lib/database.types';
import type { T } from '@/lib/i18n';

export function PageHeader({ title, subtitle, action, backHref }: {
  title: string; subtitle?: string; action?: React.ReactNode; backHref?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        {backHref && (
          <Link href={backHref} className="mb-1 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
        )}
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Container({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 ${className}`}>{children}</div>;
}

export function Empty({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">{text}</div>;
}

export function Alert({ kind = 'info', children }: { kind?: 'info' | 'success' | 'error' | 'warning'; children: React.ReactNode }) {
  const cls = {
    info: 'border-sky-200 bg-sky-50 text-sky-900',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    error: 'border-red-200 bg-red-50 text-red-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
  }[kind];
  return <div className={`alert ${cls}`} role="alert">{children}</div>;
}

const STATUS_CLASS: Record<AppointmentStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 ring-amber-200',
  accepted: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  rejected: 'bg-red-100 text-red-800 ring-red-200',
  cancelled: 'bg-slate-100 text-slate-700 ring-slate-200',
  completed: 'bg-sky-100 text-sky-800 ring-sky-200',
};
const STATUS_KEY = {
  pending: 'statusPending', accepted: 'statusAccepted', rejected: 'statusRejected',
  cancelled: 'statusCancelled', completed: 'statusCompleted',
} as const;

export function StatusBadge({ status, t }: { status: AppointmentStatus; t: T }) {
  return <span className={`badge ${STATUS_CLASS[status]}`}>{t(STATUS_KEY[status])}</span>;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
