import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus, Search, Star } from 'lucide-react';
import { getT } from '@/lib/i18n/server';
import { createClient } from '@/lib/supabase/server';
import type { Hospital } from '@/lib/database.types';
import { PageHeader, Empty, Alert } from '@/components/ui';

export const metadata: Metadata = { title: 'Hospitals' };

export default async function AdminHospitals({ searchParams }: { searchParams: Promise<{ q?: string; saved?: string; deleted?: string }> }) {
  const [{ t }, sp] = await Promise.all([getT(), searchParams]);
  const q = (sp.q ?? '').trim();
  const supabase = await createClient();
  let query = supabase.from('hospitals').select('*').order('country_code').order('city').order('name');
  if (q) {
    const like = `%${q.replace(/[%_]/g, '')}%`;
    query = query.or(`name.ilike.${like},name_bn.ilike.${like},city.ilike.${like}`);
  }
  const rows = ((await query).data ?? []) as Hospital[];
  const typeLabel = (x: Hospital['type']) => x === 'diabetic_center' ? t('typeDiabetic') : x === 'clinic' ? t('typeClinic') : t('typeHospital');

  return (
    <div>
      <PageHeader title={t('adminHospitals')} subtitle={`${rows.length}`}
        action={<Link href="/admin/hospitals/new" className="btn btn-primary"><Plus className="h-4 w-4" />{t('addHospital')}</Link>} />
      {sp.saved && <div className="mb-4"><Alert kind="success">{t('hospitalSaved')}</Alert></div>}
      {sp.deleted && <div className="mb-4"><Alert kind="success">{t('hospitalDeleted')}</Alert></div>}

      <form className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input name="q" defaultValue={q} placeholder={t('search')} className="input pl-9" />
        </div>
        <button className="btn btn-secondary">{t('search')}</button>
      </form>

      {rows.length ? (
        <div className="card overflow-x-auto p-0 sm:p-0">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">{t('hospitalNameEn')}</th>
                <th className="px-4 py-2">{t('hospitalType')}</th>
                <th className="px-4 py-2">{t('city')}</th>
                <th className="px-4 py-2">{t('phone')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <Link href={`/admin/hospitals/${h.id}`} className="flex items-center gap-1.5 font-medium hover:text-teal-700">
                      {h.name}{h.is_diabetes_specialized && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                    </Link>
                    {h.name_bn && <div className="text-xs text-slate-500">{h.name_bn}</div>}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{typeLabel(h.type)}</td>
                  <td className="px-4 py-2 text-slate-600">{h.city}, {h.country_code}</td>
                  <td className="px-4 py-2 text-slate-600">{h.phone ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Empty text={t('none')} />}
    </div>
  );
}
