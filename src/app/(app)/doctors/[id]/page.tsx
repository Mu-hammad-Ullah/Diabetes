import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BadgeCheck, Clock, MapPin, Phone } from 'lucide-react';
import { getT } from '@/lib/i18n/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import type { DoctorWithProfile } from '@/lib/database.types';
import { PageHeader } from '@/components/ui';
import { DAY_KEYS } from '@/lib/days';
import { AppointmentForm } from './appointment-form';

export const metadata: Metadata = { title: 'Doctor' };

export default async function DoctorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ t }, { profile }] = await Promise.all([getT(), getCurrentUser()]);
  const supabase = await createClient();
  const { data } = await supabase.from('doctors').select('*, profiles(full_name, phone)').eq('id', id).eq('is_verified', true).maybeSingle();
  const d = data as DoctorWithProfile | null;
  if (!d) notFound();

  return (
    <div>
      <PageHeader title={d.profiles?.full_name ?? ''} subtitle={`${d.specialty}${d.qualification ? ` · ${d.qualification}` : ''}`} backHref="/doctors" />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="card space-y-3 text-sm lg:col-span-3">
          <div className="flex items-center gap-1.5 text-teal-700"><BadgeCheck className="h-4 w-4" />{t('verified')}{d.registration_no ? ` · BMDC ${d.registration_no}` : ''}</div>
          <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /><span>{d.hospital_name}{d.chamber_address ? `, ${d.chamber_address}` : ''}{d.city ? `, ${d.city}` : ''}</span></div>
          {(d.available_days.length > 0 || d.available_hours) && (
            <div className="flex items-start gap-2"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <span>{d.available_days.map((day) => t(DAY_KEYS[day] ?? 'daysSat')).join(', ')}{d.available_hours ? ` · ${d.available_hours}` : ''}</span>
            </div>
          )}
          {d.profiles?.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" /><a href={`tel:${d.profiles.phone}`} className="hover:underline">{d.profiles.phone}</a></div>}
          {d.consultation_fee != null && <div><span className="text-slate-500">{t('fee')}:</span> ৳{d.consultation_fee}</div>}
          {d.bio && <p className="whitespace-pre-wrap border-t border-slate-100 pt-3 text-slate-600">{d.bio}</p>}
        </div>

        <div className="card lg:col-span-2">
          <h2 className="mb-4 font-semibold">{t('requestAppointment')}</h2>
          {profile?.role === 'patient' ? <AppointmentForm doctorId={d.id} /> : <p className="text-sm text-slate-500">—</p>}
        </div>
      </div>
    </div>
  );
}
