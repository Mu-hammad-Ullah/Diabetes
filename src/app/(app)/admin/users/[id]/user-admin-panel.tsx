'use client';

import { useActionState, useState, useTransition } from 'react';
import { Ban, KeyRound, Mail, ShieldAlert, Trash2, UserCog } from 'lucide-react';
import type { Profile, UserRole } from '@/lib/database.types';
import { useI18n } from '@/lib/i18n/client';
import type { DictKey } from '@/lib/i18n';
import { Alert, Field } from '@/components/ui';
import { SubmitButton } from '@/components/submit-button';
import { PasswordInput } from '@/components/password-input';
import { adminDeleteUser, adminSendResetLink, adminSetBlocked, adminSetPassword, adminSetRole, adminUpdateProfile, type AdminState } from '../../actions';

export function UserAdminPanel({ profile, isSelf, isBlocked, hasAdminKey }: { profile: Profile; isSelf: boolean; isBlocked: boolean; hasAdminKey: boolean }) {
  const { t } = useI18n();
  const [msg, setMsg] = useState<AdminState>(null);
  const [pending, start] = useTransition();
  const [profState, profAction] = useActionState(adminUpdateProfile, null);
  const [pwState, pwAction] = useActionState(adminSetPassword, null);
  const [role, setRole] = useState<UserRole>(profile.role);

  const show = (s: AdminState) => setMsg(s);
  const msgOf = (s: AdminState) => s?.error ? <Alert kind="error">{t(s.error as DictKey)}</Alert> : s?.success ? <Alert kind="success">{t(s.success as DictKey)}</Alert> : null;

  return (
    <div className="space-y-4">
      {msgOf(msg)}

      {/* profile edit */}
      <section className="card">
        <h3 className="mb-3 flex items-center gap-2 font-semibold"><UserCog className="h-4 w-4 text-teal-600" />{t('edit')}</h3>
        {msgOf(profState)}
        <form action={profAction} className="mt-2 grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="id" value={profile.id} />
          <Field label={t('fullName')}><input name="full_name" required maxLength={80} defaultValue={profile.full_name} className="input" /></Field>
          <Field label={t('phone')}><input name="phone" maxLength={20} defaultValue={profile.phone ?? ''} className="input" /></Field>
          <div className="sm:col-span-2 text-right"><SubmitButton pendingText={t('saving')}>{t('save')}</SubmitButton></div>
        </form>
      </section>

      {/* role */}
      <section className="card">
        <h3 className="mb-3 flex items-center gap-2 font-semibold"><ShieldAlert className="h-4 w-4 text-amber-600" />{t('changeRole')}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} disabled={isSelf} className="input w-auto">
            <option value="patient">{t('rolePatient')}</option>
            <option value="doctor">{t('roleDoctor')}</option>
            <option value="admin">{t('roleAdmin')}</option>
          </select>
          <button disabled={pending || isSelf || role === profile.role} className="btn btn-primary"
            onClick={() => start(async () => show(await adminSetRole(profile.id, role as 'patient' | 'doctor' | 'admin')))}>{t('save')}</button>
          {isSelf && <span className="text-xs text-slate-500">{t('cannotSelf')}</span>}
        </div>
      </section>

      {/* password */}
      <section className="card">
        <h3 className="mb-3 flex items-center gap-2 font-semibold"><KeyRound className="h-4 w-4 text-sky-600" />{t('password')}</h3>
        {msgOf(pwState)}
        <form action={pwAction} className="mt-2 flex flex-wrap items-end gap-2">
          <input type="hidden" name="id" value={profile.id} />
          <div className="min-w-[14rem] flex-1">
            <Field label={t('setPassword')} hint={t('setPasswordHint')}>
              <PasswordInput name="password" required minLength={8} maxLength={72} autoComplete="off" />
            </Field>
          </div>
          <SubmitButton pendingText={t('saving')} disabled={!hasAdminKey}>{t('setPassword')}</SubmitButton>
        </form>
        <div className="mt-3 border-t border-slate-100 pt-3">
          <button disabled={pending} className="btn btn-secondary" onClick={() => start(async () => show(await adminSendResetLink(profile.id)))}>
            <Mail className="h-4 w-4" />{t('sendResetLink')}
          </button>
        </div>
      </section>

      {/* block / delete */}
      <section className="card border border-red-200">
        <h3 className="mb-1 flex items-center gap-2 font-semibold text-red-700"><Ban className="h-4 w-4" />{t('block')} / {t('deleteUser')}</h3>
        <p className="mb-3 text-xs text-slate-500">{t('blockedNote')}</p>
        <div className="flex flex-wrap gap-2">
          <button disabled={pending || isSelf || !hasAdminKey} className={isBlocked ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => start(async () => show(await adminSetBlocked(profile.id, !isBlocked)))}>
            <Ban className="h-4 w-4" />{isBlocked ? t('unblock') : t('block')}
          </button>
          <button disabled={pending || isSelf || !hasAdminKey} className="btn btn-danger"
            onClick={() => { if (confirm(t('deleteUserWarn'))) start(async () => show(await adminDeleteUser(profile.id))); }}>
            <Trash2 className="h-4 w-4" />{t('deleteUser')}
          </button>
        </div>
      </section>
    </div>
  );
}
