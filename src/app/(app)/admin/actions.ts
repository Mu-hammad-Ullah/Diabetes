'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export type AdminState = { error?: string; success?: string } | null;

async function requireAdmin() {
  const { user, profile } = await getCurrentUser();
  if (!user || profile?.role !== 'admin') redirect('/dashboard');
  return { user, profile };
}

// ============================================================== USERS
export async function adminSetRole(userId: string, role: 'patient' | 'doctor' | 'admin'): Promise<AdminState> {
  const { user } = await requireAdmin();
  if (userId === user.id) return { error: 'cannotSelf' };
  const supabase = await createClient();
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
  if (error) return { error: 'error' };
  // doctor হলে doctors row থাকা লাগে
  if (role === 'doctor') {
    await supabase.from('doctors').upsert({ profile_id: userId }, { onConflict: 'profile_id', ignoreDuplicates: true });
  }
  revalidatePath('/admin', 'layout');
  return { success: 'userUpdated' };
}

export async function adminUpdateProfile(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const schema = z.object({
    id: z.string().uuid(),
    full_name: z.string().trim().min(1).max(80),
    phone: z.string().trim().max(20).optional().or(z.literal('')),
  });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: 'error' };
  const supabase = await createClient();
  const { error } = await supabase.from('profiles')
    .update({ full_name: parsed.data.full_name, phone: parsed.data.phone || null }).eq('id', parsed.data.id);
  if (error) return { error: 'error' };
  revalidatePath('/admin', 'layout');
  return { success: 'userUpdated' };
}

export async function adminSetBlocked(userId: string, blocked: boolean): Promise<AdminState> {
  const { user } = await requireAdmin();
  if (userId === user.id) return { error: 'cannotSelf' };
  const admin = createAdminClient();
  if (!admin) return { error: 'secretKeyMissing' };
  // ban_duration: '876000h' ≈ ১০০ বছর; 'none' = unban
  const { error } = await admin.auth.admin.updateUserById(userId, { ban_duration: blocked ? '876000h' : 'none' });
  if (error) return { error: 'error' };
  revalidatePath(`/admin/users/${userId}`);
  return { success: 'userUpdated' };
}

export async function adminSetPassword(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const schema = z.object({ id: z.string().uuid(), password: z.string().min(8).max(72) });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: 'error' };
  const admin = createAdminClient();
  if (!admin) return { error: 'secretKeyMissing' };
  const { error } = await admin.auth.admin.updateUserById(parsed.data.id, { password: parsed.data.password });
  if (error) return { error: 'error' };
  return { success: 'passwordSet' };
}

export async function adminSendResetLink(userId: string): Promise<AdminState> {
  await requireAdmin();
  const supabase = await createClient();
  const { data: p } = await supabase.from('profiles').select('email').eq('id', userId).single();
  if (!p?.email) return { error: 'error' };
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const { error } = await supabase.auth.resetPasswordForEmail(p.email, { redirectTo: `${site}/auth/callback?next=/profile/password` });
  if (error) return { error: 'error' };
  return { success: 'resetLinkSent' };
}

export async function adminDeleteUser(userId: string): Promise<AdminState> {
  const { user } = await requireAdmin();
  if (userId === user.id) return { error: 'cannotSelf' };
  const admin = createAdminClient();
  if (!admin) return { error: 'secretKeyMissing' };

  // Storage-এর ফাইল আগে মুছি (DB row cascade-এ যাবে, ফাইল যাবে না)
  const { data: reports } = await admin.from('reports').select('file_path').eq('user_id', userId);
  if (reports?.length) await admin.storage.from('reports').remove(reports.map((r) => r.file_path));

  const { error } = await admin.auth.admin.deleteUser(userId); // auth.users → profiles cascade → সব
  if (error) return { error: 'error' };
  revalidatePath('/admin', 'layout');
  redirect('/admin/users?deleted=1');
}

// ============================================================== HOSPITALS
const hospitalSchema = z.object({
  id: z.string().uuid().optional().or(z.literal('')),
  name: z.string().trim().min(1).max(160),
  name_bn: z.string().trim().max(160).optional().or(z.literal('')),
  type: z.enum(['hospital', 'clinic', 'diabetic_center']),
  address: z.string().trim().max(240).optional().or(z.literal('')),
  city: z.string().trim().min(1).max(80),
  country_code: z.string().trim().length(2).default('BD'),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  website: z.string().trim().max(200).optional().or(z.literal('')),
  is_diabetes_specialized: z.preprocess((v) => v === 'on' || v === 'true', z.boolean()),
});

