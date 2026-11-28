import { z } from 'zod';
import { AppError } from '../errors.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { WorkerProfile } from '../models/WorkerProfile.js';
import { registerAuditRoutes } from './admin/audit.js';
import { recomputeWorkerTrust } from '../services/trust.js';
import { createRouter } from '../utils/router.js';

export const adminRouter = createRouter();

adminRouter.use(requireAuth, requireRole('admin'));
registerAuditRoutes(adminRouter);

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
    profile.set('verification.status', req.body.status);
    profile.set('verification.rejectionReason', req.body.rejectionReason);

    if (req.body.status === 'verified') {
      profile.set('verification.verifiedAt', new Date());
    } else {
      profile.set('verification.verifiedAt', undefined);
    }
    await profile.save();
    const trust = await recomputeWorkerTrust(String(profile.userId));
    res.json({ profile, trust });
  },
);
