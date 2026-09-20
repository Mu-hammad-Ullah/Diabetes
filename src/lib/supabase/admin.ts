import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Service-role client — RLS bypass করে, Auth Admin API (password reset, ban, delete) চালায়।
 * শুধু server-side admin action-এ ব্যবহার হবে; browser-এ কখনো না।
 * Env: SUPABASE_SECRET_KEY (Supabase → Project Settings → API Keys → Secret keys)
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
