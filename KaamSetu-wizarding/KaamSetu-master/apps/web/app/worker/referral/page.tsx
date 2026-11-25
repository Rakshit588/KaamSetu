'use client';

import { Copy, Gift, Share2 } from 'lucide-react';
import { useState } from 'react';
import { DemoBadge } from '@/components/ui/DemoBadge';
import { useAuth } from '@/lib/auth';
import { useT } from '@/lib/i18n';

export default function WorkerReferralPage() {
  const { t } = useT();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const code = user?.referralCode ?? '';
  const message = t('wf.shareText', { code });

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ text: message });
        return;
      }
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* the person cancelled sharing */
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard can be blocked */
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight">{t('wf.title')}</h1>
        <DemoBadge />
      </div>

      <section className="card p-6 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-saffron/15 text-flame">
          <Gift size={26} />
        </span>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted">{t('wf.code')}</p>
        <p className="mt-2 font-mono text-4xl font-bold tracking-[0.2em]">{code || '—'}</p>
        {!code && <p className="mt-2 text-sm text-muted">{t('wf.noCode')}</p>}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={() => void share()} disabled={!code} className="btn btn-primary disabled:opacity-60">
            <Share2 size={18} /> {t('wf.share')}
          </button>
          <button type="button" onClick={() => void copy()} disabled={!code} className="btn btn-ghost disabled:opacity-60">
            <Copy size={18} /> {copied ? t('wf.copied') : t('wf.copy')}
          </button>
        </div>
      </section>

      <p className="text-muted">{t('wf.how')}</p>
      <p className="text-sm font-medium text-flame">{t('wf.soon')}</p>
    </div>
  );
}
