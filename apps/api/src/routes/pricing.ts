
import { z } from 'zod';
import { TRADE_KEYS, TRADES, estimatePrice } from '@kaamsetu/shared';
import { config } from '../config.js';
import { validate } from '../middleware/validate.js';
import { WorkerProfile } from '../models/WorkerProfile.js';
import { createRouter } from '../utils/router.js';

export const pricingRouter = createRouter();

const estimateSchema = z.object({
  body: z.object({
    trade: z.enum(TRADE_KEYS),
    estimatedDurationHrs: z.number().min(0.5).max(72),
    urgency: z.enum(['normal', 'same_day', 'emergency']).default('normal'),
    isNight: z.boolean().optional(),
    workerId: z.string().optional(),
    emergencyIntensity: z.number().min(0).max(1).optional(),
  }),
});

pricingRouter.post(
  '/estimate',
  validate(estimateSchema),
  async (req, res) => {
    // Use the validated trade key for safe TRADES lookup.
    const tradeKey = req.body.trade as (typeof TRADE_KEYS)[number];
    const trade = TRADES[tradeKey];

    let workerHourlyRate: number | undefined;

    if (req.body.workerId) {
      const profile =
        (await WorkerProfile.findOne({ userId: req.body.workerId })) ||
        (await WorkerProfile.findById(req.body.workerId));

      const skill = profile?.skills.find((s) => s.trade === tradeKey);

      // Mongoose hourlyRate may be null, so normalize it to undefined.
      workerHourlyRate = skill?.hourlyRate ?? undefined;
    }

    const breakdown = estimatePrice({
      baseRateHour: trade.baseRateHour,
      baseRateDay: trade.baseRateDay,
      minRate: trade.minRate,
      maxRate: trade.maxRate,
      workerHourlyRate,
      estimatedDurationHrs: req.body.estimatedDurationHrs,
      urgency: req.body.urgency,
      isNight: Boolean(req.body.isNight),
      platformFeeRate: config.platformFeeRate,
      emergencyIntensity: req.body.emergencyIntensity,
    });

    res.json({
      trade: trade.key,
      breakdown,
      notes: {
        platformFeeRate: config.platformFeeRate,
        workerPay: 'Paid to the worker',
        platformFee: 'KaamSetu fee, shown before you confirm',
        urgencySurcharge: 'Same-day / emergency / night multiplier',
      },
    });
  },
);
