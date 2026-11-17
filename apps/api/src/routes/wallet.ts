import { Types } from 'mongoose';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { Booking } from '../models/Booking.js';
import { User } from '../models/User.js';
import { WalletTransaction } from '../models/WalletTransaction.js';
import { WorkerProfile } from '../models/WorkerProfile.js';
import { createRouter } from '../utils/router.js';

export const walletRouter = createRouter();

const DAY_MS = 24 * 60 * 60 * 1000;
const dayKey = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

// Worker earnings dashboard: balance, today / week / month, 7-day chart, recent payouts.
// All money here is demo money (Mock UPI), so the response carries demo: true.
walletRouter.get('/me', requireAuth, requireRole('worker'), async (req, res) => {
  const uid = req.userId!;
  const now = Date.now();
  const since = new Date(now - 30 * DAY_MS);

  const [user, profile, txns, pending] = await Promise.all([
    User.findById(uid),
    WorkerProfile.findOne({ userId: uid }),
    WalletTransaction.aggregate([
      { $match: { userId: new Types.ObjectId(uid) } },
      // Use the ObjectId's own timestamp so this works whether or not the schema has timestamps.
      { $addFields: { at: { $toDate: '$_id' } } },
      { $match: { at: { $gte: since } } },
      { $sort: { _id: -1 } },
    ]),
    Booking.find({ workerId: uid, status: 'completed', 'payment.status': 'pending_release' }).select(
      'workerPay',
    ),
  ]);

  const sumSince = (ms: number) =>
    txns
      .filter((t: any) => (t.at as Date).getTime() >= now - ms)
      .reduce((a: number, t: any) => a + (t.amount ?? 0), 0);

  const todayKey = dayKey(new Date(now));
  const today = txns
    .filter((t: any) => dayKey(t.at as Date) === todayKey)
    .reduce((a: number, t: any) => a + (t.amount ?? 0), 0);

  const series = [];
  for (let i = 6; i >= 0; i--) {
    const key = dayKey(new Date(now - i * DAY_MS));
    series.push({
      date: key,
      amount: txns
        .filter((t: any) => dayKey(t.at as Date) === key)
        .reduce((a: number, t: any) => a + (t.amount ?? 0), 0),
    });
  }

  res.json({
    demo: true,
    balance: (user as any)?.walletBalance ?? 0,
    earningsTotal: (profile as any)?.earningsTotal ?? 0,
    jobsCompleted: (profile as any)?.jobsCompleted ?? 0,
    trustScore: (profile as any)?.trustScore ?? null,
    pendingPayout: pending.reduce((a, b) => a + (b.workerPay ?? 0), 0),
    earnings: { today, week: sumSince(7 * DAY_MS), month: sumSince(30 * DAY_MS) },
    series,
    transactions: txns.slice(0, 20).map((t: any) => ({
      id: String(t._id),
      bookingId: t.bookingId ? String(t.bookingId) : null,
      type: t.type,
      amount: t.amount,
      note: t.note,
      at: t.at,
    })),
  });
});