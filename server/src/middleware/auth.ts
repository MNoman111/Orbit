import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/tokens';
import { UnauthorizedError } from '../utils/errors';

/**
 * Authenticates the request from the Bearer access token and attaches
 * `req.userId`. Does NOT resolve a tenant — that is the tenant middleware's job.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or malformed Authorization header');
  }
  try {
    const payload = verifyAccessToken(header.slice(7));
    req.userId = payload.userId;
    next();
  } catch {
    throw new UnauthorizedError('Invalid or expired access token');
  }
}
