'use client';

import { FlaskConical } from 'lucide-react';
import { useT } from '@/lib/i18n';

// Show this wherever something is simulated (payments, ID checks, OTP).
export function DemoBadge({ className = '' }: { className?: string }) {
  const { t } = useT();
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-dashed border-saffron/70 bg-saffron/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-flame ${className}`}
    >
      <FlaskConical size={12} /> {t('common.demoMode')}
    </span>
  );
}
