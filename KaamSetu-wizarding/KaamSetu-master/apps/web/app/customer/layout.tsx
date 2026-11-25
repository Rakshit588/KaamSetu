'use client';

import type { ReactNode } from 'react';
import { AppShell } from '@/components/app/AppShell';
import { RoleGuard } from '@/components/app/RoleGuard';

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard role="customer">
      <AppShell role="customer">{children}</AppShell>
    </RoleGuard>
  );
}
