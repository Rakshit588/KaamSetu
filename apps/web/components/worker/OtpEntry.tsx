'use client';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useT } from '@/lib/i18n';

// 4-digit code the customer reads out (start code or completion code).
export function OtpEntry({
  help,
  submitLabel,
  busy,
  onSubmit,
}: {
  help: string;
  submitLabel: string;
  busy: boolean;
  onSubmit: (code: string) => void;
}) {
  const { t } = useT();
  const [code, setCode] = useState('');
  return (
    <form
      className="card p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (code.length === 4) onSubmit(code);
      }}
    >
      <p className="text-sm text-muted">{help}</p>
      <label htmlFor="otp4" className="mt-3 block text-sm font-semibold">
        {t('wk.job.otpLabel')}
      </label>
      <input
        id="otp4"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="0000"
        className="mt-2 h-16 w-full rounded-xl2 border border-line/20 bg-surface text-center font-mono text-4xl font-bold tracking-[0.4em] outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/20"
      />
      <button type="submit" disabled={busy || code.length !== 4} className="btn btn-primary mt-4 w-full disabled:opacity-60">
        {busy ? <Loader2 size={18} className="animate-spin" /> : submitLabel}
      </button>
    </form>
  );
}
