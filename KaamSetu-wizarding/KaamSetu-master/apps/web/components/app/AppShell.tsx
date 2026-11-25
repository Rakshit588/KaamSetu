'use client';

import {
  BadgeCheck,
  Bell,
  CalendarCheck,
  Home,
  LayoutDashboard,
  LogOut,
  Search,
  ShieldCheck,
  Star,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { useT, type TKey } from '@/lib/i18n';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { Logo } from '../Logo';
import { ThemeToggle } from '../ThemeToggle';
import { NotificationBell } from './NotificationBell';

type ShellRole = 'customer' | 'worker' | 'admin';
type NavItem = { href: string; label: TKey; icon: LucideIcon };

const NAV: Record<ShellRole, NavItem[]> = {
  customer: [
    { href: '/customer', label: 'nav.home', icon: Home },
    { href: '/customer/search', label: 'nav.search', icon: Search },
    { href: '/customer/bookings', label: 'nav.bookings', icon: CalendarCheck },
    { href: '/customer/notifications', label: 'nav.alerts', icon: Bell },
  ],
  worker: [
    { href: '/worker', label: 'nav.home', icon: Home },
    { href: '/worker/earnings', label: 'nav.earnings', icon: Wallet },
    { href: '/worker/id', label: 'nav.id', icon: BadgeCheck },
    { href: '/worker/reviews', label: 'nav.reviews', icon: Star },
  ],
  admin: [
    { href: '/admin', label: 'nav.overview', icon: LayoutDashboard },
    { href: '/admin/verification', label: 'nav.verify', icon: ShieldCheck },
  ],
};

// The place each role "lives" in. A plain label sits beside it everywhere else, so nobody needs the theme to navigate.
const PLACE: Record<ShellRole, string> = {
  customer: 'Diagon Alley',
  worker: 'The Guild Hall',
  admin: 'Ministry of Magic',
};

export function AppShell({ role, children }: { role: ShellRole; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const { t } = useT();
  const items = NAV[role];
  const base = `/${role}`;
  const isActive = (href: string) => (href === base ? pathname === href : pathname.startsWith(href));

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line/25 bg-bg/85 backdrop-blur-xl">
        <div className="container-x flex h-16 items-center justify-between gap-4">
          <Link href={base} aria-label="KaamSetu home" className="flex items-center gap-3">
            <Logo />
            <span className="hidden border-l border-line/30 pl-3 font-serif text-lg italic text-brand xl:inline">
              {PLACE[role]}
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    active ? 'bg-brand text-bg shadow-soft' : 'text-muted hover:text-ink'
                  }`}
                >
                  <Icon size={16} /> {t(item.label)}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {role !== 'admin' && <NotificationBell href={`${base}/notifications`} />}
            <LanguageSwitcher />
            <ThemeToggle />
            <button
              type="button"
              aria-label={t('shell.signOut')}
              onClick={async () => {
                await signOut();
                router.replace('/');
              }}
              className="grid h-11 w-11 place-items-center rounded-full border border-line/30 bg-surface/70 transition hover:bg-surface"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="container-x pb-28 pt-6 md:pb-12 md:pt-8">{children}</main>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line/30 bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      >
        <ul className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex min-h-[60px] flex-col items-center justify-center gap-1 text-[11px] font-semibold transition ${
                    active ? 'text-brand' : 'text-muted'
                  }`}
                >
                  <Icon size={22} />
                  {t(item.label)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
