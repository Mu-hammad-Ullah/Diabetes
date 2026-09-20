'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { mgdlToMmol } from '@/lib/glucose';

export type ActionState = { error?: string; success?: string } | null;

async function requireUser() {
  const { user, profile } = await getCurrentUser();
  if (!user || !profile) redirect('/login');
  return { user, profile };
}

const num = (min: number, max: number) =>
  z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number().min(min).max(max).optional());

// ---------------------------------------------------------------- readings
const readingSchema = z.object({
  reading_type: z.enum(['fasting', 'after_meal', 'random', 'bedtime']),
  value: z.coerce.number().positive(),
  unit: z.enum(['mmol', 'mgdl']).default('mmol'),
  measured_at: z.string().min(1),
  note: z.string().trim().max(500).optional().or(z.literal('')),
});

export async function addReading(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user } = await requireUser();
  const parsed = readingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: 'invalidValue' };
  const d = parsed.data;

  const value = d.unit === 'mgdl' ? mgdlToMmol(d.value) : Math.round(d.value * 10) / 10;
  if (value < 1 || value > 40) return { error: 'invalidValue' };

  const measuredAt = new Date(d.measured_at);
  if (Number.isNaN(measuredAt.getTime())) return { error: 'invalidValue' };

  const supabase = await createClient();
  const { error } = await supabase.from('glucose_readings').insert({
    user_id: user.id,
    reading_type: d.reading_type,
    value_mmol: value,
    measured_at: measuredAt.toISOString(),
    note: d.note || null,
  });
  if (error) return { error: 'error' };

  revalidatePath('/readings');
  revalidatePath('/dashboard');
  return { success: 'readingSaved' };
}

export async function deleteReading(id: string) {
  await requireUser();
  const supabase = await createClient();
  await supabase.from('glucose_readings').delete().eq('id', id); // RLS: শুধু নিজেরটা মুছবে
  revalidatePath('/readings');
  revalidatePath('/dashboard');
}

// ---------------------------------------------------------------- reports
// ফাইলটা client থেকে সরাসরি Supabase Storage-এ যায় (RLS-protected);
// এখানে শুধু metadata row বসে।
const reportSchema = z.object({
  title: z.string().trim().min(1).max(120),
  report_date: z.string().min(1),
  file_path: z.string().min(1),
  file_type: z.string().min(1),
  file_size: z.coerce.number().int().positive().max(10 * 1024 * 1024),
  hba1c: num(3, 20),
  fasting_mmol: num(1, 40),
  pp_mmol: num(1, 40),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
});

export async function saveReportMeta(input: unknown): Promise<ActionState> {
  const { user } = await requireUser();
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return { error: 'error' };
  const d = parsed.data;
  // path নিজের folder-এ কি না যাচাই
  if (!d.file_path.startsWith(`${user.id}/`)) return { error: 'error' };

  const supabase = await createClient();
  const { error } = await supabase.from('reports').insert({
    user_id: user.id,
    title: d.title,
    report_date: d.report_date,
    file_path: d.file_path,
    file_type: d.file_type,
    file_size: d.file_size,
    hba1c: d.hba1c ?? null,
    fasting_mmol: d.fasting_mmol ?? null,
    pp_mmol: d.pp_mmol ?? null,
    notes: d.notes || null,
  });
  if (error) return { error: 'error' };
  revalidatePath('/reports');
  revalidatePath('/dashboard');
  return { success: 'reportUploaded' };
}

export async function deleteReport(id: string) {
  const { user } = await requireUser();
  const supabase = await createClient();
  const { data: report } = await supabase.from('reports').select('file_path').eq('id', id).eq('user_id', user.id).single();
  if (!report) return;
  await supabase.storage.from('reports').remove([report.file_path]);
  await supabase.from('reports').delete().eq('id', id);
  revalidatePath('/reports');
  redirect('/reports');
}

// ---------------------------------------------------------------- appointments
const apptSchema = z.object({
  doctor_id: z.string().uuid(),
  requested_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  requested_slot: z.enum(['morning', 'afternoon', 'evening']),
  reason: z.string().trim().max(500).optional().or(z.literal('')),
});

