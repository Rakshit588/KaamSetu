import type { Server as HttpServer } from 'node:http';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { Booking } from '../models/Booking.js';
import { WorkerProfile } from '../models/WorkerProfile.js';
import { persistChatMessage } from '../services/chat.js';

type AuthPayload = { sub: string; role?: string | null };

let io: Server | null = null;

export function getIo() {
  return io;
}

export function emitUser(userId: string, event: string, payload: unknown) {
  io?.to(`user:${userId}`).emit(event, payload);
}

export function emitBooking(bookingId: string, event: string, payload: unknown) {
  io?.to(`booking:${bookingId}`).emit(event, payload);
}

export function attachSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: { origin: config.corsOrigin, credentials: true },
  });

  io.use((socket, next) => {
    const raw =
      (socket.handshake.auth?.token as string | undefined) ||
      (socket.handshake.query?.token as string | undefined);
    if (!raw) return next(new Error('UNAUTHENTICATED'));
    try {
      const payload = jwt.verify(raw, config.jwtAccessSecret) as AuthPayload;
      socket.data.userId = payload.sub;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error('UNAUTHENTICATED'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);
    logger.debug({ userId }, 'socket connected');

    socket.on('booking:join', (bookingId: string) => {
      if (typeof bookingId === 'string') socket.join(`booking:${bookingId}`);
    });

    socket.on('availability:update', async (isAvailableNow: boolean) => {
      if (typeof isAvailableNow !== 'boolean') return;
      const profile = await WorkerProfile.findOneAndUpdate(
        { userId },
        { $set: { isAvailableNow } },
        { new: true },
      );
      if (profile) {
        io?.emit('availability:update', {
          workerId: userId,
          isAvailableNow: profile.isAvailableNow,
        });
      }
    });

    socket.on('chat:send', async (payload: { bookingId?: string; text?: string }) => {
      if (!payload?.bookingId || !payload.text) return;
      const booking = await Booking.findById(payload.bookingId);
      if (!booking) return;
      const customerId = String(booking.customerId);
      const workerId = booking.workerId ? String(booking.workerId) : '';
      if (userId !== customerId && userId !== workerId) return;
      const message = await persistChatMessage({
        bookingId: String(booking._id),
        senderId: userId,
        text: payload.text,
      });
      io?.to(`booking:${booking._id}`).emit('chat:message', message);
      const other = userId === customerId ? workerId : customerId;
      if (other) io?.to(`user:${other}`).emit('chat:message', message);
    });
  });

  return io;
}
