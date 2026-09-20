import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { Container } from '@/components/ui';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getCurrentUser();
  if (!user) redirect('/login');
  // profile trigger fail করলে (খুবই বিরল) এখানে আটকাবে না, page গুলো null handle করে
  void profile;
  return <Container>{children}</Container>;
}
