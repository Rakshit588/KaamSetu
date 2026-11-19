'use client';

import { BellOff, CheckCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { UNREAD_CHANGED_EVENT } from '@/components/app/NotificationBell';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { ApiError, api } from '@/lib/api';
import { timeAgo } from '@/lib/format';
import { useT } from '@/lib/i18n';
import { useSocketEvent } from '@/lib/useSocketEvent';

type Item = {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  readAt: string | null;
  createdAt: string;
};

type Payload = { items: Item[]; unread: number };

export default function CustomerNotificationsPage() {
  const { t, lang } = useT();
  const router = useRouter();
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await api<Payload>('/notifications?limit=30');
      setData(res);
      window.dispatchEvent(new CustomEvent(UNREAD_CHANGED_EVENT, { detail: res.unread }));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('common.error'));
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  // A new notification arrives while this page is open.
  useSocketEvent('notification:new', () => void load());

  const markAll = async () => {
    await api('/notifications/read-all', { method: 'POST' }).catch(() => undefined);
    await load();
  };

  const open = async (item: Item) => {
    if (!item.readAt) await api(`/notifications/${item.id}/read`, { method: 'POST' }).catch(() => undefined);
    if (item.data?.bookingId) router.push(`/customer/bookings/${item.data.bookingId}`);
    else await load();
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold tracking-tight">{t('notifications.title')}</h1>
        {data && data.unread > 0 && (
          <button type="button" onClick={() => void markAll()} className="btn btn-ghost !min-h-[44px] !py-2 text-sm">
            <CheckCheck size={16} /> {t('notifications.markAll')}
          </button>
        )}
      </div>

      <div className="mt-6 space-y-3">
        {error ? (
          <ErrorState message={error} onRetry={() => void load()} />
        ) : !data ? (
          <>
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </>
        ) : data.items.length === 0 ? (
          <EmptyState icon={BellOff} title={t('notifications.empty')} text={t('notifications.emptyText')} />
        ) : (
          data.items.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => void open(n)}
              className={`card flex w-full items-start gap-3 p-4 text-left transition hover:shadow-lift ${
                n.readAt ? 'opacity-75' : ''
              }`}
            >
              <span
                aria-hidden="true"
                className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${n.readAt ? 'bg-transparent' : 'bg-flame'}`}
              />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{n.title}</span>
                <span className="mt-0.5 block text-sm text-muted">{n.body}</span>
                <span className="mt-1.5 block text-xs text-muted">{timeAgo(n.createdAt, lang)}</span>
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
