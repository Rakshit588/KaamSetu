import { z } from 'zod';
import { CUSTOMER_TYPES } from '@kaamsetu/shared';
import { AppError } from '../errors.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { CustomerProfile } from '../models/CustomerProfile.js';
import { createRouter } from '../utils/router.js';

export const customersRouter = createRouter();

customersRouter.get('/me', requireAuth, requireRole('customer'), async (req, res) => {
  const profile = await CustomerProfile.findOne({ userId: req.userId });
  if (!profile) throw new AppError(404, 'Customer profile not found', 'NOT_FOUND');
  res.json({ profile });
});

customersRouter.put(
  '/me',
  requireAuth,
  requireRole('customer'),
  validate(
    z.object({
      body: z.object({
        customerType: z.enum(CUSTOMER_TYPES).optional(),
        savedAddresses: z
          .array(
            z.object({
              label: z.string(),
              address: z.string(),
              location: z.object({ lng: z.number(), lat: z.number() }),
            }),
          )
          .optional(),
      }),
    }),
  ),
  async (req, res) => {
    const profile = await CustomerProfile.findOne({ userId: req.userId });
    if (!profile) throw new AppError(404, 'Customer profile not found', 'NOT_FOUND');
    if (req.body.customerType) profile.customerType = req.body.customerType;
    if (req.body.savedAddresses) {
      profile.savedAddresses = req.body.savedAddresses.map((a: any) => ({
        label: a.label,
        address: a.address,
        location: { type: 'Point', coordinates: [a.location.lng, a.location.lat] },
      }));
    }
    await profile.save();
    res.json({ profile });
  },
);
