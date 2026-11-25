import {
  CITY_CONFIG,
  TRADES,
  assertBookingTransition,
  canTransition,
  estimatePrice,
  etaMinutes,
  haversineKm,
  requiresCompletionOtp,
  requiresStartOtp,
  type BookingActor,
  type BookingStatus,
  type TradeKey,
  type UrgencyLevel,
} from '@kaamsetu/shared';
import { Types } from 'mongoose';
import { config } from '../config.js';
import { AppError } from '../errors.js';
import { Booking } from '../models/Booking.js';
import { User } from '../models/User.js';
import { WalletTransaction } from '../models/WalletTransaction.js';
import { WorkerProfile } from '../models/WorkerProfile.js';
import { createPaymentProvider } from '../providers/payment.js';
import { emitBooking, emitUser } from '../realtime/io.js';
import { fourDigitOtp } from '../utils/crypto.js';
import { stopEmergencyExpansion } from './emergency.js';
import { checkGpsMismatch, checkRapidCancels } from './fraud.js';
import { notify } from './notifications.js';
import { recomputeWorkerTrust } from './trust.js';

const payments = createPaymentProvider();

export function publicBooking(booking: any, viewerId: string, role: string | null | undefined) {
  const customerId = String(booking.customerId);
  const workerId = booking.workerId ? String(booking.workerId) : null;
  const isParty = viewerId === customerId || viewerId === workerId || role === 'admin';
  const showOtp = viewerId === customerId || role === 'admin';
  const showPhone = isParty && booking.status !== 'requested';
  return {
    ...sanitize(booking),
    startOtp: showOtp ? booking.startOtp : undefined,
    completionOtp: showOtp ? booking.completionOtp : undefined,
    showPhone,
    demoPayment: payments.demo,
  };
}

