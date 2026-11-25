'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Logo } from '../Logo';
import { ThemeToggle } from '../ThemeToggle';

// Plain label first (what the page is), themed name second (what it is called in this world).
const links = [
  { href: '/', label: 'Home', magic: 'The Grand Entrance' },
  { href: '/customer/search', label: 'Explore workers', magic: 'Diagon Alley' },
  { href: '#how', label: 'How it works', magic: 'The Wizarding Guide' },
  { href: '#trust', label: 'Trust', magic: 'Ministry of Trust' },
  { href: '#order', label: 'About', magic: 'The Order' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { status } = useAuth();
  const authed = status === 'authed';
  const cta = authed ? { href: '/dashboard', label: 'My dashboard' } : { href: '/login', label: 'Log in' };

  return (
    <header className="sticky top-0 z-40 border-b border-line/25 bg-bg/85 backdrop-blur-xl">
      <div className="container-x flex h-[68px] items-center justify-between gap-4">
        <Link href="/" aria-label="KaamSetu home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-5 lg:flex xl:gap-7" aria-label="Main">
          {links.map((l) => (
            <Link key={l.label} href={l.href} className="group text-center leading-tight">
              <span className="block text-sm font-semibold text-ink transition group-hover:text-brand">{l.label}</span>
              <span className="block font-serif text-[13px] italic text-muted">{l.magic}</span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href={cta.href} className="btn btn-primary hidden !min-h-[44px] !px-5 !py-2.5 sm:inline-flex">
            {cta.label}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label="Toggle menu"
            className="grid h-11 w-11 place-items-center rounded-full border border-line/30 bg-surface/70 lg:hidden"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line/25 bg-bg lg:hidden">
          <div className="container-x flex flex-col gap-1 py-3">
            {links.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 hover:bg-surface"
              >
                <span className="block text-base font-semibold">{l.label}</span>
                <span className="block font-serif text-sm italic text-muted">{l.magic}</span>
              </Link>
            ))}
            <Link href={cta.href} className="btn btn-primary mt-2">
              {cta.label}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
