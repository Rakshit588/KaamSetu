'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('ks-theme', next ? 'dark' : 'light');
    } catch {
      /* storage can be blocked; the theme still switches for this visit */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="grid h-11 w-11 place-items-center rounded-full border border-line/15 bg-surface/70 transition hover:bg-surface"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