function sanitize(booking: any) {
  const obj = typeof booking.toObject === 'function' ? booking.toObject() : booking;
  return {
    id: String(obj._id),
    customerId: String(obj.customerId),
    workerId: obj.workerId ? String(obj.workerId) : null,
    trade: obj.trade,
    description: obj.description,
    photos: obj.photos,
    location: obj.location,
    address: obj.address,
    scheduledFor: obj.scheduledFor,
    isEmergency: obj.isEmergency,
    estimatedDurationHrs: obj.estimatedDurationHrs,
    priceEstimate: obj.priceEstimate,
    finalPrice: obj.finalPrice,
    platformFee: obj.platformFee,
    workerPay: obj.workerPay,
    status: obj.status,
    statusTimeline: obj.statusTimeline,
    payment: obj.payment,
    cancelReason: obj.cancelReason,
    urgency: obj.urgency,
    broadcastRadiusKm: obj.broadcastRadiusKm,
    acceptDeadlineAt: obj.acceptDeadlineAt,
    notifiedWorkerIds: (obj.notifiedWorkerIds ?? []).map(String),
    etaMinutes: obj.etaMinutes,
    invoiceNumber: obj.invoiceNumber,
    bulkRequirementId: obj.bulkRequirementId ? String(obj.bulkRequirementId) : undefined,
    fallbackNotifiedAt: obj.fallbackNotifiedAt,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

export async function priceForBooking(input: {
  trade: TradeKey;
  workerId?: string;
  estimatedDurationHrs: number;
  urgency: UrgencyLevel;
  isNight?: boolean;
}) {
  const trade = TRADES[input.trade];
  let workerHourlyRate: number | undefined;
  if (input.workerId) {
    const profile = await WorkerProfile.findOne({ userId: input.workerId });
    workerHourlyRate = profile?.skills.find((s) => s.trade === input.trade)?.hourlyRate;
  }
  return estimatePrice({
    baseRateHour: trade.baseRateHour,
    baseRateDay: trade.baseRateDay,
    minRate: trade.minRate,
    maxRate: trade.maxRate,
    workerHourlyRate,
    estimatedDurationHrs: input.estimatedDurationHrs,
    urgency: input.urgency,
    isNight: Boolean(input.isNight),
    platformFeeRate: config.platformFeeRate,
  });
}

export async function createDirectBooking(input: {
  customerId: string;
  workerId: string;
  trade: TradeKey;
  description?: string;
  photos?: string[];
  lng: number;
  lat: number;
  address?: string;
  scheduledFor?: Date;
  estimatedDurationHrs: number;
  urgency: UrgencyLevel;
  isNight?: boolean;
  bulkRequirementId?: string;
}) {
  const worker = await WorkerProfile.findOne({ userId: input.workerId });
  if (!worker) throw new AppError(404, 'Worker not found', 'NOT_FOUND');
  const breakdown = await priceForBooking(input);
  const now = input.scheduledFor ?? new Date();
  const startOtp = fourDigitOtp();
  const completionOtp = fourDigitOtp();
  const distanceKm = haversineKm(worker.location.coordinates as [number, number], [
    input.lng,
    input.lat,
  ]);
  const booking = await Booking.create({
    customerId: input.customerId,
    workerId: input.workerId,
    trade: input.trade,
    description: input.description,
    photos: input.photos ?? [],
    location: { type: 'Point', coordinates: [input.lng, input.lat] },
    address: input.address,
    scheduledFor: now,
    isEmergency: input.urgency === 'emergency',
    estimatedDurationHrs: input.estimatedDurationHrs,
    priceEstimate: {
      min: breakdown.min,
      max: breakdown.max,
      urgencyMultiplier: breakdown.urgencyMultiplier,
    },
    finalPrice: breakdown.total,
    platformFee: breakdown.platformFee,
    workerPay: breakdown.workerPay + breakdown.urgencySurcharge,
    status: 'requested',
    statusTimeline: [{ status: 'requested', at: new Date(), note: 'created' }],
    payment: { provider: payments.name, status: 'unpaid' },
    startOtp,
    completionOtp,
    urgency: input.urgency,
    acceptDeadlineAt: new Date(Date.now() + 45 * 1000),
    notifiedWorkerIds: [worker.userId],
    etaMinutes: etaMinutes(distanceKm),
    invoiceNumber: `KS-INV-${Date.now().toString(36).toUpperCase()}`,
    bulkRequirementId: input.bulkRequirementId,
  });

  const payload = {
    bookingId: String(booking._id),
    trade: booking.trade,
    distanceKm: Math.round(distanceKm * 100) / 100,
    price: booking.finalPrice,
    acceptDeadlineAt: booking.acceptDeadlineAt,
    countdownSeconds: 45,
    isEmergency: booking.isEmergency,
  };
  emitUser(input.workerId, 'job:request', payload);
  await notify(
    input.workerId,
    'job_request',
    'New job request',
    `${booking.trade} nearby · ₹${booking.finalPrice}`,
    { bookingId: String(booking._id) },
  );
  return booking;
}

export async function createEmergencyBooking(input: {
  customerId: string;
  trade: TradeKey;
  description?: string;
  photos?: string[];
  voiceNoteUrl?: string;
  lng: number;
  lat: number;
  address?: string;
  estimatedDurationHrs: number;
}) {
  const breakdown = await priceForBooking({
    ...input,
    urgency: 'emergency',
  });
  const booking = await Booking.create({
    customerId: input.customerId,
    trade: input.trade,
    description: input.description,
    photos: input.photos ?? [],
    voiceNoteUrl: input.voiceNoteUrl,
    location: { type: 'Point', coordinates: [input.lng, input.lat] },
    address: input.address,
    scheduledFor: new Date(),
    isEmergency: true,
    estimatedDurationHrs: input.estimatedDurationHrs,
    priceEstimate: {
      min: breakdown.min,
      max: breakdown.max,
      urgencyMultiplier: breakdown.urgencyMultiplier,
    },
    finalPrice: breakdown.total,
    platformFee: breakdown.platformFee,
    workerPay: breakdown.workerPay + breakdown.urgencySurcharge,
    status: 'requested',
    statusTimeline: [{ status: 'requested', at: new Date(), note: 'emergency' }],
    payment: { provider: payments.name, status: 'unpaid' },
    startOtp: fourDigitOtp(),
    completionOtp: fourDigitOtp(),
    urgency: 'emergency',
    broadcastRadiusKm: CITY_CONFIG.emergencyRadiiKm[0],
    broadcastExpiresAt: new Date(Date.now() + CITY_CONFIG.emergencyTimeoutSeconds * 1000),
    invoiceNumber: `KS-INV-${Date.now().toString(36).toUpperCase()}`,
  });
  return booking;
}

async function loadBooking(id: string) {
  const booking = await Booking.findById(id);
  if (!booking) throw new AppError(404, 'Booking not found', 'NOT_FOUND');
  return booking;
}

function actorFor(booking: any, userId: string, role?: string | null): BookingActor {
  if (role === 'admin') return 'admin';
  if (String(booking.customerId) === userId) return 'customer';
  if (booking.workerId && String(booking.workerId) === userId) return 'worker';
  return 'worker';
}

function pushStatus(booking: any, status: BookingStatus, note?: string) {
  booking.status = status;
  booking.statusTimeline.push({ status, at: new Date(), note });
}

function emitStatus(booking: any) {
  const payload = {
    bookingId: String(booking._id),
    status: booking.status,
    workerId: booking.workerId ? String(booking.workerId) : null,
    etaMinutes: booking.etaMinutes,
    payment: booking.payment,
  };
  emitBooking(String(booking._id), 'job:status', payload);
  emitUser(String(booking.customerId), 'job:status', payload);
  if (booking.workerId) emitUser(String(booking.workerId), 'job:status', payload);
}

export async function acceptBooking(bookingId: string, workerId: string) {
  const existing = await loadBooking(bookingId);
  if (existing.status !== 'requested') {
    throw new AppError(409, 'Booking already taken', 'ALREADY_ACCEPTED');
  }
  if (existing.acceptDeadlineAt && existing.acceptDeadlineAt.getTime() < Date.now()) {
    throw new AppError(410, 'Accept window expired', 'ACCEPT_EXPIRED');
  }
  const notified = (existing.notifiedWorkerIds ?? []).map(String);
  if (notified.length && !notified.includes(workerId) && String(existing.workerId) !== workerId) {
    throw new AppError(403, 'You were not offered this job', 'FORBIDDEN');
  }

  const filter: Record<string, unknown> = { _id: bookingId, status: 'requested' };
  if (existing.workerId) {
    filter.workerId = new Types.ObjectId(workerId);
  } else {
    filter.$or = [{ workerId: null }, { workerId: { $exists: false } }];
  }

  const booking = await Booking.findOneAndUpdate(
    filter,
    {
      $set: {
        workerId,
        status: 'accepted',
        acceptDeadlineAt: undefined,
      },
      $push: { statusTimeline: { status: 'accepted', at: new Date(), note: 'atomic-accept' } },
    },
    { new: true },
  );
  if (!booking) throw new AppError(409, 'Booking already taken', 'ALREADY_ACCEPTED');

  stopEmergencyExpansion(bookingId);
  await WorkerProfile.updateOne({ userId: workerId }, { $inc: { jobsAccepted: 1 } });
  const worker = await WorkerProfile.findOne({ userId: workerId });
  if (worker?.location?.coordinates) {
    booking.etaMinutes = etaMinutes(
      haversineKm(worker.location.coordinates as [number, number], booking.location.coordinates as [
        number,
        number,
      ]),
    );
    await booking.save();
  }
  emitStatus(booking);
  await notify(
    String(booking.customerId),
    'job_accepted',
    'Worker on the way soon',
    'A worker accepted your booking.',
    { bookingId },
  );
  return booking;
}

export async function declineBooking(bookingId: string, workerId: string) {
  const booking = await loadBooking(bookingId);
  if (booking.workerId && String(booking.workerId) === workerId) {
    assertBookingTransition(booking.status as BookingStatus, 'cancelled', 'worker');
    pushStatus(booking, 'cancelled', 'worker_declined');
    booking.cancelReason = 'worker_declined';
    await booking.save();
    await WorkerProfile.updateOne({ userId: workerId }, { $inc: { jobsCancelled: 1 } });
    await checkRapidCancels(workerId);
    emitStatus(booking);
    return booking;
  }
  booking.notifiedWorkerIds = (booking.notifiedWorkerIds ?? []).filter(
    (id: Types.ObjectId) => String(id) !== workerId,
  );
  await booking.save();
  return booking;
}

export async function transitionBooking(input: {
  bookingId: string;
  userId: string;
  role?: string | null;
  to: BookingStatus;
  otp?: string;
  lng?: number;
  lat?: number;
  reason?: string;
  actorOverride?: BookingActor;
}) {
  const booking = await loadBooking(input.bookingId);
  const actor = input.actorOverride ?? actorFor(booking, input.userId, input.role);
  const from = booking.status as BookingStatus;
  if (!canTransition(from, input.to, actor)) {
    throw new AppError(400, `Cannot move booking from ${from} to ${input.to}`, 'INVALID_TRANSITION');
  }
  if (requiresStartOtp(from, input.to)) {
    if (!input.otp || input.otp !== booking.startOtp) {
      throw new AppError(400, 'Invalid start OTP', 'INVALID_OTP');
    }
    if (input.lng != null && input.lat != null) {
      const km = await checkGpsMismatch(
        booking.location.coordinates as [number, number],
        [input.lng, input.lat],
        input.userId,
        input.bookingId,
      );
      if (km > 5) throw new AppError(400, 'GPS too far from job site', 'GPS_MISMATCH');
      booking.startGps = [input.lng, input.lat];
    }
  }
  if (requiresCompletionOtp(from, input.to)) {
    if (!input.otp || input.otp !== booking.completionOtp) {
      throw new AppError(400, 'Invalid completion OTP', 'INVALID_OTP');
    }
    if (input.lng != null && input.lat != null) {
      booking.endGps = [input.lng, input.lat];
    }
  }
  if (input.to === 'cancelled') {
    booking.cancelReason = input.reason ?? 'cancelled';
    if (booking.workerId) {
      await WorkerProfile.updateOne({ userId: booking.workerId }, { $inc: { jobsCancelled: 1 } });
    }
    await checkRapidCancels(input.userId);
  }
  if (input.to === 'disputed') {
    booking.cancelReason = input.reason ?? 'disputed';
  }
  if (input.to === 'on_the_way' && booking.workerId) {
    const worker = await WorkerProfile.findOne({ userId: booking.workerId });
    if (worker?.location?.coordinates) {
      booking.etaMinutes = etaMinutes(
        haversineKm(worker.location.coordinates as [number, number], booking.location.coordinates as [
          number,
          number,
        ]),
      );
    }
  }
  pushStatus(booking, input.to);
  await booking.save();

  if (input.to === 'completed' && booking.workerId) {
    await WorkerProfile.updateOne({ userId: booking.workerId }, { $inc: { jobsCompleted: 1 } });
    await recomputeWorkerTrust(String(booking.workerId));
    booking.payment = { ...booking.payment, status: 'pending_release' };
    await booking.save();
  }

  emitStatus(booking);
  await notify(
    String(booking.customerId),
    'job_status',
    `Job ${input.to.replace('_', ' ')}`,
    `Booking is now ${input.to}.`,
    { bookingId: input.bookingId, status: input.to },
  );
  return booking;
}

export async function payBooking(bookingId: string, customerId: string) {
  const booking = await loadBooking(bookingId);
  if (String(booking.customerId) !== customerId) {
    throw new AppError(403, 'Forbidden', 'FORBIDDEN');
  }
  if (booking.status !== 'completed') {
    throw new AppError(400, 'Pay after the job is completed', 'INVALID_TRANSITION');
  }
  const amount = booking.finalPrice ?? 0;
  const order = await payments.createOrder(amount, String(booking._id));
  const captured = await payments.capture(order.orderId);
  if (captured.status !== 'captured') {
    throw new AppError(402, 'Payment failed', 'PAYMENT_FAILED');
  }
  booking.payment = {
    provider: order.provider,
    orderId: order.orderId,
    status: 'pending_release',
    method: 'upi',
    paidAt: new Date(),
  };
  await booking.save();
  emitStatus(booking);
  return { booking, order, demo: order.demo };
}

export async function releasePayment(bookingId: string, customerId: string) {
  const booking = await loadBooking(bookingId);
  if (String(booking.customerId) !== customerId) {
    throw new AppError(403, 'Forbidden', 'FORBIDDEN');
  }
  if (booking.status !== 'completed') {
    throw new AppError(400, 'Release after completion', 'INVALID_TRANSITION');
  }
  if (booking.payment?.status !== 'pending_release') {
    throw new AppError(400, 'Payment is not pending release', 'INVALID_PAYMENT');
  }
  const workerPay = booking.workerPay ?? (booking.finalPrice ?? 0) - (booking.platformFee ?? 0);
  if (booking.workerId) {
    await payments.payout({
      workerUserId: String(booking.workerId),
      amountInr: workerPay,
      bookingId,
    });
    await User.updateOne({ _id: booking.workerId }, { $inc: { walletBalance: workerPay } });
    await WorkerProfile.updateOne(
      { userId: booking.workerId },
      { $inc: { earningsTotal: workerPay } },
    );
    await WalletTransaction.create({
      userId: booking.workerId,
      bookingId: booking._id,
      type: 'job_payout',
      amount: workerPay,
      note: 'Job payout (demo wallet)',
    });
    await recomputeWorkerTrust(String(booking.workerId));
  }
  assertBookingTransition('completed', 'paid', 'customer');
  pushStatus(booking, 'paid', 'customer-confirmed-release');
  booking.payment = { ...booking.payment, status: 'released' };
  booking.paymentReleasedAt = new Date();
  await booking.save();
  emitStatus(booking);
  if (booking.workerId) {
    await notify(
      String(booking.workerId),
      'payout',
      'Payment released',
      `₹${workerPay} added to your wallet (demo).`,
      { bookingId },
    );
  }
  return booking;
}
