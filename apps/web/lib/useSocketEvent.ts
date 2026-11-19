'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from './auth';
import { getSocket } from './socket';

// Subscribe to a Socket.io event while signed in. The handler can change between renders without resubscribing.
export function useSocketEvent<T = unknown>(event: string, handler: (payload: T) => void) {
  const { status } = useAuth();
  const saved = useRef(handler);

  useEffect(() => {
    saved.current = handler;
  });

  useEffect(() => {
    if (status !== 'authed') return;
    const socket = getSocket();
    if (!socket) return;
    const listener = (payload: T) => saved.current(payload);
    socket.on(event, listener);
    return () => {
      socket.off(event, listener);
    };
  }, [event, status]);
}
