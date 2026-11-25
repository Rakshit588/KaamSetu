'use client';

import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MinistrySeal } from '@/components/magic/MinistrySeal';
import { Ornament } from '@/components/magic/Ornament';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

// Backend features that exist in the spec but have no admin API yet. Listed honestly instead of faked.
const PENDING = [
  'Users and worker directory',
  'All bookings and revenue analytics',
  'Disputes and fraud queue',
  'Trade pricing, advertisements and subscription plans',
];

export default function AdminHome() {
  const { user } = useAuth();
  const [pending, setPending] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<{ pending: unknown[] }>('/admin/verifications')
      .then((r) => {
        if (!cancelled) setPending(r.pending.length);
      })
      .catch(() => {
        if (!cancelled) setPending(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-wide sm:text-4xl">Ministry of Magic</h1>
        <p className="mt-1 font-serif text-xl text-muted">
          Admin command center{user?.name ? `, welcome ${user.name.split(' ')[0]}` : ''}.
        </p>
        <Ornament className="mt-4" />
      </div>

      <Link
        href="/admin/verification"
        className="card flex items-center gap-5 p-6 transition hover:-translate-y-0.5 hover:shadow-lift"
      >
        <MinistrySeal size={64} />
        <span className="flex-1">
          <span className="block font-display text-xl font-semibold">Ministry Certification Office</span>
          <span className="block text-muted">Worker verification queue</span>
        </span>
        <span className="text-right">
          <span className="gold-text block font-display text-4xl font-semibold">{pending ?? '-'}</span>
          <span className="text-sm text-muted">waiting for review</span>
        </span>
      </Link>

      <section aria-labelledby="soon" className="card p-6">
        <h2 id="soon" className="flex items-center gap-2 font-display text-xl font-semibold">
          <ShieldCheck size={20} className="text-brand" /> Not built yet
        </h2>
        <p className="mt-1 text-sm text-muted">
          These Ministry departments need admin API endpoints that the backend does not have yet, so they are not shown
          with made-up numbers.
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {PENDING.map((p) => (
            <li key={p} className="rounded-xl2 border border-line/20 bg-surface2/40 px-4 py-3 text-sm">
              {p}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
