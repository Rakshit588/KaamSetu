import { z } from 'zod';
import { AppError } from '../errors.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { Notification } from '../models/Notification.js';
import { createRouter } from '../utils/router.js';

export const notificationsRouter = createRouter();

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

function shape(n: any) {
  return {
    id: String(n._id),
    type: n.type,
    title: n.title,
    body: n.body,
    data: n.data,
    readAt: n.readAt ?? null,
    createdAt: n.createdAt ?? n._id.getTimestamp(),
  };
}

notificationsRouter.get('/', requireAuth, async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const filter = { userId: req.userId };
  const [items, total, unread] = await Promise.all([
    Notification.find(filter)
      .sort({ _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, readAt: null }),
  ]);
  res.json({ page, limit, total, unread, items: items.map(shape) });
});

notificationsRouter.get('/unread-count', requireAuth, async (req, res) => {
  const unread = await Notification.countDocuments({ userId: req.userId, readAt: null });
  res.json({ unread });
});

notificationsRouter.post('/read-all', requireAuth, async (req, res) => {
  const result = await Notification.updateMany(
    { userId: req.userId, readAt: null },
    { $set: { readAt: new Date() } },
  );
  res.json({ ok: true, updated: result.modifiedCount });
});

notificationsRouter.post(
  '/:id/read',
  requireAuth,
  validate(z.object({ params: z.object({ id: objectId }) })),
  async (req, res) => {
    const result = await Notification.updateOne(
      { _id: req.params.id, userId: req.userId },
      { $set: { readAt: new Date() } },
    );
    if (result.matchedCount === 0) throw new AppError(404, 'Notification not found', 'NOT_FOUND');
    res.json({ ok: true });
  },
);