import type { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { AuditLog } from '../../models/AuditLog.js';
import { pageFields, skipLimit } from './query.js';

const listQuery = z.object({
  query: z.object({
    ...pageFields,
    adminId: z.string().optional(),
    action: z.string().min(1).optional(),
    targetType: z.string().min(1).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  }),
});

export function registerAuditRoutes(router: Router) {
  router.get('/audit-logs', validate(listQuery), async (req, res) => {
    const q = req.query as unknown as z.infer<typeof listQuery>['query'];
    const filter: Record<string, unknown> = {};
    if (q.adminId) filter.adminId = q.adminId;
    if (q.action) filter.action = q.action;
    if (q.targetType) filter.targetType = q.targetType;
    if (q.from || q.to) {
      const createdAt: Record<string, Date> = {};
      if (q.from) createdAt.$gte = q.from;
      if (q.to) createdAt.$lte = q.to;
      filter.createdAt = createdAt;
    }
    const [items, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skipLimit(q.page, q.limit).skip)
        .limit(q.limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);
    res.json({ items, total, page: q.page, limit: q.limit });
  });
}
