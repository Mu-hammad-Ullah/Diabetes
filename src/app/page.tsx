import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Activity, FileText, Hospital, Stethoscope, Lock } from 'lucide-react';
import { getT } from '@/lib/i18n/server';
import { getCurrentUser } from '@/lib/supabase/server';

export default async function Home() {
  const [{ t }, { profile }] = await Promise.all([getT(), getCurrentUser()]);
  if (profile) redirect(profile.role === 'doctor' ? '/doctor' : '/dashboard');

  const features = [
    { icon: Activity, title: t('featureTrack'), desc: t('featureTrackDesc'), color: 'text-rose-600 bg-rose-50' },
    { icon: FileText, title: t('featureReports'), desc: t('featureReportsDesc'), color: 'text-sky-600 bg-sky-50' },
    { icon: Stethoscope, title: t('featureDoctors'), desc: t('featureDoctorsDesc'), color: 'text-teal-600 bg-teal-50' },
    { icon: Hospital, title: t('featureHospitals'), desc: t('featureHospitalsDesc'), color: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <div>
      <section className="bg-gradient-to-b from-teal-50 to-white">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:py-24">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">{t('heroTitle')}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">{t('heroSub')}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/signup" className="btn btn-primary px-6 py-3 text-base">{t('getStarted')}</Link>
            <Link href="/login" className="btn btn-secondary px-6 py-3 text-base">{t('login')}</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="card flex gap-4">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{title}</h3>
                <p className="mt-1 text-sm text-slate-600">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-start gap-3 rounded-xl bg-slate-100 p-4 text-sm text-slate-700">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
          <p>{t('privacyNote')}</p>
        </div>
      </section>
    </div>
  );
}
