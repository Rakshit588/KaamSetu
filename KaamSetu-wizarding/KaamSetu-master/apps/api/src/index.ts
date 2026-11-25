import { createServer } from 'node:http';
import { createApp } from './app.js';
import { config } from './config.js';
import { connectDb } from './db.js';
import { logger } from './logger.js';
import { attachSocket } from './realtime/io.js';

async function main() {
  await connectDb(config.mongoUri);
  const app = createApp();
  const httpServer = createServer(app);
  attachSocket(httpServer);
  httpServer.listen(config.port, () => {
    logger.info(`KaamSetu API listening on :${config.port} (HTTP + Socket.io)`);
  });
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
