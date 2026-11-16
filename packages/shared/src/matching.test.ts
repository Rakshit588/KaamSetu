import { describe, expect, it } from 'vitest';
import { mapTextToTrade, scoreCandidate, WeightedMatchingService } from './matching.js';

describe('matching', () => {
  it('ranks a nearby available trusted worker higher', () => {
    const service = new WeightedMatchingService();
    const ranked = service.rank([
      {
        workerId: 'far',
        skillMatch: 100,
        distanceKm: 9,
        searchRadiusKm: 10,
        trustScore: 40,
        isAvailableNow: false,
        priceFit: 50,
        pastSuccessWithCustomer: 0,
        responseRate: 40,
      },
      {
        workerId: 'near',
        skillMatch: 100,
        distanceKm: 0.5,
        searchRadiusKm: 10,
        trustScore: 90,
        isAvailableNow: true,
        priceFit: 90,
        pastSuccessWithCustomer: 80,
        responseRate: 95,
      },
    ]);
    expect(ranked[0].workerId).toBe('near');
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
    expect(ranked[0].reasons).toHaveLength(3);
  });

  it('returns why-this-match reasons', () => {
    const result = scoreCandidate({
      workerId: 'w1',
      skillMatch: 100,
      distanceKm: 1,
      searchRadiusKm: 10,
      trustScore: 80,
      isAvailableNow: true,
      priceFit: 70,
      pastSuccessWithCustomer: 0,
      responseRate: 60,
    });
    expect(result.reasons[0].label.length).toBeGreaterThan(5);
  });

  it('maps free text in English and Hindi to a trade', () => {
    expect(mapTextToTrade('tap is leaking in the kitchen').trade).toBe('plumber');
    expect(mapTextToTrade('नल से पानी लीक हो रहा है').trade).toBe('plumber');
    expect(mapTextToTrade('need electrician now').urgency).toBe('emergency');
  });
});
