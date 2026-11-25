import {
  CITY_CONFIG,
  etaMinutes,
  haversineKm,
  nextEmergencyRadiusKm,
  type TradeKey,
} from '@kaamsetu/shared';
import { Types } from 'mongoose';
import { config } from '../config.js';
import { Booking } from '../models/Booking.js';
import { WorkerProfile } from '../models/WorkerProfile.js';
import { emitUser } from '../realtime/io.js';
import { notify } from './notifications.js';

const timers = new Map<string, NodeJS.Timeout[]>();

function clearTimers(bookingId: string) {
  const list = timers.get(bookingId) ?? [];
  for (const t of list) clearTimeout(t);
  timers.delete(bookingId);
}

export async function workersWithinRadius(input: {
  trade: TradeKey;
  lng: number;
  lat: number;
  radiusKm: number;
}) {
  return WorkerProfile.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [input.lng, input.lat] },
        distanceField: 'distanceMeters',
        maxDistance: input.radiusKm * 1000,
        spherical: true,
        query: {
          'skills.trade': input.trade,
          isAvailableNow: true,
        },
      },
    },
    { $limit: 40 },
  ]);
}

export async function notifyEmergencyWorkers(bookingId: string, radiusKm: number) {
  const booking = await Booking.findById(bookingId);
  if (!booking || booking.status !== 'requested' || !booking.isEmergency) return booking;
  const [lng, lat] = booking.location.coordinates as [number, number];
  const workers = await workersWithinRadius({
    trade: booking.trade as TradeKey,
    lng,
    lat,
    radiusKm,
  });
  const already = new Set((booking.notifiedWorkerIds ?? []).map((id) => String(id)));
  const fresh = workers.filter((w) => !already.has(String(w.userId)));
  const deadline = new Date(Date.now() + 45 * 1000);
  booking.broadcastRadiusKm = radiusKm;
  booking.acceptDeadlineAt = deadline;
  for (const w of fresh) {
    booking.notifiedWorkerIds.push(w.userId);
    const distanceKm = (w.distanceMeters as number) / 1000;
    const payload = {
      bookingId: String(booking._id),
      trade: booking.trade,
      distanceKm: Math.round(distanceKm * 100) / 100,
      price: booking.finalPrice,
      acceptDeadlineAt: deadline,
      countdownSeconds: 45,
      isEmergency: true,
    };
    emitUser(String(w.userId), 'job:request', payload);
    await notify(
      String(w.userId),
      'job_request',
      'Emergency job nearby',
      `${booking.trade} · ${payload.distanceKm} km · ₹${booking.finalPrice}`,
      { bookingId: String(booking._id) },
    );
  }
  await booking.save();
  return booking;
}

export async function expandEmergencyBroadcast(bookingId: string) {
  const booking = await Booking.findById(bookingId);
  if (!booking || booking.status !== 'requested' || !booking.isEmergency) return null;
  const next = nextEmergencyRadiusKm(booking.broadcastRadiusKm ?? 0);
  if (!next) return booking;
  return notifyEmergencyWorkers(bookingId, next);
}

export async function expireEmergencyBroadcast(bookingId: string) {
  const booking = await Booking.findById(bookingId);
  if (!booking || booking.status !== 'requested' || !booking.isEmergency) return null;
  const [lng, lat] = booking.location.coordinates as [number, number];
  const nearest = await workersWithinRadius({
    trade: booking.trade as TradeKey,
    lng,
    lat,
    radiusKm: 15,
  });
  const top = nearest.slice(0, 10);
  for (const w of top) {
    await notify(
      String(w.userId),
      'job_request_fallback',
      'Still looking for a worker',
      'Emergency booking has no accept yet. You are among the nearest 10.',
      { bookingId: String(booking._id) },
    );
  }
  booking.fallbackNotifiedAt = new Date();
  await booking.save();
  await notify(
    String(booking.customerId),
    'emergency_timeout',
    'No worker accepted yet',
    'Nobody accepted in 3 minutes. You can schedule for later or keep waiting.',
    { bookingId: String(booking._id), suggestion: 'schedule' },
  );
  emitUser(String(booking.customerId), 'job:status', {
    bookingId: String(booking._id),
    status: booking.status,
    timeout: true,
    suggestion: 'schedule',
  });
  clearTimers(bookingId);
  return booking;
}

export function scheduleEmergencyExpansion(bookingId: string) {
  if (config.env === 'test') return;
  clearTimers(bookingId);
  const expandMs = CITY_CONFIG.expandEverySeconds * 1000;
  const t1 = setTimeout(() => void expandEmergencyBroadcast(bookingId), expandMs);
  const t2 = setTimeout(() => void expandEmergencyBroadcast(bookingId), expandMs * 2);
  const t3 = setTimeout(
    () => void expireEmergencyBroadcast(bookingId),
    CITY_CONFIG.emergencyTimeoutSeconds * 1000,
  );
  timers.set(bookingId, [t1, t2, t3]);
}

export function stopEmergencyExpansion(bookingId: string) {
  clearTimers(bookingId);
}

export function etaFromPoints(from: [number, number], to: [number, number]) {
  return etaMinutes(haversineKm(from, to));
}

export function asId(id: string) {
  return new Types.ObjectId(id);
}
