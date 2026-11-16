import { describe, expect, it } from 'vitest';
import { estimatePrice, urgencyMultiplier } from './pricing.js';

describe('pricing', () => {
  it('applies urgency and platform fee transparently', () => {
    const estimate = estimatePrice({
      baseRateHour: 100,
      baseRateDay: 700,
      minRate: 50,
      maxRate: 200,
      estimatedDurationHrs: 2,
      urgency: 'normal',
      isNight: false,
      platformFeeRate: 0.08,
    });
    expect(estimate.workerPay).toBe(200);
    expect(estimate.urgencyMultiplier).toBe(1);
    expect(estimate.platformFee).toBe(16);
    expect(estimate.total).toBe(216);
    expect(estimate.min).toBeLessThanOrEqual(estimate.total);
    expect(estimate.max).toBeGreaterThanOrEqual(estimate.total);
  });

  it('clamps worker rate to the trade band', () => {
    const estimate = estimatePrice({
      baseRateHour: 100,
      baseRateDay: 700,
      minRate: 50,
      maxRate: 120,
      workerHourlyRate: 999,
      estimatedDurationHrs: 1,
      urgency: 'normal',
      isNight: false,
    });
    expect(estimate.workerPay).toBe(120);
  });

  it('uses emergency 1.25–1.5 and night 1.3 with a 1.6 cap', () => {
    expect(urgencyMultiplier('same_day', false)).toBe(1.15);
    expect(urgencyMultiplier('emergency', false, 0)).toBe(1.25);
    expect(urgencyMultiplier('emergency', false, 1)).toBe(1.5);
    expect(urgencyMultiplier('emergency', true, 1)).toBe(1.6);
  });
});
