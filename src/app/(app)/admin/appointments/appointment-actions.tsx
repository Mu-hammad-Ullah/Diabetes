'use client';

import { useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import type { AppointmentStatus } from '@/lib/database.types';
import { useI18n } from '@/lib/i18n/client';
import type { DictKey } from '@/lib/i18n';
import { adminDeleteAppointment, adminSetAppointmentStatus, type AdminState } from '../actions';

const STATUSES: AppointmentStatus[] = ['pending', 'accepted', 'rejected', 'cancelled', 'completed'];

export function AppointmentAdminActions({ id, status }: { id: string; status: AppointmentStatus }) {
  const { t } = useI18n();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<AdminState>(null);
  const label = (s: AppointmentStatus) => t(`status${s.charAt(0).toUpperCase()}${s.slice(1)}` as DictKey);

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1">
        <select defaultValue={status} disabled={pending} className="input w-auto py-1.5 text-xs" aria-label={t('changeStatus')}
          onChange={(e) => start(async () => setMsg(await adminSetAppointmentStatus(id, e.target.value as AppointmentStatus)))}>
          {STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
        </select>
        <button disabled={pending} aria-label={t('delete')} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
          onClick={() => { if (confirm(t('confirmDelete'))) start(async () => setMsg(await adminDeleteAppointment(id))); }}>
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {msg?.error && <span className="text-xs text-red-600">{t(msg.error as DictKey)}</span>}
    </div>
  );
}
