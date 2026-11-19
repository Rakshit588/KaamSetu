'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '../ui/Skeleton';
import type { MapViewProps } from './types';

// Leaflet needs the browser, so it is loaded on the client only. Swap the provider here later (e.g. Google Maps).
const Inner = dynamic(() => import('./MapViewInner'), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full !rounded-none" />,
});

export function MapView({ className = 'h-72', ...props }: MapViewProps) {
  return (
    <div className={`relative overflow-hidden rounded-xl3 border border-line/10 ${className}`}>
      <Inner {...props} />
    </div>
  );
}
