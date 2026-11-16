import { describe, expect, it } from 'vitest';
import {
  ALLOWED_TRANSITIONS,
  BOOKING_HAPPY_PATH,
  assertBookingTransition,
  canTransition,
  etaMinutes,
  haversineKm,
  nextEmergencyRadiusKm,
  nextStatuses,
  requiresCompletionOtp,
  requiresStartOtp,
  InvalidBookingTransition,
} from './booking.js';

describe('booking state machine', () => {
  it('allows the happy path for the correct actors', () => {
    expect(canTransition('requested', 'accepted', 'worker')).toBe(true);
    expect(canTransition('accepted', 'on_the_way', 'worker')).toBe(true);
    expect(canTransition('on_the_way', 'in_progress', 'worker')).toBe(true);
    expect(canTransition('in_progress', 'completed', 'worker')).toBe(true);
    expect(canTransition('completed', 'paid', 'customer')).toBe(true);
  });

  it('rejects skipping steps and wrong actors', () => {
    expect(canTransition('requested', 'completed', 'worker')).toBe(false);
    expect(canTransition('requested', 'accepted', 'customer')).toBe(false);
    expect(canTransition('in_progress', 'cancelled', 'worker')).toBe(false);
    expect(() => assertBookingTransition('requested', 'paid', 'system')).toThrow(
      InvalidBookingTransition,
    );
  });

  it('requires start and completion OTPs at the right transitions', () => {
    expect(requiresStartOtp('on_the_way', 'in_progress')).toBe(true);
    expect(requiresStartOtp('accepted', 'on_the_way')).toBe(false);
    expect(requiresCompletionOtp('in_progress', 'completed')).toBe(true);
    expect(requiresCompletionOtp('completed', 'paid')).toBe(false);
  });

  it('lists next statuses and covers every happy-path hop', () => {
    for (let i = 0; i < BOOKING_HAPPY_PATH.length - 1; i++) {
      const from = BOOKING_HAPPY_PATH[i];
      const to = BOOKING_HAPPY_PATH[i + 1];
      expect(nextStatuses(from)).toContain(to);
      expect(ALLOWED_TRANSITIONS[from][to]?.length).toBeGreaterThan(0);
    }
  });

  it('computes distance, ETA, and expanding emergency radii', () => {
    const km = haversineKm([77.7064, 28.9845], [77.7264, 28.9845]);
    expect(km).toBeGreaterThan(1);
    expect(km).toBeLessThan(3);
    expect(etaMinutes(11, 22)).toBe(30);
    expect(nextEmergencyRadiusKm(2)).toBe(5);
    expect(nextEmergencyRadiusKm(5)).toBe(10);
    expect(nextEmergencyRadiusKm(10)).toBeNull();
  });
});
