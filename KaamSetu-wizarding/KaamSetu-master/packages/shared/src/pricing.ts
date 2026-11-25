import { PLATFORM_FEE_RATE } from './constants.js';
import type { PriceBreakdown, PriceEstimateInput } from './types.js';

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function urgencyMultiplier(
  urgency: PriceEstimateInput['urgency'],
  isNight: boolean,
  emergencyIntensity = 1,
): number {
  let base = 1;
  if (urgency === 'same_day') base = 1.15;
  if (urgency === 'emergency') {
    const intensity = clamp(emergencyIntensity, 0, 1);
    base = 1.25 + intensity * 0.25;
  }
  if (isNight) base *= 1.3;
  return Math.min(1.6, Math.round(base * 100) / 100);
}

export function estimatePrice(input: PriceEstimateInput): PriceBreakdown {
  const hourly = clamp(
    input.workerHourlyRate ?? input.baseRateHour,
    input.minRate,
    input.maxRate,
  );
  const duration = Math.max(0.5, input.estimatedDurationHrs);
  const multiplier = urgencyMultiplier(input.urgency, input.isNight, input.emergencyIntensity);
  const workerPay = Math.round(hourly * duration * 100) / 100;
  const withUrgency = Math.round(workerPay * multiplier * 100) / 100;
  const urgencySurcharge = Math.round((withUrgency - workerPay) * 100) / 100;
  const feeRate = input.platformFeeRate ?? PLATFORM_FEE_RATE;
  const platformFee = Math.round(withUrgency * feeRate * 100) / 100;
  const total = Math.round((withUrgency + platformFee) * 100) / 100;
  return {
    workerPay,
    urgencyMultiplier: multiplier,
    urgencySurcharge,
    platformFee,
    total,
    min: Math.round(total * 0.9),
    max: Math.round(total * 1.1),
  };
}
