import { z } from 'zod';
import { AppError } from '../errors.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { WorkerProfile } from '../models/WorkerProfile.js';
import { recomputeWorkerTrust } from '../services/trust.js';
import { createRouter } from '../utils/router.js';

export const adminRouter = createRouter();

adminRouter.use(requireAuth, requireRole('admin'));

adminRouter.get('/verifications', async (_req, res) => {
  const pending = await WorkerProfile.find({ 'verification.status': 'pending' }).limit(100);
  res.json({ pending });
});

adminRouter.post(
  '/verifications/:workerProfileId',
  validate(
    z.object({
      params: z.object({ workerProfileId: z.string() }),
      body: z.object({
        status: z.enum(['verified', 'rejected']),
        rejectionReason: z.string().optional(),
      }),
    }),
  ),
  async (req, res) => {
    const profile = await WorkerProfile.findById(req.params.workerProfileId);
    if (!profile) throw new AppError(404, 'Worker not found', 'NOT_FOUND');
    profile.verification.status = req.body.status;
    profile.verification.rejectionReason = req.body.rejectionReason;
    if (req.body.status === 'verified') profile.verification.verifiedAt = new Date();
    await profile.save();
    const trust = await recomputeWorkerTrust(String(profile.userId));
    res.json({ profile, trust });
  },
);
