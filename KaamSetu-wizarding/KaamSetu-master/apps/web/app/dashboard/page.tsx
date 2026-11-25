'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';

// Sends each signed-in person to their own home. Guests go to login; people with no role pick one there.
export default function DashboardPage() {
  const router = useRouter();
  const { user, status } = useAuth();

  useEffect(() => {
    if (status === 'guest') router.replace('/login?next=/dashboard');
    if (status === 'authed' && user && !user.role) router.replace('/login');
    if (status === 'authed' && user?.role === 'customer') router.replace('/customer');
    if (status === 'authed' && user?.role === 'worker') router.replace('/worker');
    if (status === 'authed' && user?.role === 'admin') router.replace('/admin');
  }, [status, user, router]);

  return <div className="grid min-h-screen place-items-center font-serif text-xl text-muted">Opening your doors...</div>;
}
