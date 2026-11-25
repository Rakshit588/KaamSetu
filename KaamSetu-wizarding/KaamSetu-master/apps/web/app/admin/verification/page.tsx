'use client';

import { BadgeCheck, Loader2, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { MinistrySeal } from '@/components/magic/MinistrySeal';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/errors';

// Shape of GET /admin/verifications items (WorkerProfile documents with a pending verification).
type PendingWorker = {
  _id: string;
  digitalId?: string;
  bio?: string;
  skills?: { trade: string; experienceYears: number }[];
  verification: { idType?: string | null; idNumberMasked?: string; status: string };
};

export default function AdminVerificationPage() {
  const [items, setItems] = useState<PendingWorker[] | null>(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const r = await api<{ pending: PendingWorker[] }>('/admin/verifications');
      setItems(r.pending);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(id: string, status: 'verified' | 'rejected') {
    setMessage('');
    if (status === 'rejected' && !(reasons[id] ?? '').trim()) {
      setMessage('Add a short reason before rejecting, so the worker knows what to fix.');
      return;
    }
    setBusyId(id);
    try {
      await api(`/admin/verifications/${id}`, {
        body: { status, ...(status === 'rejected' ? { rejectionReason: reasons[id].trim() } : {}) },
      });
      setItems((prev) => (prev ?? []).filter((w) => w._id !== id));
    } catch (e) {
      setMessage(errorMessage(e));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-wide">Ministry Certification Office</h1>
        <p className="mt-1 font-serif text-xl text-muted">Review worker ID submissions. Only the masked ID number is stored.</p>
      </div>

      {message && (
        <p role="alert" className="rounded-xl2 border border-coral/40 bg-coral/10 px-4 py-3 text-sm font-medium text-coral">
          {message}
        </p>
      )}

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : items === null ? (
        <div className="space-y-3">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState title="The queue is clear" text="No workers are waiting for verification." />
      ) : (
        <ul className="space-y-4">
          {items.map((w) => (
            <li key={w._id} className="card p-5">
              <div className="flex items-start gap-4">
                <MinistrySeal size={48} className="opacity-60" />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm font-bold tracking-widest text-brand">{w.digitalId ?? w._id}</p>
                  <p className="mt-1 text-sm text-muted">
                    {w.verification.idType ?? 'ID'}: <span className="font-mono">{w.verification.idNumberMasked || '-'}</span>
                  </p>
                  {w.skills && w.skills.length > 0 && (
                    <p className="mt-1 text-sm">
                      {w.skills.map((s) => `${s.trade} (${s.experienceYears} yr)`).join(', ')}
                    </p>
                  )}
                  {w.bio && <p className="mt-2 font-serif text-lg text-ink/85">{w.bio}</p>}
                </div>
              </div>
              <label className="mt-4 block text-sm font-semibold" htmlFor={`reason-${w._id}`}>
                Reason (needed only to reject)
              </label>
              <input
                id={`reason-${w._id}`}
                value={reasons[w._id] ?? ''}
                onChange={(e) => setReasons((r) => ({ ...r, [w._id]: e.target.value }))}
                className="mt-1 h-12 w-full rounded-xl2 border border-line/30 bg-surface px-4 outline-none focus:border-brand"
                placeholder="For example: photo is blurry"
              />
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" disabled={busyId === w._id} onClick={() => void decide(w._id, 'verified')} className="btn btn-primary">
                  {busyId === w._id ? <Loader2 size={18} className="animate-spin" /> : <BadgeCheck size={18} />} Approve
                </button>
                <button type="button" disabled={busyId === w._id} onClick={() => void decide(w._id, 'rejected')} className="btn btn-ghost !border-coral/50 !text-coral">
                  <XCircle size={18} /> Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
