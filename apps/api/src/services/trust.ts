import { computeTrustScore } from '@kaamsetu/shared';
import { Review } from '../models/Review.js';
import { WorkerProfile } from '../models/WorkerProfile.js';

export async function recomputeWorkerTrust(userId: string) {
  const profile = await WorkerProfile.findOne({ userId });
  if (!profile) return null;
  const reviews = await Review.find({ toUserId: userId }).select('rating createdAt');
  const breakdown = computeTrustScore({
    reviews: reviews.map((r) => ({ rating: r.rating, createdAt: r.createdAt })),
    jobsCompleted: profile.jobsCompleted,
    jobsCancelled: profile.jobsCancelled,
    jobsAccepted: profile.jobsAccepted,
    phoneVerified: profile.verification?.phoneVerified ?? false,
    verificationStatus: profile.verification?.status ?? 'none',
    responseRate: profile.responseRate,
    avgResponseMinutes: profile.avgResponseMinutes,
    onTimeRate: profile.onTimeRate,
    upheldDisputes: profile.upheldDisputes,
    fraudFlags: profile.fraudFlags,
  });
  profile.trustScore = breakdown.total;
  profile.trustBreakdown = breakdown;
  const considered = profile.jobsCompleted + profile.jobsCancelled;
  profile.completionRate = considered === 0 ? 0 : profile.jobsCompleted / considered;
  await profile.save();
  return breakdown;
}
