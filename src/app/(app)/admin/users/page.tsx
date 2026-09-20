import type { Metadata } from 'next';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { getT } from '@/lib/i18n/server';
import { fmtDate } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/server';
import type { Profile, UserRole } from '@/lib/database.types';
import { PageHeader, Empty, Alert } from '@/components/ui';

export const metadata: Metadata = { title: 'Users' };
const PAGE = 25;
const ROLES: UserRole[] = ['patient', 'doctor', 'admin'];

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string; role?: string; page?: string; deleted?: string }> }) {
  const [{ t, locale }, sp] = await Promise.all([getT(), searchParams]);
  const q = (sp.q ?? '').trim();
  const role = ROLES.includes(sp.role as UserRole) ? (sp.role as UserRole) : '';
  const page = Math.max(1, parseInt(sp.page ?? '1') || 1);

  const supabase = await createClient();
  let query = supabase.from('profiles').select('id, full_name, email, phone, role, created_at', { count: 'exact' })
    .order('created_at', { ascending: false }).range((page - 1) * PAGE, page * PAGE - 1);
  if (role) query = query.eq('role', role);
  if (q) {
    const like = `%${q.replace(/[%_]/g, '')}%`;
    query = query.or(`full_name.ilike.${like},email.ilike.${like},phone.ilike.${like}`);
  }
  const { data, count } = await query;
  const users = (data ?? []) as Pick<Profile, 'id' | 'full_name' | 'email' | 'phone' | 'role' | 'created_at'>[];
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE));
  const link = (p: number) => `/admin/users?${new URLSearchParams({ ...(q && { q }), ...(role && { role }), page: String(p) })}`;
  const roleLabel = (r: UserRole) => r === 'admin' ? t('roleAdmin') : r === 'doctor' ? t('roleDoctor') : t('rolePatient');

  return (
    <div>
      <PageHeader title={t('adminUsers')} subtitle={`${(count ?? 0).toLocaleString()} ${t('adminUsers').toLowerCase()}`} />
      {sp.deleted && <div className="mb-4"><Alert kind="success">{t('userDeleted')}</Alert></div>}

      <form className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-[12rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input name="q" defaultValue={q} placeholder={t('searchUsers')} className="input pl-9" />
        </div>
        <select name="role" defaultValue={role} className="input w-auto">
          <option value="">{t('allRoles')}</option>
          {ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
        </select>
        <button className="btn btn-secondary">{t('search')}</button>
      </form>

      {users.length ? (
        <div className="card overflow-x-auto p-0 sm:p-0">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">{t('fullName')}</th>
                <th className="px-4 py-2">{t('email')}</th>
                <th className="px-4 py-2">{t('phone')}</th>
                <th className="px-4 py-2">{t('role')}</th>
                <th className="px-4 py-2">{t('joined')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium"><Link href={`/admin/users/${u.id}`} className="hover:text-teal-700">{u.full_name || '—'}</Link></td>
                  <td className="px-4 py-2 text-slate-600">{u.email}</td>
                  <td className="px-4 py-2 text-slate-600">{u.phone ?? '—'}</td>
                  <td className="px-4 py-2"><span className={`badge ${u.role === 'admin' ? 'bg-red-100 text-red-800 ring-red-200' : u.role === 'doctor' ? 'bg-teal-100 text-teal-800 ring-teal-200' : 'bg-slate-100 text-slate-700 ring-slate-200'}`}>{roleLabel(u.role)}</span></td>
                  <td className="whitespace-nowrap px-4 py-2 text-slate-500">{fmtDate(u.created_at, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Empty text={t('noUsers')} />}

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <Link href={link(page - 1)} className={`btn btn-secondary ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`}>{t('prev')}</Link>
          <span className="text-slate-500">{t('page')} {page} / {pages}</span>
          <Link href={link(page + 1)} className={`btn btn-secondary ${page >= pages ? 'pointer-events-none opacity-50' : ''}`}>{t('next')}</Link>
        </div>
      )}
    </div>
  );
}
