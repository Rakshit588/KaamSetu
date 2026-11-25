import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { AuditLog } from '../models/AuditLog.js';
import { recordAudit } from '../services/audit.js';
import { expectStaffOnly, userToken } from './adminHelpers.js';
import { setupTestDb, teardownTestDb } from './setup.js';

const app = createApp();

/**
 * Mongoose treats `createdAt` as immutable when `timestamps: true`, so a normal
 * `Model.updateOne` silently ignores it. The raw collection bypasses that rule,
 * which lets tests place entries at known dates.
 */
async function setCreatedAt(id: unknown, createdAt: Date) {
  await AuditLog.collection.updateOne({ _id: id as never }, { $set: { createdAt } });
}

describe('admin audit logs', () => {
  beforeAll(async () => {
    await setupTestDb();
  });
  afterAll(async () => {
    await teardownTestDb();
  });

  it('rejects missing, customer, and worker tokens', async () => {
    const customer = await userToken('+919000000101', 'customer');
    const worker = await userToken('+919100000101', 'worker');
    await expectStaffOnly(app, 'get', '/admin/audit-logs', customer.token, worker.token);
  });

  it('lists audit entries with filters and pagination', async () => {
    const admin = await userToken('+919999999901', 'admin', 'Auditor');
    const other = await userToken('+919999999902', 'admin', 'Other');
    const older = new Date('2024-01-02T00:00:00.000Z');
    const newer = new Date('2024-06-02T00:00:00.000Z');

    const suspend = await recordAudit({
      adminId: String(admin.user._id),
      action: 'user.suspend',
      targetType: 'user',
      targetId: 'u1',
      before: { status: 'active' },
      after: { status: 'suspended' },
    });
    await recordAudit({
      adminId: String(other.user._id),
      action: 'trade.update',
      targetType: 'trade',
      targetId: 'plumber',
      before: { minRate: 80 },
      after: { minRate: 90 },
    });
    const reactivate = await recordAudit({
      adminId: String(admin.user._id),
      action: 'user.reactivate',
      targetType: 'user',
      targetId: 'u1',
      before: { status: 'suspended' },
      after: { status: 'active' },
    });

    // user.suspend -> Jan 2024, user.reactivate -> Jun 2024, trade.update stays "now"
    await setCreatedAt(suspend._id, older);
    await setCreatedAt(reactivate._id, newer);

    const listed = await request(app)
      .get('/admin/audit-logs')
      .query({
        adminId: String(admin.user._id),
        action: 'user.suspend',
        targetType: 'user',
        limit: 10,
        page: 1,
      })
      .set('Authorization', `Bearer ${admin.token}`);
    expect(listed.status).toBe(200);
    expect(listed.body.total).toBe(1);
    expect(listed.body.page).toBe(1);
    expect(listed.body.limit).toBe(10);
    expect(listed.body.items).toHaveLength(1);
    expect(listed.body.items[0].summary.before.status).toBe('active');
    expect(listed.body.items[0].summary.after.status).toBe('suspended');
    expect(listed.body.items[0].adminId).toBeTruthy();
    expect(JSON.stringify(listed.body)).not.toMatch(/otpHash|refreshToken/i);

    const ranged = await request(app)
      .get('/admin/audit-logs')
      .query({ from: '2024-05-01T00:00:00.000Z', to: '2024-07-01T00:00:00.000Z' })
      .set('Authorization', `Bearer ${admin.token}`);
    expect(ranged.status).toBe(200);
    expect(ranged.body.total).toBe(1);
    expect(ranged.body.items[0].action).toBe('user.reactivate');

    const page2 = await request(app)
      .get('/admin/audit-logs')
      .query({ page: 2, limit: 1 })
      .set('Authorization', `Bearer ${admin.token}`);
    expect(page2.body.items).toHaveLength(1);
    expect(page2.body.total).toBe(3);

    const tooBig = await request(app)
      .get('/admin/audit-logs')
      .query({ limit: 500 })
      .set('Authorization', `Bearer ${admin.token}`);
    expect(tooBig.status).toBe(400);
  });
});