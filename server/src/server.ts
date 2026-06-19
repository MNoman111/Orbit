import { createApp } from './app';
import { connectDb } from './config/db';
import { env } from './config/env';
import { logger } from './utils/logger';

async function bootstrap(): Promise<void> {
  await connectDb();
  const app = createApp();
  app.listen(env.PORT, () => {
    logger.info(`Orbit API listening on http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
