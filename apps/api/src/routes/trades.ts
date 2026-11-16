import { Trade } from '../models/Trade.js';
import { createRouter } from '../utils/router.js';

export const tradesRouter = createRouter();

tradesRouter.get('/', async (_req, res) => {
  const trades = await Trade.find({ active: true }).sort({ key: 1 });
  res.json({ trades });
});
