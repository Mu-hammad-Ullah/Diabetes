'use client';

import { useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';

export const THEME_COOKIE = 'theme';

// <html class="dark"> — এটাই source of truth; MutationObserver দিয়ে subscribe
function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => obs.disconnect();
}
const getSnapshot = () => document.documentElement.classList.contains('dark');
const getServerSnapshot = () => false;

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next = !dark;
    document.documentElement.classList.toggle('dark', next);
    document.cookie = `${THEME_COOKIE}=${next ? 'dark' : 'light'}; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <button type="button" onClick={toggle} className="btn btn-ghost px-2" aria-label="Toggle dark mode" title="Dark / Light">
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
