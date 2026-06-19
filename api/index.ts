import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createApp } from '../server/src/app';
import { connectToDatabase } from '../server/src/config/serverlessDb';

/**
 * Vercel serverless entry point.
 *
 * The Express app is built ONCE per cold start (module scope) and reused. We
 * ensure the database connection is initiated before handing the request to
 * Express. The app is a standard (req, res) request listener, so it can be
 * invoked directly with Vercel's Node request/response objects.
 *
 * All routes live under /api/v1 (plus /healthz); vercel.json routes those
 * paths here while serving the built frontend for everything else.
 */
const app = createApp();

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  await connectToDatabase();
  (app as unknown as (req: VercelRequest, res: VercelResponse) => void)(req, res);
}
