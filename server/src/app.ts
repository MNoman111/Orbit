import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import apiRoutes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error';

// Note: src/types/express.d.ts augments the Express Request type globally
// (picked up via tsconfig "include") — no runtime import needed.

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  // Brute-force protection on auth; generous global limit otherwise.
  app.use('/api/v1/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 50 }));
  app.use(rateLimit({ windowMs: 60 * 1000, max: 300 }));

  app.get('/healthz', (_req, res) => res.json({ status: 'ok', ts: Date.now() }));

  app.use('/api/v1', apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
