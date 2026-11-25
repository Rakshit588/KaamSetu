'use client';

import type { BookingStatus } from '@/lib/booking';
import { useT, type TKey } from '@/lib/i18n';

const tone: Record<BookingStatus, string> = {
  requested: 'bg-saffron/15 text-flame',
  accepted: 'bg-brand/10 text-brand',
  on_the_way: 'bg-brand/10 text-brand',
  in_progress: 'bg-brand/10 text-brand',
  completed: 'bg-mint/15 text-mint',
  paid: 'bg-mint/15 text-mint',
  cancelled: 'bg-coral/15 text-coral',
  disputed: 'bg-coral/15 text-coral',
};

export function StatusChip({ status }: { status: BookingStatus }) {
  const { t } = useT();
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${tone[status] ?? tone.requested}`}>
      {t(`status.${status}` as TKey)}
    </span>
  );
}
