import { CITY_CONFIG } from '@kaamsetu/shared';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { User } from '../models/User.js';
import { WorkerProfile } from '../models/WorkerProfile.js';
import { digitalWorkerId } from '../utils/crypto.js';
import { recomputeWorkerTrust } from '../services/trust.js';
import { setupTestDb, teardownTestDb } from './setup.js';

const app = createApp();

async function loginAs(phone: string, role: 'worker' | 'customer' | 'admin', name: string) {
  await request(app).post('/auth/otp/request').send({ phone });
  const verify = await request(app).post('/auth/otp/verify').send({ phone, otp: '123456' });
  const token = verify.body.accessToken as string;
  if (role === 'admin') {
    await User.findOneAndUpdate({ phone: `+91${phone}` }, { role: 'admin', name });
    const again = await request(app).post('/auth/otp/request').send({ phone });
    expect(again.status).toBe(200);
    const v2 = await request(app).post('/auth/otp/verify').send({ phone, otp: '123456' });
    return v2.body.accessToken as string;
  }
  const picked = await request(app)
    .post('/auth/role')
    .set('Authorization', `Bearer ${token}`)
    .send({ role, name });
  return picked.body.accessToken as string;
}

describe('worker profile, geo search, matching, pricing, trust', () => {
  beforeAll(async () => {
    await setupTestDb();
  });
  afterAll(async () => {
    await teardownTestDb();
  });

  it('updates worker profile, submits verification, ranks nearby workers, estimates price', async () => {
    const workerToken = await loginAs('9100000001', 'worker', 'Ramesh Plumber');
    const customerToken = await loginAs('9000000099', 'customer', 'Anita');
    const adminToken = await loginAs('9999999999', 'admin', 'Admin');

    const me = await request(app)
      .put('/workers/me')
      .set('Authorization', `Bearer ${workerToken}`)
      .send({
        bio: 'Plumber in Meerut',
        location: {
          lng: CITY_CONFIG.center.coordinates[0],
          lat: CITY_CONFIG.center.coordinates[1],
        },
        skills: [{ trade: 'plumber', experienceYears: 8, hourlyRate: 160 }],
      });
    expect(me.status).toBe(200);

    const avail = await request(app)
      .put('/workers/me/availability')
      .set('Authorization', `Bearer ${workerToken}`)
      .send({ isAvailableNow: true });
    expect(avail.body.profile.isAvailableNow).toBe(true);

    const kyc = await request(app)
      .post('/workers/me/verification')
      .set('Authorization', `Bearer ${workerToken}`)
      .send({
        idType: 'aadhaar',
        idNumber: '123412341234',
        idDocUrl: '/uploads/id.jpg',
        selfieUrl: '/uploads/selfie.jpg',
      });
    expect(kyc.status).toBe(200);
    expect(kyc.body.profile.verification.status).toBe('pending');
    expect(kyc.body.profile.verification.idNumberMasked).toContain('1234');
    expect(kyc.body.profile.verification.idNumberMasked).not.toContain('123412341234');

    const pending = await request(app)
      .get('/admin/verifications')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(pending.status).toBe(200);
    const profileId = pending.body.pending[0]._id;
    const approve = await request(app)
      .post(`/admin/verifications/${profileId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'verified' });
    expect(approve.body.profile.verification.status).toBe('verified');
    expect(approve.body.trust.verification).toBe(100);

    const far = await User.create({
      phone: '+919100000088',
      name: 'Far Worker',
      role: 'worker',
    });
    await WorkerProfile.create({
      userId: far._id,
      digitalId: digitalWorkerId(),
      skills: [{ trade: 'plumber', experienceYears: 1, hourlyRate: 140 }],
      location: { type: 'Point', coordinates: [78.5, 29.5] },
      isAvailableNow: true,
      verification: { phoneVerified: true, status: 'none' },
    });
    await recomputeWorkerTrust(String(far._id));

    const search = await request(app).get('/workers/search').query({
      trade: 'plumber',
      lng: CITY_CONFIG.center.coordinates[0],
      lat: CITY_CONFIG.center.coordinates[1],
      radiusKm: 10,
      availableNow: true,
    });
    expect(search.status).toBe(200);
    expect(search.body.workers.length).toBeGreaterThanOrEqual(1);
    expect(search.body.workers[0].matchReasons.length).toBeGreaterThan(0);
    expect(search.body.workers[0].price.platformFee).toBeGreaterThan(0);

    const price = await request(app)
      .post('/pricing/estimate')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ trade: 'plumber', estimatedDurationHrs: 2, urgency: 'emergency' });
    expect(price.status).toBe(200);
    expect(price.body.breakdown.urgencyMultiplier).toBeGreaterThan(1);
    expect(price.body.notes.platformFee).toBeTruthy();

    const interpret = await request(app)
      .post('/ai/interpret')
      .send({ text: 'kitchen tap leaking urgently' });
    expect(interpret.body.trade).toBe('plumber');
    expect(interpret.body.urgency).toBe('emergency');
  });
});
