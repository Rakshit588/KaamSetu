import { z } from 'zod';
import { mapTextToTrade } from '@kaamsetu/shared';
import { config } from '../config.js';
import { validate } from '../middleware/validate.js';
import { createRouter } from '../utils/router.js';

export const aiRouter = createRouter();

aiRouter.post(
  '/interpret',
  validate(z.object({ body: z.object({ text: z.string().min(3).max(500) }) })),
  async (req, res) => {
    const mapped = mapTextToTrade(req.body.text);
    res.json({
      ...mapped,
      source: config.openaiKey ? 'llm_unavailable_fallback_keywords' : 'keyword',
      demo: !config.openaiKey,
      note: 'Smart match uses a transparent weighted score. LLM mapping is optional and falls back to keywords.',
    });
  },
);
