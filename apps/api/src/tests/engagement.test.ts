import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { WorkerProfile } from '../models/WorkerProfile.js';
import { setupTestDb, teardownTestDb } from './setup.js';

const app = createApp();
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

describe('reviews, chat, notifications, wallet', () => {
  let customer: Session;
  let customer2: Session;
  let worker: Session;
  let bookingId = '';
  let workerPay = 0;

  beforeAll(async () => {
    await setupTestDb();
    customer = await login('9000000031', 'customer', 'Review Customer');
    customer2 = await login('9000000032', 'customer', 'Stranger Customer');
    worker = await login('9100000031', 'worker', 'Review Worker');
    await makeWorkerReady(worker.id);
  }, 60_000);

  afterAll(async () => {
    await teardownTestDb();
  });

  async function post(path: string, who: Session, body: object = {}) {
    return request(app).post(path).set(bearer(who)).send(body);
  }

  it('cannot review a booking that is not completed yet', async () => {
    const created = await post('/bookings', customer, {
      workerId: worker.id,
      trade: 'plumber',
      ...SITE,
      estimatedDurationHrs: 1,
      urgency: 'normal',
    });
    expect(created.status).toBe(201);
    const early = await post('/reviews', customer, {
      bookingId: created.body.booking.id,
      rating: 5,
    });
    expect(early.status).toBe(400);
  });

  it('a booking runs to completion', async () => {
    const created = await post('/bookings', customer, {
      workerId: worker.id,
      trade: 'plumber',
      ...SITE,
      estimatedDurationHrs: 2,
      urgency: 'normal',
    });
    expect(created.status).toBe(201);
    bookingId = created.body.booking.id;
    const startOtp = String(created.body.booking.startOtp);
    const completionOtp = String(created.body.booking.completionOtp);
    workerPay = created.body.booking.workerPay;

    expect((await post(`/bookings/${bookingId}/accept`, worker)).status).toBe(200);
    expect((await post(`/bookings/${bookingId}/status`, worker, { to: 'on_the_way' })).status).toBe(
      200,
    );
    expect(
      (await post(`/bookings/${bookingId}/status`, worker, { to: 'in_progress', otp: startOtp, ...SITE }))
        .status,
    ).toBe(200);
    expect(
      (
        await post(`/bookings/${bookingId}/status`, worker, {
          to: 'completed',
          otp: completionOtp,
          ...SITE,
        })
      ).status,
    ).toBe(200);
  });

  it('customer reviews the worker once, and rating and trust score update', async () => {
    const res = await post('/reviews', customer, {
      bookingId,
      rating: 5,
      tags: ['punctual'],
      comment: 'Fixed the leak quickly',
    });
    expect(res.status).toBe(201);
    expect(res.body.review.rating).toBe(5);

    const again = await post('/reviews', customer, { bookingId, rating: 4 });
    expect(again.status).toBe(409);

    const profile: any = await WorkerProfile.findOne({ userId: worker.id });
    expect(profile.ratingCount).toBe(1);
    expect(profile.ratingAvg).toBe(5);
    expect(profile.trustScore).toBeGreaterThan(0);
  });

  it('a stranger cannot review this booking, and ratings must be 1 to 5', async () => {
    const stranger = await post('/reviews', customer2, { bookingId, rating: 5 });
    expect(stranger.status).toBe(403);
    const bad = await post('/reviews', worker, { bookingId, rating: 6 });
    expect(bad.status).toBe(400);
  });

  it('the worker can review the customer too', async () => {
    const res = await post('/reviews', worker, { bookingId, rating: 4, tags: ['polite'] });
    expect(res.status).toBe(201);
  });

  it('lists the worker reviews with a summary', async () => {
    const res = await request(app).get(`/reviews/user/${worker.id}`).set(bearer(customer));
    expect(res.status).toBe(200);
    expect(res.body.summary.count).toBe(1);
    expect(res.body.summary.average).toBe(5);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].fromName).toBe('Review Customer');
  });

  it('chat works over HTTP and only for the two parties', async () => {
    const sent = await post(`/chat/${bookingId}/messages`, customer, { text: 'Hello, I am at the gate' });
    expect(sent.status).toBe(201);

    const history = await request(app).get(`/chat/${bookingId}/messages`).set(bearer(worker));
    expect(history.status).toBe(200);
    expect(history.body.items).toHaveLength(1);
    expect(history.body.items[0].text).toContain('gate');

    const stranger = await request(app).get(`/chat/${bookingId}/messages`).set(bearer(customer2));
    expect(stranger.status).toBe(403);
  });

  it('notifications can be listed and marked read', async () => {
    const list = await request(app).get('/notifications').set(bearer(worker));
    expect(list.status).toBe(200);
    expect(list.body.items.length).toBeGreaterThan(0);
    const before = list.body.unread;
    expect(before).toBeGreaterThan(0);

    const one = await post(`/notifications/${list.body.items[0].id}/read`, worker);
    expect(one.status).toBe(200);
    const count = await request(app).get('/notifications/unread-count').set(bearer(worker));
    expect(count.body.unread).toBe(before - 1);

    expect((await post('/notifications/read-all', worker)).status).toBe(200);
    const after = await request(app).get('/notifications/unread-count').set(bearer(worker));
    expect(after.body.unread).toBe(0);
  });

  it('after pay and release the worker earnings dashboard shows the payout', async () => {
    expect((await post(`/bookings/${bookingId}/pay`, customer)).status).toBe(200);
    expect((await post(`/bookings/${bookingId}/release`, customer)).status).toBe(200);

    const res = await request(app).get('/wallet/me').set(bearer(worker));
    expect(res.status).toBe(200);
    expect(res.body.demo).toBe(true);
    expect(res.body.balance).toBeCloseTo(workerPay);
    expect(res.body.earnings.today).toBeCloseTo(workerPay);
    expect(res.body.earnings.month).toBeCloseTo(workerPay);
    expect(res.body.pendingPayout).toBe(0);
    expect(res.body.transactions).toHaveLength(1);
    expect(res.body.series).toHaveLength(7);
    expect(res.body.series[6].amount).toBeCloseTo(workerPay);
  });
});