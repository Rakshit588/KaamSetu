'use client';

import type { ReactNode } from 'react';
import { AppShell } from '@/components/app/AppShell';
import { RoleGuard } from '@/components/app/RoleGuard';

export default function WorkerLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard role="worker">
      <AppShell role="worker">{children}</AppShell>
    </RoleGuard>
  );
}