export async function requestAppointment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user } = await requireUser();
  const parsed = apptSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: 'error' };
  const d = parsed.data;

  const today = new Date().toISOString().slice(0, 10);
  if (d.requested_date < today) return { error: 'dateInPast' };

  const supabase = await createClient();
  const { error } = await supabase.from('appointments').insert({
    patient_id: user.id,
    doctor_id: d.doctor_id,
    requested_date: d.requested_date,
    requested_slot: d.requested_slot,
    reason: d.reason || null,
  });
  if (error) return { error: 'error' };
  revalidatePath('/appointments');
  redirect('/appointments?sent=1');
}

export async function cancelAppointment(id: string) {
  await requireUser();
  const supabase = await createClient();
  await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id);
  revalidatePath('/appointments');
  revalidatePath('/doctor/appointments');
}

// doctor side
export async function setAppointmentStatus(id: string, status: 'accepted' | 'rejected' | 'completed', note?: string) {
  const { profile } = await requireUser();
  if (profile.role !== 'doctor' && profile.role !== 'admin') return;
  const supabase = await createClient();
  await supabase.from('appointments')
    .update({ status, ...(note !== undefined ? { doctor_note: note.slice(0, 500) || null } : {}) })
    .eq('id', id);
  revalidatePath('/doctor/appointments');
  revalidatePath('/doctor');
  revalidatePath('/appointments');
}

// ---------------------------------------------------------------- profile
const profileSchema = z.object({
  full_name: z.string().trim().min(2).max(80),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  date_of_birth: z.string().optional().or(z.literal('')),
  gender: z.enum(['male', 'female', 'other']).optional().or(z.literal('')),
  diabetes_type: z.enum(['type1', 'type2', 'gestational', 'prediabetes', 'unknown']),
  diagnosed_year: num(1900, 2100),
  height_cm: num(50, 250),
  weight_kg: num(10, 400),
  locale: z.enum(['bn', 'en']),
});

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user } = await requireUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: 'error' };
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from('profiles').update({
    full_name: d.full_name,
    phone: d.phone || null,
    date_of_birth: d.date_of_birth || null,
    gender: d.gender || null,
    diabetes_type: d.diabetes_type,
    diagnosed_year: d.diagnosed_year ?? null,
    height_cm: d.height_cm ?? null,
    weight_kg: d.weight_kg ?? null,
    locale: d.locale,
  }).eq('id', user.id);
  if (error) return { error: 'error' };
  revalidatePath('/', 'layout');
  return { success: 'profileSaved' };
}

// ---------------------------------------------------------------- doctor profile
const DAYS = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'] as const;
const doctorSchema = z.object({
  full_name: z.string().trim().min(2).max(80),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  specialty: z.string().trim().min(1).max(80),
  qualification: z.string().trim().max(200),
  registration_no: z.string().trim().max(40).optional().or(z.literal('')),
  hospital_name: z.string().trim().max(120),
  chamber_address: z.string().trim().max(240),
  city: z.string().trim().max(60),
  consultation_fee: num(0, 100000),
  available_hours: z.string().trim().max(80).optional().or(z.literal('')),
  bio: z.string().trim().max(1000).optional().or(z.literal('')),
});

export async function updateDoctorProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user, profile } = await requireUser();
  if (profile.role !== 'doctor') return { error: 'error' };
  const parsed = doctorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: 'error' };
  const d = parsed.data;
  const available_days = DAYS.filter((day) => formData.get(`day_${day}`) === 'on');

  const supabase = await createClient();
  const [p, dr] = await Promise.all([
    supabase.from('profiles').update({ full_name: d.full_name, phone: d.phone || null }).eq('id', user.id),
    supabase.from('doctors').update({
      specialty: d.specialty,
      qualification: d.qualification,
      registration_no: d.registration_no || null,
      hospital_name: d.hospital_name,
      chamber_address: d.chamber_address,
      city: d.city,
      consultation_fee: d.consultation_fee ?? null,
      available_days,
      available_hours: d.available_hours || null,
      bio: d.bio || null,
    }).eq('profile_id', user.id),
  ]);
  if (p.error || dr.error) return { error: 'error' };
  revalidatePath('/', 'layout');
  return { success: 'profileSaved' };
}

// ---------------------------------------------------------------- admin
export async function setDoctorVerified(doctorId: string, verified: boolean) {
  const { profile } = await requireUser();
  if (profile.role !== 'admin') return;
  const supabase = await createClient();
  await supabase.from('doctors').update({ is_verified: verified }).eq('id', doctorId);
  revalidatePath('/admin/doctors');
  revalidatePath('/doctors');
}
