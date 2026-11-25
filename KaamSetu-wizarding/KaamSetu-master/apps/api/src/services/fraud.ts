import { Types } from 'mongoose';
import { haversineKm } from '@kaamsetu/shared';
import { Booking } from '../models/Booking.js';
import { Report } from '../models/Report.js';
import { Review } from '../models/Review.js';
import { User } from '../models/User.js';
import { WorkerProfile } from '../models/WorkerProfile.js';
import { recomputeWorkerTrust } from './trust.js';

const PHONE_RE = /(?:\+91[\s-]?)?[6-9]\d{9}/;
const CONTACT_KEYWORDS = /\b(whatsapp|paytm|gpay|phonepe|call me|outside app)\b/i;

export async function flagFraud(input: {
  raisedBy: string;
  reason: string;
  bookingId?: string;
  targetUserId?: string;
}) {
  const report = await Report.create({
    bookingId: input.bookingId,
    raisedBy: input.raisedBy,
    reason: input.reason,
    kind: 'fraud_flag',
    status: 'open',
  });
  if (input.targetUserId) {
    await WorkerProfile.updateOne({ userId: input.targetUserId }, { $inc: { fraudFlags: 1 } });
    await recomputeWorkerTrust(input.targetUserId);
  }
  return report;
}

export async function checkRapidBookings(customerId: string) {
  const since = new Date(Date.now() - 60 * 1000);
  const count = await Booking.countDocuments({
    customerId,
    createdAt: { $gte: since },
  });
  if (count >= 3) {
    await flagFraud({
      raisedBy: customerId,
      reason: 'too-many-bookings-in-a-minute',
    });
    return true;
  }
  return false;
}

export async function checkRapidCancels(userId: string) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const count = await Booking.countDocuments({
    $or: [{ customerId: userId }, { workerId: userId }],
    status: 'cancelled',
    updatedAt: { $gte: since },
  });
  if (count >= 3) {
    await flagFraud({
      raisedBy: userId,
      reason: 'rapid-cancel-pattern',
      targetUserId: userId,
    });
    return true;
  }
  return false;
}

export async function checkDuplicateDevice(userId: string, deviceId?: string) {
  if (!deviceId) return false;
  const others = await User.countDocuments({
    _id: { $ne: userId },
    deviceIds: deviceId,
  });
  if (others > 0) {
    await flagFraud({
      raisedBy: userId,
      reason: 'duplicate-device',
    });
    return true;
  }
  return false;
}

export async function checkReviewBombing(fromUserId: string, toUserId: string) {
  const since = new Date(Date.now() - 10 * 60 * 1000);
  const recent = await Review.countDocuments({
    fromUserId,
    createdAt: { $gte: since },
  });
  const ones = await Review.countDocuments({ fromUserId, toUserId, rating: 1 });
  if (recent >= 5 || ones >= 4) {
    await flagFraud({
      raisedBy: fromUserId,
      reason: 'review-bombing',
      targetUserId: toUserId,
    });
    return true;
  }
  return false;
}

export async function checkGpsMismatch(
  bookingLocation: [number, number],
  gps: [number, number],
  userId: string,
  bookingId: string,
) {
  const km = haversineKm(bookingLocation, gps);
  if (km > 1) {
    await flagFraud({
      raisedBy: userId,
      reason: `gps-mismatch-${km.toFixed(2)}km`,
      bookingId,
      targetUserId: userId,
    });
  }
  return km;
}

export function sanitizeChatText(text: string): { text: string; flagged: boolean } {
  const flagged = PHONE_RE.test(text) || CONTACT_KEYWORDS.test(text);
  const redacted = text.replace(PHONE_RE, '[hidden]');
  return { text: redacted, flagged };
}

export async function maybeFlagChat(senderId: string, bookingId: string, flagged: boolean) {
  if (!flagged) return;
  await flagFraud({
    raisedBy: senderId,
    reason: 'off-platform-contact-in-chat',
    bookingId,
  });
}

export function asObjectId(id: string) {
  return new Types.ObjectId(id);
}
