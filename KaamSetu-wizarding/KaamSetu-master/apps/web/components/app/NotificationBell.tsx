'use client';

import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useSocketEvent } from '@/lib/useSocketEvent';

export const UNREAD_CHANGED_EVENT = 'ks:unread-changed';

export function NotificationBell({ href }: { href: string }) {
  const { t } = useT();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api<{ unread: number }>('/notifications/unread-count')
      .then((r) => {
        if (!cancelled) setUnread(r.unread);
      })
      .catch(() => undefined);
    const onChanged = (e: Event) => setUnread((e as CustomEvent<number>).detail);
    window.addEventListener(UNREAD_CHANGED_EVENT, onChanged);
    return () => {
      cancelled = true;
      window.removeEventListener(UNREAD_CHANGED_EVENT, onChanged);
    };
  }, []);

  useSocketEvent('notification:new', () => setUnread((u) => u + 1));

  return (
    <Link
      href={href}
      aria-label={`${t('shell.notifications')}${unread ? ` (${unread})` : ''}`}
      className="relative grid h-11 w-11 place-items-center rounded-full border border-line/30 bg-surface/70 transition hover:bg-surface"
    >
      <Bell size={18} />
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-[20px] place-items-center rounded-full bg-coral px-1 text-[11px] font-bold text-[#fff4ee]">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  );
}
