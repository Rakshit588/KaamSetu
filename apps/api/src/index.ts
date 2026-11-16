import { createApp } from './app.js';
import { config } from './config.js';
import { connectDb } from './db.js';
import { logger } from './logger.js';

async function main() {
  await connectDb(config.mongoUri);
  const app = createApp();
  app.listen(config.port, () => {
    logger.info(`KaamSetu API listening on :${config.port}`);
  });
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
