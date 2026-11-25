'use client';

import { useT } from '@/lib/i18n';

// Big on/off switch. The parent saves the change and tells customers.
export function AvailabilityToggle({
  value,
  onChange,
  busy,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
  busy?: boolean;
}) {
  const { t } = useT();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      disabled={busy}
      onClick={() => onChange(!value)}
      className={`flex w-full items-center justify-between gap-4 rounded-xl3 border p-5 text-left transition disabled:opacity-70 ${
        value ? 'border-mint/50 bg-mint/10' : 'border-line/15 bg-surface'
      }`}
    >
      <span>
        <span className="flex items-center gap-2 font-display text-2xl font-semibold">
          {value && (
            <span className="relative flex h-3 w-3">
              <span className="absolute inset-0 animate-pulse-ring rounded-full bg-mint" />
              <span className="relative h-3 w-3 rounded-full bg-mint" />
            </span>
          )}
          {value ? t('wk.online') : t('wk.offline')}
        </span>
        <span className="mt-1 block text-sm text-muted">{value ? t('wk.onlineHelp') : t('wk.offlineHelp')}</span>
      </span>
      <span
        aria-hidden="true"
        className={`relative h-9 w-16 shrink-0 rounded-full transition ${value ? 'bg-mint' : 'bg-line/25'}`}
      >
        <span
          className={`absolute top-1 h-7 w-7 rounded-full bg-white shadow transition-all ${value ? 'left-8' : 'left-1'}`}
        />
      </span>
    </button>
  );
}