export async function adminSaveHospital(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const parsed = hospitalSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: 'error' };
  const d = parsed.data;
  const row = {
    name: d.name, name_bn: d.name_bn || null, type: d.type, address: d.address || null, city: d.city,
    country_code: d.country_code.toUpperCase(), lat: d.lat, lng: d.lng, phone: d.phone || null,
    website: d.website || null, is_diabetes_specialized: d.is_diabetes_specialized,
  };
  const supabase = await createClient();
  const { error } = d.id
    ? await supabase.from('hospitals').update(row).eq('id', d.id)
    : await supabase.from('hospitals').insert(row);
  if (error) return { error: 'error' };
  revalidatePath('/admin/hospitals');
  revalidatePath('/hospitals');
  if (!d.id) redirect('/admin/hospitals?saved=1');
  return { success: 'hospitalSaved' };
}

export async function adminDeleteHospital(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from('hospitals').delete().eq('id', id);
  revalidatePath('/admin/hospitals');
  revalidatePath('/hospitals');
  redirect('/admin/hospitals?deleted=1');
}

// ============================================================== APPOINTMENTS
export async function adminSetAppointmentStatus(id: string, status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed'): Promise<AdminState> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
  if (error) return { error: 'error' };
  revalidatePath('/admin/appointments');
  return { success: 'appointmentUpdated' };
}

export async function adminDeleteAppointment(id: string): Promise<AdminState> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from('appointments').delete().eq('id', id);
  if (error) return { error: 'error' };
  revalidatePath('/admin/appointments');
  return { success: 'appointmentDeleted' };
}

// ============================================================== ANNOUNCEMENTS
const annSchema = z.object({
  id: z.string().uuid().optional().or(z.literal('')),
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().max(2000),
  level: z.enum(['info', 'success', 'warning', 'danger']),
  audience: z.enum(['all', 'patient', 'doctor']),
  ends_at: z.string().optional().or(z.literal('')),
});

export async function adminSaveAnnouncement(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const { user } = await requireAdmin();
  const parsed = annSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: 'error' };
  const d = parsed.data;
  const row = { title: d.title, body: d.body, level: d.level, audience: d.audience, ends_at: d.ends_at ? new Date(d.ends_at).toISOString() : null };
  const supabase = await createClient();
  const { error } = d.id
    ? await supabase.from('announcements').update({ ...row, updated_at: new Date().toISOString() }).eq('id', d.id)
    : await supabase.from('announcements').insert({ ...row, created_by: user.id });
  if (error) return { error: 'error' };
  revalidatePath('/admin/announcements');
  revalidatePath('/dashboard');
  revalidatePath('/doctor');
  return { success: 'announcementSaved' };
}

export async function adminToggleAnnouncement(id: string, active: boolean) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from('announcements').update({ is_active: active, updated_at: new Date().toISOString() }).eq('id', id);
  revalidatePath('/admin/announcements');
  revalidatePath('/dashboard');
  revalidatePath('/doctor');
}

export async function adminDeleteAnnouncement(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from('announcements').delete().eq('id', id);
  revalidatePath('/admin/announcements');
  revalidatePath('/dashboard');
  revalidatePath('/doctor');
}

// ============================================================== DOCTOR DIRECTORY
const dirSchema = z.object({
  id: z.string().uuid().optional().or(z.literal('')),
  name: z.string().trim().min(1).max(160),
  degrees: z.string().trim().max(600).optional().or(z.literal('')),
  designation: z.string().trim().max(200).optional().or(z.literal('')),
  specialty: z.string().trim().min(1).max(120),
  hospital_name: z.string().trim().min(1).max(160),
  branch: z.string().trim().max(120).optional().or(z.literal('')),
  city: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(60).optional().or(z.literal('')),
  phone_type: z.string().trim().max(60).optional().or(z.literal('')),
  source_url: z.string().trim().max(300).optional().or(z.literal('')),
  is_active: z.preprocess((v) => v === 'on' || v === 'true', z.boolean()),
});

export async function adminSaveDirectoryDoctor(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const parsed = dirSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: 'error' };
  const d = parsed.data;
  const row = {
    name: d.name, degrees: d.degrees || null, designation: d.designation || null, specialty: d.specialty,
    hospital_name: d.hospital_name, branch: d.branch || null, city: d.city, phone: d.phone || null,
    phone_type: d.phone_type || null, source_url: d.source_url || null, is_active: d.is_active, updated_at: new Date().toISOString(),
  };
  const supabase = await createClient();
  const { error } = d.id
    ? await supabase.from('doctor_directory').update(row).eq('id', d.id)
    : await supabase.from('doctor_directory').insert(row);
  if (error) return { error: 'error' };
  revalidatePath('/admin/directory');
  revalidatePath('/doctors');
  if (!d.id) redirect('/admin/directory?saved=1');
  return { success: 'doctorSaved' };
}

export async function adminDeleteDirectoryDoctor(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from('doctor_directory').delete().eq('id', id);
  revalidatePath('/admin/directory');
  revalidatePath('/doctors');
  redirect('/admin/directory?deleted=1');
}
