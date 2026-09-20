import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { AdminNav } from './admin-nav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getCurrentUser();
  if (profile?.role !== 'admin') redirect('/dashboard');
  return (
    <div>
      <AdminNav />
      {children}
    </div>
  );
}
