import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // static asset ও image বাদে সব route
    '/((?!_next/static|_next/image|favicon.ico|icon.png|manifest.json|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
