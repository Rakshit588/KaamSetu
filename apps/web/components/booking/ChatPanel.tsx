'use client';

import { Send } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/errors';
import { useT } from '@/lib/i18n';
import { useSocketEvent } from '@/lib/useSocketEvent';
import { Skeleton } from '../ui/Skeleton';

type Msg = { id: string; bookingId: string; senderId: string; text: string; createdAt: string };

// Messages arrive live over Socket.io and are also saved on the server, so history survives a reload.
export function ChatPanel({ bookingId, meId }: { bookingId: string; meId: string }) {
  const { t } = useT();
  const [messages, setMessages] = useState<Msg[] | null>(null);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const add = useCallback((m: Msg) => {
    setMessages((prev) => (prev && prev.some((x) => x.id === m.id) ? prev : [...(prev ?? []), m]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    api<{ items: Msg[] }>(`/chat/${bookingId}/messages`)
      .then((r) => {
        if (!cancelled) setMessages(r.items);
      })
      .catch(() => {
        if (!cancelled) setMessages([]);
      });
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  useSocketEvent<Msg>('chat:message', (m) => {
    if (m.bookingId === bookingId) add(m);
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages]);

  async function send() {
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    setError('');
    try {
      const res = await api<{ message: Msg }>(`/chat/${bookingId}/messages`, { body: { text: value } });
      add(res.message);
      setText('');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="card p-4 sm:p-5" aria-label={t('track.chat')}>
      <h2 className="font-display text-xl font-semibold">{t('track.chat')}</h2>
      <div className="mt-3 h-64 space-y-2 overflow-y-auto rounded-xl2 bg-surface2 p-3" role="log" aria-live="polite">
        {messages === null ? (
          <Skeleton className="h-10" />
        ) : messages.length === 0 ? (
          <p className="grid h-full place-items-center text-sm text-muted">{t('track.noMessages')}</p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === meId;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <p
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                    mine ? 'rounded-br-md bg-brand text-bg' : 'rounded-bl-md bg-surface shadow-soft'
                  }`}
                >
                  {m.text}
                </p>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-coral">
          {error}
        </p>
      )}
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
          placeholder={t('track.chatPlaceholder')}
          aria-label={t('track.chatPlaceholder')}
          className="h-12 min-w-0 flex-1 rounded-full border border-line/20 bg-surface px-4 outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/20"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          aria-label={t('track.send')}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-r from-saffron to-flame text-[#2a1600] disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </form>
    </section>
  );
}
