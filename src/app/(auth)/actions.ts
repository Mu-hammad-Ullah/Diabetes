'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export type AuthState = { error?: string; success?: string } | null;

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
  next: z.string().optional(),
});

const signupSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(72),
  full_name: z.string().trim().min(2).max(80),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  role: z.enum(['patient', 'doctor']),
  locale: z.enum(['bn', 'en']).default('bn'),
});

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: 'invalid' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { error: 'invalid' };

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single();

  const next = parsed.data.next;
  if (next && next.startsWith('/') && !next.startsWith('//')) redirect(next);
  redirect(profile?.role === 'doctor' ? '/doctor' : '/dashboard');
}

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: 'invalid' };
  const d = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: d.email,
    password: d.password,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/callback`,
      // handle_new_user() trigger এই metadata থেকে profile বানায়
      data: { full_name: d.full_name, phone: d.phone || null, role: d.role, locale: d.locale },
    },
  });
  if (error) return { error: error.message };

  // Email confirmation বন্ধ থাকলে session সাথে সাথেই আসে
  if (data.session) redirect(d.role === 'doctor' ? '/doctor' : '/dashboard');
  return { success: 'checkEmail' };
}

export async function forgotPassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = z.string().trim().email().safeParse(formData.get('email'));
  if (!email.success) return { error: 'invalid' };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${siteUrl()}/auth/callback?next=/profile/password`,
  });
  // email enumeration রোধে সবসময় success দেখানো হয়
  return { success: 'resetSent' };
}

export async function updatePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const pw = z.string().min(8).max(72).safeParse(formData.get('password'));
  if (!pw.success) return { error: 'invalid' };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: pw.data });
  if (error) return { error: error.message };
  redirect('/dashboard');
}
