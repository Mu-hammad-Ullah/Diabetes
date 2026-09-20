import { Megaphone } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { Announcement, UserRole } from '@/lib/database.types';

const CLASS: Record<Announcement['level'], string> = {
  info: 'border-sky-200 bg-sky-50 text-sky-900',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  danger: 'border-red-300 bg-red-50 text-red-900',
};

/** Admin-এর active নোটিশ — dashboard/doctor home-এ দেখায় (RLS: শুধু active ও সময়ের মধ্যে যেগুলো) */
export async function Announcements({ role }: { role: UserRole }) {
  const supabase = await createClient();
  const audience = role === 'doctor' ? 'doctor' : 'patient';
  const { data } = await supabase.from('announcements').select('*')
    .in('audience', ['all', audience]).order('created_at', { ascending: false }).limit(5);
  const rows = (data ?? []) as Announcement[];
  if (!rows.length) return null;

  return (
    <div className="space-y-2">
      {rows.map((a) => (
        <div key={a.id} className={`flex gap-3 rounded-xl border p-4 ${CLASS[a.level]}`} role="status">
          <Megaphone className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="min-w-0">
            <div className="font-semibold">{a.title}</div>
            {a.body && <p className="mt-1 whitespace-pre-wrap text-sm opacity-90">{a.body}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
