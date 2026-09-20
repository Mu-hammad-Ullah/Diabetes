import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { getT } from '@/lib/i18n/server';
import { createClient } from '@/lib/supabase/server';
import type { DoctorDirectoryEntry } from '@/lib/database.types';
import { PageHeader, Empty, Alert } from '@/components/ui';

export const metadata: Metadata = { title: 'Doctor directory' };
const PAGE = 40;

export default async function AdminDirectory({ searchParams }: { searchParams: Promise<{ q?: string; city?: string; page?: string; saved?: string; deleted?: string }> }) {
  const [{ t }, sp] = await Promise.all([getT(), searchParams]);
  const q = (sp.q ?? '').trim();
  const city = (sp.city ?? '').trim();
  const page = Math.max(1, parseInt(sp.page ?? '1') || 1);
  const supabase = await createClient();

  let query = supabase.from('doctor_directory').select('*', { count: 'exact' })
    .order('city').order('hospital_name').order('name').range((page - 1) * PAGE, page * PAGE - 1);
  if (city) query = query.eq('city', city);
  if (q) { const like = `%${q.replace(/[%_]/g, '')}%`; query = query.or(`name.ilike.${like},hospital_name.ilike.${like},degrees.ilike.${like}`); }
  const [{ data, count, error }, { data: cityRows }] = await Promise.all([query, supabase.from('doctor_directory').select('city')]);
  const rows = (data ?? []) as DoctorDirectoryEntry[];
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE));
  const cities = [...new Set((cityRows ?? []).map((r) => r.city))].sort();
  const link = (p: number) => `/admin/directory?${new URLSearchParams({ ...(q && { q }), ...(city && { city }), page: String(p) })}`;

  return (
    <div>
      <PageHeader title={t('adminDirectory')} subtitle={`${count ?? 0}`}
        action={<Link href="/admin/directory/new" className="btn btn-primary"><Plus className="h-4 w-4" />{t('addDoctor')}</Link>} />
      {sp.saved && <div className="mb-4"><Alert kind="success">{t('doctorSaved')}</Alert></div>}
      {sp.deleted && <div className="mb-4"><Alert kind="success">{t('doctorDeleted')}</Alert></div>}
      {error && <div className="mb-4"><Alert kind="error">Database error: {error.message} — <code>supabase/migration_003_doctor_directory.sql</code> চালানো হয়েছে?</Alert></div>}

      <form className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-[12rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input name="q" defaultValue={q} placeholder={t('searchDoctors')} className="input pl-9" />
        </div>
        <select name="city" defaultValue={city} className="input w-auto">
          <option value="">{t('allDistricts')}</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className="btn btn-secondary">{t('search')}</button>
      </form>

      {rows.length ? (
        <div className="card overflow-x-auto p-0 sm:p-0">
          <table className="w-full min-w-[48rem] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">{t('fullName')}</th>
                <th className="px-4 py-2">{t('hospitalName')}</th>
                <th className="px-4 py-2">{t('city')}</th>
                <th className="px-4 py-2">{t('phone')}</th>
                <th className="px-4 py-2">{t('active')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((d) => (
                <tr key={d.id} className={`hover:bg-slate-50 ${d.is_active ? '' : 'opacity-60'}`}>
                  <td className="px-4 py-2">
                    <Link href={`/admin/directory/${d.id}`} className="font-medium hover:text-teal-700">{d.name}</Link>
                    {d.designation && <div className="text-xs text-slate-500">{d.designation}</div>}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{d.hospital_name}</td>
                  <td className="px-4 py-2 text-slate-600">{d.city}</td>
                  <td className="whitespace-nowrap px-4 py-2 text-slate-600">{d.phone ?? '—'}</td>
                  <td className="px-4 py-2">{d.is_active ? t('yes') : t('no')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Empty text={t('noDirectory')} />}

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
