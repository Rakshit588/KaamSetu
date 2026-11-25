import { CITY_CONFIG } from './constants.js';
import type { BookingStatus } from './types.js';

export type BookingActor = 'customer' | 'worker' | 'admin' | 'system';

export const BOOKING_HAPPY_PATH = [
  'requested',
  'accepted',
  'on_the_way',
  'in_progress',
  'completed',
  'paid',
] as const satisfies readonly BookingStatus[];

export const ALLOWED_TRANSITIONS: Record<
  BookingStatus,
  Partial<Record<BookingStatus, BookingActor[]>>
> = {
  requested: {
    accepted: ['worker', 'system'],
    cancelled: ['customer', 'worker', 'admin', 'system'],
  },
  accepted: {
    on_the_way: ['worker'],
    cancelled: ['customer', 'worker', 'admin', 'system'],
    disputed: ['customer', 'worker', 'admin'],
  },
  on_the_way: {
    in_progress: ['worker'],
    cancelled: ['customer', 'admin', 'system'],
    disputed: ['customer', 'worker', 'admin'],
  },
  in_progress: {
    completed: ['worker'],
    disputed: ['customer', 'worker', 'admin'],
  },
  completed: {
    paid: ['customer', 'system'],
    disputed: ['customer', 'worker', 'admin'],
  },
  paid: {
    disputed: ['customer', 'worker', 'admin'],
  },
  cancelled: {},
  disputed: {
    completed: ['admin'],
    paid: ['admin'],
    cancelled: ['admin'],
  },
};

export class InvalidBookingTransition extends Error {
  constructor(
    public from: BookingStatus,
    public to: BookingStatus,
    public actor: BookingActor,
  ) {
    super(`Cannot transition booking from ${from} to ${to} as ${actor}`);
    this.name = 'InvalidBookingTransition';
  }
}

export function canTransition(
  from: BookingStatus,
  to: BookingStatus,
  actor: BookingActor,
): boolean {
  return Boolean(ALLOWED_TRANSITIONS[from]?.[to]?.includes(actor));
}

export function nextStatuses(from: BookingStatus): BookingStatus[] {
  return Object.keys(ALLOWED_TRANSITIONS[from] ?? {}) as BookingStatus[];
}

export function requiresStartOtp(from: BookingStatus, to: BookingStatus): boolean {
  return from === 'on_the_way' && to === 'in_progress';
}

export function requiresCompletionOtp(from: BookingStatus, to: BookingStatus): boolean {
  return from === 'in_progress' && to === 'completed';
}

export function assertBookingTransition(
  from: BookingStatus,
  to: BookingStatus,
  actor: BookingActor,
): void {
  if (!canTransition(from, to, actor)) {
    throw new InvalidBookingTransition(from, to, actor);
  }
}

export function haversineKm(from: [number, number], to: [number, number]): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(to[1] - from[1]);
  const dLng = toRad(to[0] - from[0]);
  const lat1 = toRad(from[1]);
  const lat2 = toRad(to[1]);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function etaMinutes(distanceKm: number, avgSpeedKmh = CITY_CONFIG.avgSpeedKmh): number {
  if (avgSpeedKmh <= 0) return 1;
  return Math.max(1, Math.round((distanceKm / avgSpeedKmh) * 60));
}

export function nextEmergencyRadiusKm(currentKm: number): number | null {
  const radii = CITY_CONFIG.emergencyRadiiKm;
  const idx = radii.findIndex((r) => r > currentKm);
  return idx === -1 ? null : radii[idx];
}
