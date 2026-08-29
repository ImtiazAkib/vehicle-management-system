'use client';

import { useEffect, useState } from 'react';

import { Monitor, Moon, Sun } from 'lucide-react';

/*
  The three-way theme control. `system` writes no class and follows `prefers-color-scheme`; `light` / `dark`
  pin a class on `<html>` and a year-long cookie the root layout reads on the next request, so the first
  paint is already right — no flash. Applied on click without a reload by toggling the class directly.
*/
const THEMES = ['system', 'light', 'dark'] as const;
type Theme = (typeof THEMES)[number];

const COOKIE = 'vusms.theme';
const ICONS = { system: Monitor, light: Sun, dark: Moon };

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');

  if (theme === 'light' || theme === 'dark') {
    root.classList.add(theme);
  }

  document.cookie = `${COOKIE}=${theme}; path=/; max-age=31536000; samesite=lax`;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    // Sync the icon to the theme the server already applied from the cookie — a mount-time read of an
    // external store (the cookie) is what an effect is for; the html class is already correct either way.
    const stored = document.cookie.match(/vusms\.theme=(system|light|dark)/)?.[1] as Theme | undefined;
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme(stored);
    }
  }, []);

  const cycle = () => {
    const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
    setTheme(next);
    applyTheme(next);
  };

  const Icon = ICONS[theme];

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Theme: ${theme}. Click to change.`}
      className="hover:bg-muted inline-flex size-9 items-center justify-center rounded-md transition-colors">
      <Icon className="size-5" aria-hidden />
    </button>
  );
}
