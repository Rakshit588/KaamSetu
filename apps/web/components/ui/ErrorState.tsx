'use client';

import { TriangleAlert } from 'lucide-react';
import { useT } from '@/lib/i18n';

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const { t } = useT();
  return (
    <div role="alert" className="card flex flex-col items-center px-6 py-10 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-coral/15 text-coral">
        <TriangleAlert size={26} />
      </span>
      <p className="mt-4 font-display text-xl font-semibold">{t('common.error')}</p>
      {message && <p className="mt-1.5 max-w-sm text-muted">{message}</p>}
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn btn-ghost mt-5">
          {t('common.retry')}
        </button>
      )}
    </div>
  );
}
