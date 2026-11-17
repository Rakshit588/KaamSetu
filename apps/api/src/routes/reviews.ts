import { Types } from 'mongoose';
import { z } from 'zod';
import { REVIEW_TAGS } from '@kaamsetu/shared';
import { AppError } from '../errors.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { Booking } from '../models/Booking.js';
import { Review } from '../models/Review.js';
import { WorkerProfile } from '../models/WorkerProfile.js';
import '../models/User.js'; // registers the User model for populate()
import { notify } from '../services/notifications.js';
import { recomputeWorkerTrust } from '../services/trust.js';
import { createRouter } from '../utils/router.js';

export const reviewsRouter = createRouter();

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const tagSchema = z
  .string()
  .refine((v) => (REVIEW_TAGS as readonly string[]).includes(v), 'Invalid tag');

// Customer reviews the worker, worker reviews the customer, once per booking, after completion.
reviewsRouter.post(
  '/',
  requireAuth,
  requireRole('customer', 'worker'),
  validate(
    z.object({
      body: z.object({
        bookingId: objectId,
        rating: z.number().int().min(1).max(5),
        tags: z.array(tagSchema).max(5).optional(),
        comment: z.string().max(500).optional(),
      }),
    }),
  ),
  async (req, res) => {
    const { bookingId, rating, tags, comment } = req.body;
    const uid = req.userId!;
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new AppError(404, 'Booking not found', 'NOT_FOUND');

    const isCustomer = String(booking.customerId) === uid;
    const isWorker = booking.workerId != null && String(booking.workerId) === uid;
    if (!isCustomer && !isWorker) throw new AppError(403, 'Forbidden', 'FORBIDDEN');
    if (booking.status !== 'completed' && booking.status !== 'paid') {
      throw new AppError(400, 'You can review after the job is completed', 'NOT_COMPLETED');
    }
    const toUserId = isCustomer ? booking.workerId : booking.customerId;
    if (!toUserId) throw new AppError(400, 'Nobody to review on this booking', 'INVALID_REVIEW');

    const existing = await Review.findOne({ bookingId, fromUserId: uid });
    if (existing) throw new AppError(409, 'You already reviewed this booking', 'ALREADY_REVIEWED');

    let review;
    try {
      review = await Review.create({
        bookingId,
        fromUserId: uid,
        toUserId,
        rating,
        tags: tags ?? [],
        comment,
      });
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new AppError(409, 'You already reviewed this booking', 'ALREADY_REVIEWED');
      }
      throw err;
    }

    // Reviews of a worker feed the rating summary and the trust score.
    if (isCustomer) {
      const agg = await Review.aggregate([
        { $match: { toUserId: new Types.ObjectId(String(toUserId)) } },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]);
      if (agg[0]) {
        await WorkerProfile.updateOne(
          { userId: toUserId },
          { $set: { ratingAvg: Math.round(agg[0].avg * 10) / 10, ratingCount: agg[0].count } },
        );
      }
      await recomputeWorkerTrust(String(toUserId));
    }

    await notify(
      String(toUserId),
      'review_received',
      'You got a new review',
      `${rating} out of 5${comment ? `: ${comment.slice(0, 80)}` : ''}`,
      { bookingId: String(bookingId) },
    );

    res.status(201).json({
      review: {
        id: String(review._id),
        bookingId: String(bookingId),
        rating: review.rating,
        tags: review.tags,
        comment: review.comment,
        createdAt: (review as any).createdAt,
      },
    });
  },
);

// Public reviews of a user (used on worker profiles).
reviewsRouter.get(
  '/user/:userId',
  requireAuth,
  validate(z.object({ params: z.object({ userId: objectId }) })),
  async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const toUserId = new Types.ObjectId(req.params.userId);
    const [items, total, agg] = await Promise.all([
      Review.find({ toUserId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('fromUserId', 'name'),
      Review.countDocuments({ toUserId }),
      Review.aggregate([
        { $match: { toUserId } },
        { $group: { _id: null, avg: { $avg: '$rating' } } },
      ]),
    ]);
    res.json({
      page,
      limit,
      summary: { count: total, average: agg[0] ? Math.round(agg[0].avg * 10) / 10 : null },
      items: items.map((r) => ({
        id: String(r._id),
        rating: r.rating,
        tags: r.tags,
        comment: r.comment,
        createdAt: (r as any).createdAt,
        fromName: (r.fromUserId as any)?.name ?? null,
      })),
    });
  },
);