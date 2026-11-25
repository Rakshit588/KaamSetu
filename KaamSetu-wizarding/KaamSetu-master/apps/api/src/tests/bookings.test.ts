import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { User } from '../models/User.js';
import { WorkerProfile } from '../models/WorkerProfile.js';
import { setupTestDb, teardownTestDb } from './setup.js';

const app = createApp();

// Meerut, same point for the job site and both workers so distance is ~0.
const SITE = { lng: 77.7064, lat: 28.9845 };

type Session = { token: string; id: string };

async function login(phone: string, role: 'customer' | 'worker', name: string): Promise<Session> {
  await request(app).post('/auth/otp/request').send({ phone });
  const verify = await request(app).post('/auth/otp/verify').send({ phone, otp: '123456' });
  expect(verify.status).toBe(200);
  const picked = await request(app)
    .post('/auth/role')
    .set('Authorization', `Bearer ${verify.body.accessToken}`)
    .send({ role, name });
  expect(picked.status).toBe(200);
  const token: string = picked.body.accessToken ?? verify.body.accessToken;
  const id = (jwt.decode(verify.body.accessToken) as { sub: string }).sub;
  return { token, id };
}

async function makeWorkerReady(userId: string) {
  const res = await WorkerProfile.updateOne(
    { userId },
    {
      $set: {
        location: { type: 'Point', coordinates: [SITE.lng, SITE.lat] },
        isAvailableNow: true,
        serviceRadiusKm: 15,
        skills: [{ trade: 'plumber', experienceYears: 4, hourlyRate: 250 }],
      },
    },
  );
  expect(res.matchedCount, 'a worker profile should exist after choosing the worker role').toBe(1);
}

const bearer = (s: Session) => ({ Authorization: `Bearer ${s.token}` });

