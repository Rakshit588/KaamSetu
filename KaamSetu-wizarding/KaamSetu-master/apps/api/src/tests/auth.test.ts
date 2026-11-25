import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { setupTestDb, teardownTestDb } from './setup.js';

const app = createApp();

describe('auth OTP/JWT', () => {
  beforeAll(async () => {
    await setupTestDb();
  });
  afterAll(async () => {
    await teardownTestDb();
  });

  it('requests OTP, verifies 123456, selects role, and refreshes tokens', async () => {
    const phone = '9000000001';
    const reqOtp = await request(app).post('/auth/otp/request').send({ phone });
    expect(reqOtp.status).toBe(200);
    expect(reqOtp.body.ok).toBe(true);

    const bad = await request(app).post('/auth/otp/verify').send({ phone, otp: '000000' });
    expect(bad.status).toBe(400);

    const verify = await request(app).post('/auth/otp/verify').send({ phone, otp: '123456' });
    expect(verify.status).toBe(200);
    expect(verify.body.needsRole).toBe(true);
    expect(verify.body.accessToken).toBeTruthy();

    const me1 = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${verify.body.accessToken}`);
    expect(me1.body.user.phone).toBe('+919000000001');

    const role = await request(app)
      .post('/auth/role')
      .set('Authorization', `Bearer ${verify.body.accessToken}`)
      .send({ role: 'customer', name: 'Test Customer' });
    expect(role.status).toBe(200);
    expect(role.body.user.role).toBe('customer');

    const refresh = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken: verify.body.refreshToken });
    expect(refresh.status).toBe(200);
    expect(refresh.body.accessToken).toBeTruthy();
    expect(refresh.body.refreshToken).not.toBe(verify.body.refreshToken);

    const reuse = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken: verify.body.refreshToken });
    expect(reuse.status).toBe(401);
  });

  it('lists trades catalogue', async () => {
    const res = await request(app).get('/trades');
    expect(res.status).toBe(200);
    expect(res.body.trades.length).toBeGreaterThanOrEqual(8);
  });
});
