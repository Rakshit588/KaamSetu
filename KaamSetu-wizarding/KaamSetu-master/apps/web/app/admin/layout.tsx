'use client';

import type { ReactNode } from 'react';
import { AppShell } from '@/components/app/AppShell';
import { RoleGuard } from '@/components/app/RoleGuard';

// RoleGuard redirects guests to login and any non-admin to their own home. The API enforces admin role on every call too.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard role="admin">
      <AppShell role="admin">{children}</AppShell>
    </RoleGuard>
  );
}
