import type { Metadata } from 'next';
import { getT } from '@/lib/i18n/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import type { GlucoseReading } from '@/lib/database.types';
import { PageHeader, Empty } from '@/components/ui';
import { GlucoseAdvice } from '@/components/glucose-advice';
import { ReadingForm } from './reading-form';
import { ReadingsChart } from './readings-chart';
import { ReadingsList } from './readings-list';

export const metadata: Metadata = { title: 'Sugar tracker' };

export default async function ReadingsPage() {
  const [{ t, locale }, { user }] = await Promise.all([getT(), getCurrentUser()]);
  const supabase = await createClient();

  const { data } = await supabase
    .from('glucose_readings')
    .select('*')
    .eq('user_id', user!.id)
    .order('measured_at', { ascending: false })
    .limit(200);
  const readings = (data ?? []) as GlucoseReading[];
  const latest = readings[0];

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const last30 = readings.filter((r) => new Date(r.measured_at) >= since);

  return (
    <div>
      <PageHeader title={t('readingsTitle')} />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="mb-4 font-semibold">{t('addReading')}</h2>
            <ReadingForm />
          </div>
        </div>

        <div className="space-y-6 lg:col-span-3">
          {latest ? (
            <GlucoseAdvice value={Number(latest.value_mmol)} type={latest.reading_type} locale={locale} title={t('lastReading')} />
          ) : (
            <Empty text={t('noReadingsYet')} />
          )}

          {last30.length > 1 && (
            <div className="card">
              <h2 className="mb-3 font-semibold">{t('trend')}</h2>
              <ReadingsChart readings={last30} />
            </div>
          )}
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="mb-3 font-semibold">{t('history')}</h2>
        {readings.length ? <ReadingsList readings={readings} /> : <Empty text={t('noReadings')} />}
      </div>
    </div>
  );
}
