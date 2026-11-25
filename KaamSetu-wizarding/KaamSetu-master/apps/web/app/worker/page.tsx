'use client';

import { useCallback, useEffect, useState } from 'react';
import { Onboarding } from '@/components/worker/Onboarding';
import { WorkerHome } from '@/components/worker/WorkerHome';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/errors';
import type { WorkerProfileMe } from '@/lib/worker';

export default function WorkerHomePage() {
  const [profile, setProfile] = useState<WorkerProfileMe | null>(null);
  const [error, setError] = useState('');

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
    void load();
  }, [load]);

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  // A profile without any trade has not been set up yet.
  if (!profile.skills || profile.skills.length === 0) return <Onboarding onDone={() => void load()} />;

  return <WorkerHome profile={profile} onProfileChange={setProfile} />;
}
