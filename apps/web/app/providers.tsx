'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth';
import { LanguageProvider } from '@/lib/i18n';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <LanguageProvider>{children}</LanguageProvider>
    </AuthProvider>
  );
}
