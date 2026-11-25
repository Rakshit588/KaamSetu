'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { useT } from '@/lib/i18n';

type GuardRole = 'customer' | 'worker' | 'admin';

// Sends guests to the login page and people with a different role to their own home.
export function RoleGuard({ role, children }: { role: GuardRole; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, status } = useAuth();
  const { t } = useT();

  useEffect(() => {
    if (status === 'guest') {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } else if (status === 'authed' && user) {
      if (!user.role) router.replace('/login');
      else if (user.role !== role) router.replace('/dashboard');
    }
  }, [status, user, role, pathname, router]);

  if (status !== 'authed' || !user || user.role !== role) {
    return <div className="grid min-h-screen place-items-center text-muted">{t('common.loading')}</div>;
  }
  return <>{children}</>;
}