describe('booking flow', () => {
  let customer: Session;
  let customer2: Session;
  let worker: Session;
  let worker2: Session;
  let bookingId = '';
  let startOtp = '';
  let completionOtp = '';

  beforeAll(async () => {
    await setupTestDb();
    customer = await login('9000000021', 'customer', 'Test Customer');
    customer2 = await login('9000000022', 'customer', 'Other Customer');
    worker = await login('9100000021', 'worker', 'Test Worker');
    worker2 = await login('9100000022', 'worker', 'Other Worker');
    await makeWorkerReady(worker.id);
    await makeWorkerReady(worker2.id);
  }, 60_000);

  afterAll(async () => {
    await teardownTestDb();
  });

  it('customer creates a direct booking and sees the OTPs', async () => {
    const res = await request(app)
      .post('/bookings')
      .set(bearer(customer))
      .send({
        workerId: worker.id,
        trade: 'plumber',
        ...SITE,
        address: 'Test lane, Meerut',
        estimatedDurationHrs: 2,
        urgency: 'normal',
      });
    expect(res.status).toBe(201);
    expect(res.body.booking.status).toBe('requested');
    expect(String(res.body.booking.startOtp)).toMatch(/^\d{4}$/);
    expect(res.body.booking.finalPrice).toBeGreaterThan(0);
    expect(res.body.booking.workerPay).toBeGreaterThan(0);
    bookingId = res.body.booking.id;
    startOtp = String(res.body.booking.startOtp);
    completionOtp = String(res.body.booking.completionOtp);
  });

  it('the offered worker sees the request but not the OTPs', async () => {
    const res = await request(app).get('/bookings/requests/open').set(bearer(worker));
    expect(res.status).toBe(200);
    const item = res.body.items.find((b: { id: string }) => b.id === bookingId);
    expect(item).toBeTruthy();
    expect(item.startOtp).toBeUndefined();
    expect(item.completionOtp).toBeUndefined();
  });

  it('a worker who was not offered the job cannot accept it', async () => {
    const res = await request(app).post(`/bookings/${bookingId}/accept`).set(bearer(worker2));
    expect(res.status).toBe(403);
  });

  it('a stranger cannot view the booking', async () => {
    const res = await request(app).get(`/bookings/${bookingId}`).set(bearer(customer2));
    expect(res.status).toBe(403);
  });

  it('the offered worker accepts', async () => {
    const res = await request(app).post(`/bookings/${bookingId}/accept`).set(bearer(worker));
    expect(res.status).toBe(200);
    expect(res.body.booking.status).toBe('accepted');
  });

  it('a non-party worker cannot change the status', async () => {
    const res = await request(app)
      .post(`/bookings/${bookingId}/status`)
      .set(bearer(worker2))
      .send({ to: 'on_the_way' });
    expect(res.status).toBe(403);
  });

  it('worker goes on the way', async () => {
    const res = await request(app)
      .post(`/bookings/${bookingId}/status`)
      .set(bearer(worker))
      .send({ to: 'on_the_way' });
    expect(res.status).toBe(200);
    expect(res.body.booking.status).toBe('on_the_way');
  });

  it('start fails with a wrong OTP and works with the right one', async () => {
    const wrong = startOtp === '0000' ? '1111' : '0000';
    const bad = await request(app)
      .post(`/bookings/${bookingId}/status`)
      .set(bearer(worker))
      .send({ to: 'in_progress', otp: wrong, ...SITE });
    expect(bad.status).toBe(400);

    const ok = await request(app)
      .post(`/bookings/${bookingId}/status`)
      .set(bearer(worker))
      .send({ to: 'in_progress', otp: startOtp, ...SITE });
    expect(ok.status).toBe(200);
    expect(ok.body.booking.status).toBe('in_progress');
  });

  it('completion needs the completion OTP and moves payment to pending release', async () => {
    const wrong = completionOtp === '0000' ? '1111' : '0000';
    const bad = await request(app)
      .post(`/bookings/${bookingId}/status`)
      .set(bearer(worker))
      .send({ to: 'completed', otp: wrong, ...SITE });
    expect(bad.status).toBe(400);

    const ok = await request(app)
      .post(`/bookings/${bookingId}/status`)
      .set(bearer(worker))
      .send({ to: 'completed', otp: completionOtp, ...SITE });
    expect(ok.status).toBe(200);
    expect(ok.body.booking.status).toBe('completed');
    expect(ok.body.booking.payment.status).toBe('pending_release');
  });

  it('a worker cannot release payment', async () => {
    const res = await request(app).post(`/bookings/${bookingId}/release`).set(bearer(worker));
    expect(res.status).toBe(403);
  });

  it('customer pays (demo) and releases the payment', async () => {
    const pay = await request(app).post(`/bookings/${bookingId}/pay`).set(bearer(customer));
    expect(pay.status).toBe(200);
    expect(pay.body.demo).toBe(true);

    const release = await request(app).post(`/bookings/${bookingId}/release`).set(bearer(customer));
    expect(release.status).toBe(200);
    expect(release.body.booking.status).toBe('paid');
    expect(release.body.booking.payment.status).toBe('released');
  });

  it('the worker wallet and earnings go up by the worker pay', async () => {
    const res = await request(app).get(`/bookings/${bookingId}`).set(bearer(customer));
    const workerPay: number = res.body.booking.workerPay;
    expect(workerPay).toBeGreaterThan(0);

    const user = await User.findById(worker.id);
    expect((user as any).walletBalance).toBeCloseTo(workerPay);

    const profile = await WorkerProfile.findOne({ userId: worker.id });
    expect((profile as any).earningsTotal).toBeCloseTo(workerPay);
  });

  it('cannot pay before the job is completed', async () => {
    const created = await request(app)
      .post('/bookings')
      .set(bearer(customer))
      .send({
        workerId: worker.id,
        trade: 'plumber',
        ...SITE,
        estimatedDurationHrs: 1,
        urgency: 'normal',
      });
    expect(created.status).toBe(201);
    const res = await request(app)
      .post(`/bookings/${created.body.booking.id}/pay`)
      .set(bearer(customer));
    expect(res.status).toBe(400);
  });

  it('emergency booking notifies nearby workers and only one can win', async () => {
    const res = await request(app)
      .post('/bookings/emergency')
      .set(bearer(customer))
      .send({ trade: 'plumber', ...SITE, address: 'Emergency lane, Meerut', estimatedDurationHrs: 1 });
    expect(res.status).toBe(201);
    expect(res.body.booking.isEmergency).toBe(true);
    expect(res.body.notifiedCount).toBe(2);

    const id = res.body.booking.id;
    const [a, b] = await Promise.all([
      request(app).post(`/bookings/${id}/accept`).set(bearer(worker)),
      request(app).post(`/bookings/${id}/accept`).set(bearer(worker2)),
    ]);
    expect([a.status, b.status].sort()).toEqual([200, 409]);
  });
});