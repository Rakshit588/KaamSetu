import { z } from 'zod';
import { AppError } from '../errors.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { Booking } from '../models/Booking.js';
import { Message } from '../models/Message.js';
import { emitBooking, emitUser } from '../realtime/io.js';
import { persistChatMessage } from '../services/chat.js';
import { createRouter } from '../utils/router.js';

export const chatRouter = createRouter();

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const params = z.object({ params: z.object({ bookingId: objectId }) });

async function loadBookingForParty(id: string, userId: string) {
  const booking = await Booking.findById(id);
  if (!booking) throw new AppError(404, 'Booking not found', 'NOT_FOUND');
  const isParty =
    String(booking.customerId) === userId ||
    (booking.workerId != null && String(booking.workerId) === userId);
  if (!isParty) throw new AppError(403, 'Forbidden', 'FORBIDDEN');
  return booking;
}

// Chat history for a booking. Only the customer and the worker of that booking can read it.
chatRouter.get(
  '/:bookingId/messages',
  requireAuth,
  requireRole('customer', 'worker'),
  validate(params),
  async (req, res) => {
    const uid = req.userId!;
    const booking = await loadBookingForParty(req.params.bookingId, uid);
    const items = await Message.find({ bookingId: booking._id }).sort({ _id: 1 }).limit(200);
    await Message.updateMany(
      { bookingId: booking._id, senderId: { $ne: uid }, readAt: null },
      { $set: { readAt: new Date() } },
    );
    res.json({
      items: items.map((m: any) => ({
        id: String(m._id),
        bookingId: String(m.bookingId),
        senderId: String(m.senderId),
        text: m.text,
        readAt: m.readAt ?? null,
        createdAt: m.createdAt ?? m._id.getTimestamp(),
      })),
    });
  },
);

// HTTP fallback for sending a message (the Socket.io 'chat:send' event does the same).
chatRouter.post(
  '/:bookingId/messages',
  requireAuth,
  requireRole('customer', 'worker'),
  validate(
    z.object({
      params: z.object({ bookingId: objectId }),
      body: z.object({ text: z.string().trim().min(1).max(500) }),
    }),
  ),
  async (req, res) => {
    const uid = req.userId!;
    const booking = await loadBookingForParty(req.params.bookingId, uid);
    const message = await persistChatMessage({
      bookingId: String(booking._id),
      senderId: uid,
      text: req.body.text,
    });
    const customerId = String(booking.customerId);
    const workerId = booking.workerId ? String(booking.workerId) : '';
    const other = uid === customerId ? workerId : customerId;
    emitBooking(String(booking._id), 'chat:message', message);
    if (other) emitUser(other, 'chat:message', message);
    res.status(201).json({ message });
  },
);