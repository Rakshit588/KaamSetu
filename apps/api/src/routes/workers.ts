import { z } from 'zod';
import { TRADE_KEYS } from '@kaamsetu/shared';
import { AppError } from '../errors.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { Review } from '../models/Review.js';
import { User } from '../models/User.js';
import { WorkerProfile } from '../models/WorkerProfile.js';
import { createKycProvider } from '../providers/kyc.js';
import { searchAndRankWorkers } from '../services/matching.js';
import { recomputeWorkerTrust } from '../services/trust.js';
import { maskIdNumber } from '../utils/crypto.js';
import { createRouter } from '../utils/router.js';

const kyc = createKycProvider();
export const workersRouter = createRouter();

workersRouter.get(
  '/search',
  validate(
    z.object({
      query: z.object({
        trade: z.enum(TRADE_KEYS),
        lng: z.coerce.number(),
        lat: z.coerce.number(),
        radiusKm: z.coerce.number().optional(),
        minRating: z.coerce.number().optional(),
        verifiedOnly: z
          .union([z.boolean(), z.enum(['true', 'false'])])
          .optional()
          .transform((v) => v === true || v === 'true'),
        availableNow: z
          .union([z.boolean(), z.enum(['true', 'false'])])
          .optional()
          .transform((v) => v === true || v === 'true'),
        maxHourlyRate: z.coerce.number().optional(),
        urgency: z.enum(['normal', 'same_day', 'emergency']).optional(),
        estimatedDurationHrs: z.coerce.number().optional(),
      }),
    }),
  ),
  async (req, res) => {
    const q = req.query as unknown as {
      trade: (typeof TRADE_KEYS)[number];
      lng: number;
      lat: number;
      radiusKm?: number;
      minRating?: number;
      verifiedOnly?: boolean;
      availableNow?: boolean;
      maxHourlyRate?: number;
      urgency?: 'normal' | 'same_day' | 'emergency';
      estimatedDurationHrs?: number;
    };
    const workers = await searchAndRankWorkers({
      ...q,
      customerId: req.userId,
    });
    res.json({ workers, algorithm: 'weighted_smart_match', demo: false });
  },
);

workersRouter.get('/me', requireAuth, requireRole('worker'), async (req, res) => {
  const profile = await WorkerProfile.findOne({ userId: req.userId });
  if (!profile) throw new AppError(404, 'Worker profile not found', 'NOT_FOUND');
  res.json({ profile });
});

workersRouter.put(
  '/me',
  requireAuth,
  requireRole('worker'),
  validate(
    z.object({
      body: z.object({
        bio: z.string().max(500).optional(),
        serviceRadiusKm: z.number().min(1).max(50).optional(),
        location: z
          .object({
            lng: z.number(),
            lat: z.number(),
          })
          .optional(),
        skills: z
          .array(
            z.object({
              trade: z.enum(TRADE_KEYS),
              experienceYears: z.number().min(0).max(50),
              hourlyRate: z.number().optional(),
              dailyRate: z.number().optional(),
            }),
          )
          .optional(),
        availabilitySchedule: z.record(z.any()).optional(),
      }),
    }),
  ),
  async (req, res) => {
    const profile = await WorkerProfile.findOne({ userId: req.userId });
    if (!profile) throw new AppError(404, 'Worker profile not found', 'NOT_FOUND');
    if (req.body.bio !== undefined) profile.bio = req.body.bio;
    if (req.body.serviceRadiusKm !== undefined) profile.serviceRadiusKm = req.body.serviceRadiusKm;
    if (req.body.location) {
      profile.location = {
        type: 'Point',
        coordinates: [req.body.location.lng, req.body.location.lat],
      };
    }
    if (req.body.skills) profile.skills = req.body.skills;
    if (req.body.availabilitySchedule) profile.availabilitySchedule = req.body.availabilitySchedule;
    await profile.save();
    res.json({ profile });
  },
);

workersRouter.put(
  '/me/availability',
  requireAuth,
  requireRole('worker'),
  validate(z.object({ body: z.object({ isAvailableNow: z.boolean() }) })),
  async (req, res) => {
    const profile = await WorkerProfile.findOneAndUpdate(
      { userId: req.userId },
      { $set: { isAvailableNow: req.body.isAvailableNow } },
      { new: true },
    );
    if (!profile) throw new AppError(404, 'Worker profile not found', 'NOT_FOUND');
    res.json({ profile });
  },
);

workersRouter.post(
  '/me/verification',
  requireAuth,
  requireRole('worker'),
  validate(
    z.object({
      body: z.object({
        idType: z.enum(['aadhaar', 'voter_id', 'dl']),
        idNumber: z.string().min(4),
        idDocUrl: z.string().url().or(z.string().startsWith('/')),
        selfieUrl: z.string().url().or(z.string().startsWith('/')),
      }),
    }),
  ),
  async (req, res) => {
    const profile = await WorkerProfile.findOne({ userId: req.userId });
    if (!profile) throw new AppError(404, 'Worker profile not found', 'NOT_FOUND');
    const masked = maskIdNumber(req.body.idNumber);
    const kycResult = await kyc.submit({
      userId: String(req.userId),
      idType: req.body.idType,
      idNumberLast4: masked.slice(-4),
      idDocUrl: req.body.idDocUrl,
      selfieUrl: req.body.selfieUrl,
    });
    profile.verification = {
      ...profile.verification,
      phoneVerified: true,
      idType: req.body.idType,
      idNumberMasked: masked,
      idDocUrl: req.body.idDocUrl,
      selfieUrl: req.body.selfieUrl,
      kycReferenceId: kycResult.referenceId,
      status: 'pending',
    };
    await profile.save();
    const trust = await recomputeWorkerTrust(String(req.userId));
    res.json({
      profile,
      trust,
      demo: true,
      message: 'Submitted for admin review (mock KYC — no UIDAI call).',
    });
  },
);

workersRouter.get('/:id/trust', async (req, res) => {
  const profile = await findWorkerParam(req.params.id);
  res.json({
    trustScore: profile.trustScore,
    breakdown: profile.trustBreakdown,
    explainable: true,
  });
});

workersRouter.get('/:id', async (req, res) => {
  const profile = await findWorkerParam(req.params.id);
  const user = await User.findById(profile.userId).select('name avatarUrl phone role');
  const reviews = await Review.find({ toUserId: profile.userId }).sort({ createdAt: -1 }).limit(20);
  res.json({
    user: user
      ? { id: String(user._id), name: user.name, avatarUrl: user.avatarUrl }
      : null,
      profile: {
        ...profile.toObject(),
        verification: {
          status: profile.verification?.status ?? 'none',
          phoneVerified: profile.verification?.phoneVerified ?? false,
          idNumberMasked: profile.verification?.idNumberMasked ?? '',
        },
      },
    reviews,
  });
});

async function findWorkerParam(id: string) {
  const profile =
    (await WorkerProfile.findById(id)) ||
    (await WorkerProfile.findOne({ userId: id })) ||
    (await WorkerProfile.findOne({ digitalId: id }));
  if (!profile) throw new AppError(404, 'Worker not found', 'NOT_FOUND');
  return profile;
}
