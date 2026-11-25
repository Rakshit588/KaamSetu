import { TRUST_WEIGHTS } from './constants.js';
import type { TrustScoreBreakdown, TrustScoreInput, VerificationStatus } from './types.js';

function clamp(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, n));
}

function daysBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24);
}

export function verificationLevelScore(
  phoneVerified: boolean,
  status: VerificationStatus,
): number {
  if (status === 'verified') return 100;
  if (status === 'pending') return 60;
  if (phoneVerified) return 40;
  if (status === 'rejected') return 20;
  return 0;
}

export function weightedRatingScore(reviews: TrustScoreInput['reviews'], now = new Date()): number {
  if (!reviews.length) return 50;
  let weightedSum = 0;
  let weightTotal = 0;
  for (const review of reviews) {
    const weight = Math.exp(-daysBetween(now, review.createdAt) / 90);
    weightedSum += review.rating * weight;
    weightTotal += weight;
  }
  const avg = weightTotal === 0 ? 3 : weightedSum / weightTotal;
  return clamp((avg / 5) * 100);
}

export function computeTrustScore(input: TrustScoreInput, now = new Date()): TrustScoreBreakdown {
  const rating = weightedRatingScore(input.reviews, now);

  const considered = input.jobsCompleted + input.jobsCancelled;
  const completion = considered === 0 ? 50 : clamp((input.jobsCompleted / considered) * 100);

  const verification = verificationLevelScore(input.phoneVerified, input.verificationStatus);

  const speedScore = clamp(100 - input.avgResponseMinutes * 2);
  const response = clamp(input.responseRate * 0.7 + speedScore * 0.3);

  const experience = clamp((Math.log10(input.jobsCompleted + 1) / Math.log10(101)) * 100);

  const cancelPenalty = considered === 0 ? 0 : (input.jobsCancelled / considered) * 100;
  const punctuality = clamp(input.onTimeRate * 0.7 + (100 - cancelPenalty) * 0.3);

  const penalties = input.upheldDisputes * 8 + input.fraudFlags * 5;

  const total = clamp(
    rating * TRUST_WEIGHTS.rating +
      completion * TRUST_WEIGHTS.completion +
      verification * TRUST_WEIGHTS.verification +
      response * TRUST_WEIGHTS.response +
      experience * TRUST_WEIGHTS.experience +
      punctuality * TRUST_WEIGHTS.punctuality -
      penalties,
  );

  return {
    rating: round1(rating),
    completion: round1(completion),
    verification: round1(verification),
    response: round1(response),
    experience: round1(experience),
    punctuality: round1(punctuality),
    penalties: round1(penalties),
    total: Math.round(total),
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
