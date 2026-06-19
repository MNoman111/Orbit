import { Request, Response, NextFunction } from 'express';
import { Role } from '../models/membership.model';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

/**
 * Permission catalog. Roles are ordered by privilege; a role inherits every
 * permission of the roles below it. Keeping this in ONE place (rather than
 * scattering role checks through controllers) is what makes authorization
 * auditable.
 */
const ROLE_RANK: Record<Role, number> = {
  viewer: 0,
  member: 1,
  admin: 2,
  owner: 3,
};

/**
 * Guards a route so only callers with at least the given role may proceed.
 * Relies on `req.role` having been set by the tenant middleware.
 */
export function requireRole(minimum: Role) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.role) throw new UnauthorizedError('Tenant context not resolved');
    if (ROLE_RANK[req.role] < ROLE_RANK[minimum]) {
      throw new ForbiddenError(`Requires '${minimum}' role or higher`);
    }
    next();
  };
}
