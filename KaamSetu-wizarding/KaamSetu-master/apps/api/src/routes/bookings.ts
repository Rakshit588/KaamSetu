import { z } from 'zod';
import {
  BOOKING_STATUSES,
  CITY_CONFIG,
  TRADE_KEYS,
  type BookingStatus,
  type TradeKey,
} from '@kaamsetu/shared';
import { AppError } from '../errors.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { Booking } from '../models/Booking.js';
import {
  acceptBooking,
  createDirectBooking,
  createEmergencyBooking,
  declineBooking,
  payBooking,
  publicBooking,
  releasePayment,
  transitionBooking,
} from '../services/booking.js';
import { notifyEmergencyWorkers, scheduleEmergencyExpansion } from '../services/emergency.js';
import { createRouter } from '../utils/router.js';

export const bookingsRouter = createRouter();

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const tradeSchema = z
  .string()
  .refine((v) => (TRADE_KEYS as readonly string[]).includes(v), 'Invalid trade');
const statusSchema = z
  .string()
  .refine((v) => (BOOKING_STATUSES as readonly string[]).includes(v), 'Invalid status')
  .refine((v) => v !== 'accepted' && v !== 'paid', 'Use the accept / release endpoints');

const place = {
  lng: z.number().min(-180).max(180),
  lat: z.number().min(-90).max(90),
  address: z.string().max(300).optional(),
};

const idParams = z.object({ params: z.object({ id: objectId }) });

/** Loads a booking and makes sure the caller is the customer, the worker, or an admin. */
async function loadForParty(id: string, userId: string, role?: string | null) {
  const booking = await Booking.findById(id);
  if (!booking) throw new AppError(404, 'Booking not found', 'NOT_FOUND');
  const isParty =
    String(booking.customerId) === userId ||
    (booking.workerId != null && String(booking.workerId) === userId);
  if (!isParty && role !== 'admin') throw new AppError(403, 'Forbidden', 'FORBIDDEN');
  return booking;
}

// ---------- Create ----------

bookingsRouter.post(
  '/',
  requireAuth,
  requireRole('customer'),
  validate(
    z.object({
      body: z.object({
        workerId: objectId,
        trade: tradeSchema,
        description: z.string().max(1000).optional(),
        photos: z.array(z.string().max(500)).max(5).optional(),
        ...place,
        scheduledFor: z.coerce.date().optional(),
        estimatedDurationHrs: z.number().min(0.5).max(72).default(2),
        urgency: z.enum(['normal', 'same_day']).default('normal'),
        isNight: z.boolean().optional(),
      }),
    }),
  ),
  async (req, res) => {
    const b = req.body;
    const booking = await createDirectBooking({
      customerId: req.userId!,
      workerId: b.workerId,
      trade: b.trade as TradeKey,
      description: b.description,
      photos: b.photos,
      lng: b.lng,
      lat: b.lat,
      address: b.address,
      scheduledFor: b.scheduledFor,
      estimatedDurationHrs: b.estimatedDurationHrs,
      urgency: b.urgency,
      isNight: b.isNight,
    });
    res.status(201).json({ booking: publicBooking(booking, req.userId!, req.userRole) });
  },
);

bookingsRouter.post(
  '/emergency',
  requireAuth,
  requireRole('customer'),
  validate(
    z.object({
      body: z.object({
        trade: tradeSchema,
        description: z.string().max(1000).optional(),
        photos: z.array(z.string().max(500)).max(5).optional(),
        voiceNoteUrl: z.string().max(500).optional(),
        ...place,
        estimatedDurationHrs: z.number().min(0.5).max(72).default(2),
      }),
    }),
  ),
  async (req, res) => {
    const b = req.body;
    const created = await createEmergencyBooking({
      customerId: req.userId!,
      trade: b.trade as TradeKey,
      description: b.description,
      photos: b.photos,
      voiceNoteUrl: b.voiceNoteUrl,
      lng: b.lng,
      lat: b.lat,
      address: b.address,
      estimatedDurationHrs: b.estimatedDurationHrs,
    });
    const id = String(created._id);
    // The service only creates the booking: start the broadcast and the radius expansion here.
    await notifyEmergencyWorkers(id, CITY_CONFIG.emergencyRadiiKm[0]);
    scheduleEmergencyExpansion(id);
    const fresh = (await Booking.findById(id)) ?? created;
    res.status(201).json({
      booking: publicBooking(fresh, req.userId!, req.userRole),
      notifiedCount: (fresh.notifiedWorkerIds ?? []).length,
    });
  },
);

