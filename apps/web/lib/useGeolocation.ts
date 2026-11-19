'use client';

import { useCallback, useState } from 'react';
import type { Place } from './location';

type State = { status: 'idle' | 'loading' | 'ok' | 'denied' | 'unsupported'; coords?: Place };

export function useGeolocation() {
  const [state, setState] = useState<State>({ status: 'idle' });

  const request = useCallback(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setState({ status: 'unsupported' });
      return;
    }
    setState({ status: 'loading' });
    navigator.geolocation.getCurrentPosition(
      (pos) => setState({ status: 'ok', coords: { lat: pos.coords.latitude, lng: pos.coords.longitude } }),
      () => setState({ status: 'denied' }),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }, []);

  return { ...state, request };
}
