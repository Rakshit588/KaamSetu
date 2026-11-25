import request from 'supertest';
import { expect } from 'vitest';
import type { Express } from 'express';
import { signAccessToken } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { WorkerProfile } from '../models/WorkerProfile.js';
import { digitalWorkerId } from '../utils/crypto.js';

export async function userToken(
  phone: string,
  role: 'customer' | 'worker' | 'admin',
  name?: string,
) {
  const user = await User.create({
    phone,
    name: name ?? role,
    role,
    status: 'active',
  });
  if (role === 'worker') {
    await WorkerProfile.create({
      userId: user._id,
      digitalId: digitalWorkerId(),
      verification: { phoneVerified: true, status: 'none' },
      skills: [],
    });
  }
  return {
    user,
    token: signAccessToken(String(user._id), role),
  };
}

export async function expectStaffOnly(
  app: Express,
  method: 'get' | 'post',
  path: string,
  customerToken: string,
  workerToken: string,
) {
  const open = await request(app)[method](path);
  expect(open.status).toBe(401);
  const customer = await request(app)[method](path).set('Authorization', `Bearer ${customerToken}`);
  expect(customer.status).toBe(403);
  const worker = await request(app)[method](path).set('Authorization', `Bearer ${workerToken}`);
  expect(worker.status).toBe(403);
}
