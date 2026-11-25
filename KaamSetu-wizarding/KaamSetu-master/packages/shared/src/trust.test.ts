import { describe, expect, it } from 'vitest';
import { computeTrustScore, verificationLevelScore } from './trust.js';

describe('trust score', () => {
  it('maps verification levels', () => {
    expect(verificationLevelScore(false, 'none')).toBe(0);
    expect(verificationLevelScore(true, 'none')).toBe(40);
    expect(verificationLevelScore(true, 'pending')).toBe(60);
    expect(verificationLevelScore(true, 'verified')).toBe(100);
  });

  it('gives a neutral score to a brand-new worker', () => {
    const score = computeTrustScore({
      reviews: [],
      jobsCompleted: 0,
      jobsCancelled: 0,
      jobsAccepted: 0,
      phoneVerified: true,
      verificationStatus: 'none',
      responseRate: 50,
      avgResponseMinutes: 15,
      onTimeRate: 50,
      upheldDisputes: 0,
      fraudFlags: 0,
    });
    expect(score.total).toBeGreaterThan(30);
    expect(score.total).toBeLessThan(70);
  });

  it('rewards verified high performers and penalises fraud', () => {
    const now = new Date();
    const good = computeTrustScore({
      reviews: [
        { rating: 5, createdAt: now },
        { rating: 5, createdAt: now },
        { rating: 4, createdAt: now },
      ],
      jobsCompleted: 40,
      jobsCancelled: 1,
      jobsAccepted: 41,
      phoneVerified: true,
      verificationStatus: 'verified',
      responseRate: 95,
      avgResponseMinutes: 4,
      onTimeRate: 96,
      upheldDisputes: 0,
      fraudFlags: 0,
    });
    const flagged = computeTrustScore({
      reviews: [{ rating: 2, createdAt: now }],
      jobsCompleted: 2,
      jobsCancelled: 8,
      jobsAccepted: 10,
      phoneVerified: false,
      verificationStatus: 'none',
      responseRate: 20,
      avgResponseMinutes: 40,
      onTimeRate: 30,
      upheldDisputes: 2,
      fraudFlags: 3,
    });
    expect(good.total).toBeGreaterThan(80);
    expect(flagged.total).toBeLessThan(good.total);
    expect(flagged.penalties).toBe(2 * 8 + 3 * 5);
  });

  it('weights recent reviews more than old ones', () => {
    const now = new Date();
    const old = new Date(now.getTime() - 400 * 24 * 60 * 60 * 1000);
    const recentHigh = computeTrustScore({
      reviews: [
        { rating: 5, createdAt: now },
        { rating: 1, createdAt: old },
      ],
      jobsCompleted: 10,
      jobsCancelled: 0,
      jobsAccepted: 10,
      phoneVerified: true,
      verificationStatus: 'verified',
      responseRate: 80,
      avgResponseMinutes: 10,
      onTimeRate: 80,
      upheldDisputes: 0,
      fraudFlags: 0,
    });
    const recentLow = computeTrustScore({
      reviews: [
        { rating: 1, createdAt: now },
        { rating: 5, createdAt: old },
      ],
      jobsCompleted: 10,
      jobsCancelled: 0,
      jobsAccepted: 10,
      phoneVerified: true,
      verificationStatus: 'verified',
      responseRate: 80,
      avgResponseMinutes: 10,
      onTimeRate: 80,
      upheldDisputes: 0,
      fraudFlags: 0,
    });
    expect(recentHigh.rating).toBeGreaterThan(recentLow.rating);
  });
});
