import type { Role } from '../models/membership.model';

/**
 * Request augmentation. Populated by the auth, tenant, and rbac middleware
 * so downstream handlers have typed access to the authenticated principal,
 * the resolved tenant, and the caller's role within it.
 */
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      orgId?: string;
      role?: Role;
      requestId?: string;
    }
  }
}

export {};
