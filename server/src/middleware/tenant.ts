import { Request, Response, NextFunction } from 'express';
import { Membership } from '../models/membership.model';
import { NotFoundError, UnauthorizedError } from '../utils/errors';
import { asyncHandler } from './asyncHandler';

/**
 * Resolves the active tenant for the request.
 *
 * The org is taken from the `X-Org-Id` header and ONLY accepted if the
 * authenticated user has an active membership in it. This is the gate that
 * makes cross-tenant access impossible: every downstream handler reads
 * `req.orgId`, which is guaranteed to belong to the caller.
 *
 * We respond 404 (not 403) for orgs the user isn't part of so we never reveal
 * that an org exists.
 */
export const resolveTenant = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.userId) throw new UnauthorizedError();

    const orgId = req.header('X-Org-Id');
    if (!orgId) throw new NotFoundError('Organization context required (X-Org-Id header)');

    const membership = await Membership.findOne({
      orgId,
      userId: req.userId,
      status: 'active',
    }).lean();

    if (!membership) throw new NotFoundError('Organization not found');

    req.orgId = orgId;
    req.role = membership.role;
    next();
  },
);
