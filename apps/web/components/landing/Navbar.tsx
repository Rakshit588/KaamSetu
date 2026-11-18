'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Logo } from '../Logo';
import { ThemeToggle } from '../ThemeToggle';

const links = [
  { href: '#how', label: 'How it works' },
  { href: '#trades', label: 'Trades' },
  { href: '#trust', label: 'Trust' },
  { href: '#faq', label: 'FAQ' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line/10 bg-bg/80 backdrop-blur-xl">
      <div className="container-x flex h-16 items-center justify-between">
        <Link href="/" aria-label="KaamSetu home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-muted transition hover:text-ink">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className="btn btn-primary hidden !min-h-[44px] !px-5 !py-2.5 sm:inline-flex">
            Log in
          </Link>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label="Toggle menu"
            className="grid h-11 w-11 place-items-center rounded-full border border-line/15 bg-surface/70 md:hidden"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line/10 bg-bg md:hidden">
          <div className="container-x flex flex-col gap-1 py-3">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-base font-medium text-ink hover:bg-surface"
              >
                {l.label}
              </a>
            ))}
            <Link href="/login" className="btn btn-primary mt-2">
              Log in
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
