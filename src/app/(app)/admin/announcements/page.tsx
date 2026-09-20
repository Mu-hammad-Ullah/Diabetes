import type { Metadata } from 'next';
import { getT } from '@/lib/i18n/server';
import { createClient } from '@/lib/supabase/server';
import type { Announcement } from '@/lib/database.types';
import { PageHeader, Empty } from '@/components/ui';
import { AnnouncementForm, AnnouncementRow } from './announcement-ui';

export const metadata: Metadata = { title: 'Announcements' };

export default async function AdminAnnouncements() {
  const { t } = await getT();
  const supabase = await createClient();
  const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
  const rows = (data ?? []) as Announcement[];

  return (
    <div>
      <PageHeader title={t('adminAnnouncements')} />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="mb-4 font-semibold">{t('newAnnouncement')}</h2>
            <AnnouncementForm />
          </div>
        </div>
        <div className="space-y-3 lg:col-span-3">
          {rows.length ? rows.map((a) => <AnnouncementRow key={a.id} a={a} />) : <Empty text={t('noAnnouncements')} />}
        </div>
      </div>
    </div>
  );
}
