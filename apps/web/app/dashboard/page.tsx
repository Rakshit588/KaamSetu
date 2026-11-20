'use client';

import { LogOut, ShieldCheck, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/lib/auth';

const roleLabel = { customer: 'Customer', worker: 'Worker', admin: 'Admin' } as const;

export default function DashboardPage() {
  const router = useRouter();
  const { user, status, signOut } = useAuth();

  useEffect(() => {
    if (status === 'guest') router.replace('/login?next=/dashboard');
    if (status === 'authed' && user && !user.role) router.replace('/login');
    // Each role gets its own home as it is built. Customers and workers are ready.
    if (status === 'authed' && user?.role === 'customer') router.replace('/customer');
    if (status === 'authed' && user?.role === 'worker') router.replace('/worker');
  }, [status, user, router]);

  if (status !== 'authed' || !user || !user.role || user.role === 'customer' || user.role === 'worker') {
    return <div className="grid min-h-screen place-items-center text-muted">Loading...</div>;
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-line/10 bg-bg/80 backdrop-blur-xl">
        <div className="container-x flex h-16 items-center justify-between">
          <Link href="/" aria-label="KaamSetu home">
            <Logo />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="container-x py-12">
        <p className="eyebrow">
          <ShieldCheck size={14} className="text-mint" /> Signed in
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Hello, {user.name || 'there'}
        </h1>
        <p className="mt-3 max-w-xl text-muted">
          Your {roleLabel[user.role].toLowerCase()} home screen is built in a later step. Customer and worker accounts
          already have theirs.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Role</p>
            <p className="mt-2 font-display text-2xl font-semibold">{roleLabel[user.role]}</p>
          </div>
          <div className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Mobile</p>
            <p className="mt-2 font-display text-2xl font-semibold">{user.phone}</p>
          </div>
          <div className="card p-5">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              <Wallet size={14} /> Wallet (demo)
            </p>
            <p className="mt-2 font-display text-2xl font-semibold">₹{user.walletBalance ?? 0}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="btn btn-ghost">
            Back to home
          </Link>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              router.replace('/');
            }}
            className="btn btn-ghost"
          >
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </main>
    </div>
  );
}
