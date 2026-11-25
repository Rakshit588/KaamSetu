'use client';

import { Share2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { IdCard } from '@/components/worker/IdCard';
import { VerificationForm } from '@/components/worker/VerificationForm';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';
import { useT } from '@/lib/i18n';
import type { WorkerProfileMe } from '@/lib/worker';

export default function WorkerIdPage() {
  const { t } = useT();
  const { user } = useAuth();
  const [profile, setProfile] = useState<WorkerProfileMe | null>(null);
  const [error, setError] = useState('');
  const [origin, setOrigin] = useState('');
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api<{ profile: WorkerProfileMe }>('/workers/me');
      setProfile(res.profile);
      setError('');
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  useEffect(() => {
    setOrigin(window.location.origin);
    void load();
  }, [load]);

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!profile) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  const link = `${origin}/customer/workers/${profile.digitalId ?? profile.userId}`;

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'KaamSetu', url: link });
        return;
      }
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* the person cancelled sharing */
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">{t('wid.title')}</h1>

      <IdCard
        name={user?.name ?? ''}
        digitalId={profile.digitalId ?? '—'}
        trades={profile.skills.map((s) => s.trade)}
        verified={profile.verification?.status === 'verified'}
        trustScore={Math.round(profile.trustScore ?? 0)}
        qrValue={link}
      />

      <button type="button" onClick={() => void share()} className="btn btn-ghost w-full">
        <Share2 size={18} /> {copied ? t('wid.copied') : t('wid.share')}
      </button>

      <VerificationForm profile={profile} onUpdated={setProfile} />
    </div>
  );
}