// ---------- Lists (must stay above '/:id') ----------

bookingsRouter.get(
  '/mine',
  requireAuth,
  requireRole('customer', 'worker'),
  async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const filter =
      req.userRole === 'worker' ? { workerId: req.userId } : { customerId: req.userId };
    const [items, total] = await Promise.all([
      Booking.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Booking.countDocuments(filter),
    ]);
    res.json({
      page,
      limit,
      total,
      items: items.map((b) => publicBooking(b, req.userId!, req.userRole)),
    });
  },
);

bookingsRouter.get(
  '/requests/open',
  requireAuth,
  requireRole('worker'),
  async (req, res) => {
    const items = await Booking.find({
      status: 'requested',
      notifiedWorkerIds: req.userId,
      $or: [{ acceptDeadlineAt: { $gt: new Date() } }, { acceptDeadlineAt: null }],
    })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ items: items.map((b) => publicBooking(b, req.userId!, req.userRole)) });
  },
);

// ---------- Single booking ----------

bookingsRouter.get('/:id', requireAuth, validate(idParams), async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new AppError(404, 'Booking not found', 'NOT_FOUND');
  const uid = req.userId!;
  const allowed =
    req.userRole === 'admin' ||
    String(booking.customerId) === uid ||
    (booking.workerId != null && String(booking.workerId) === uid) ||
    (booking.status === 'requested' &&
      (booking.notifiedWorkerIds ?? []).some((w: unknown) => String(w) === uid));
  if (!allowed) throw new AppError(403, 'Forbidden', 'FORBIDDEN');
  res.json({ booking: publicBooking(booking, uid, req.userRole) });
});

// ---------- Worker actions ----------

bookingsRouter.post(
  '/:id/accept',
  requireAuth,
  requireRole('worker'),
  validate(idParams),
  async (req, res) => {
    const booking = await acceptBooking(req.params.id, req.userId!);
    res.json({ booking: publicBooking(booking, req.userId!, req.userRole) });
  },
);

bookingsRouter.post(
  '/:id/decline',
  requireAuth,
  requireRole('worker'),
  validate(idParams),
  async (req, res) => {
    await declineBooking(req.params.id, req.userId!);
    res.json({ ok: true });
  },
);

// ---------- Status changes (on_the_way, in_progress, completed, cancelled, disputed) ----------

bookingsRouter.post(
  '/:id/status',
  requireAuth,
  requireRole('customer', 'worker', 'admin'),
  validate(
    z.object({
      params: z.object({ id: objectId }),
      body: z.object({
        to: statusSchema,
        otp: z.string().length(4).optional(),
        lng: z.number().min(-180).max(180).optional(),
        lat: z.number().min(-90).max(90).optional(),
        reason: z.string().max(300).optional(),
      }),
    }),
  ),
  async (req, res) => {
    // Party check lives here because transitionBooking treats unknown users as "worker".
    await loadForParty(req.params.id, req.userId!, req.userRole);
    const booking = await transitionBooking({
      bookingId: req.params.id,
      userId: req.userId!,
      role: req.userRole,
      to: req.body.to as BookingStatus,
      otp: req.body.otp,
      lng: req.body.lng,
      lat: req.body.lat,
      reason: req.body.reason,
    });
    res.json({ booking: publicBooking(booking, req.userId!, req.userRole) });
  },
);

// ---------- Payment ----------

bookingsRouter.post(
  '/:id/pay',
  requireAuth,
  requireRole('customer'),
  validate(idParams),
  async (req, res) => {
    const { booking, order, demo } = await payBooking(req.params.id, req.userId!);
    res.json({ booking: publicBooking(booking, req.userId!, req.userRole), order, demo });
  },
);

bookingsRouter.post(
  '/:id/release',
  requireAuth,
  requireRole('customer'),
  validate(idParams),
  async (req, res) => {
    const booking = await releasePayment(req.params.id, req.userId!);
    res.json({ booking: publicBooking(booking, req.userId!, req.userRole) });
  },
);