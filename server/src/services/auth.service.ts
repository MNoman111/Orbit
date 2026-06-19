import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User } from '../models/user.model';
import { Organization } from '../models/organization.model';
import { Membership } from '../models/membership.model';
import { RefreshToken } from '../models/refreshToken.model';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/tokens';
import { env } from '../config/env';
import { BadRequestError, ConflictError, UnauthorizedError } from '../utils/errors';

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);
}

async function issueTokens(userId: string) {
  const tokenId = crypto.randomUUID();
  await RefreshToken.create({
    tokenId,
    userId,
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
  });
  return {
    accessToken: signAccessToken({ userId }),
    refreshToken: signRefreshToken({ userId, tokenId }),
  };
}

export const authService = {
  /** Registers a user and creates their first organization (they become owner). */
  async register(input: { email: string; password: string; name: string; orgName: string }) {
    const existing = await User.findOne({ email: input.email }).lean();
    if (existing) throw new ConflictError('An account with this email already exists');

    const passwordHash = await bcrypt.hash(input.password, 12);

    // Use a session so user + org + membership are created atomically.
    const session = await mongoose.startSession();
    try {
      let result!: { userId: string; orgId: string };
      await session.withTransaction(async () => {
        const [user] = await User.create([{ ...input, passwordHash }], { session });
        let slug = slugify(input.orgName);
        if (!slug) slug = `org-${crypto.randomBytes(3).toString('hex')}`;
        const [org] = await Organization.create(
          [{ name: input.orgName, slug, createdBy: user._id }],
          { session },
        );
        await Membership.create(
          [{ orgId: org._id, userId: user._id, role: 'owner', status: 'active' }],
          { session },
        );
        result = { userId: user._id.toString(), orgId: org._id.toString() };
      });
      const tokens = await issueTokens(result.userId);
      return { ...result, ...tokens };
    } finally {
      await session.endSession();
    }
  },

  async login(email: string, password: string) {
    const user = await User.findOne({ email });
    if (!user) throw new UnauthorizedError('Invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedError('Invalid credentials');
    const tokens = await issueTokens(user._id.toString());
    return { userId: user._id.toString(), ...tokens };
  },

  /** Validates and ROTATES a refresh token: the old one is revoked, a new pair issued. */
  async refresh(token: string | undefined) {
    if (!token) throw new UnauthorizedError('Missing refresh token');
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }
    const record = await RefreshToken.findOne({ tokenId: payload.tokenId });
    if (!record || record.revoked) throw new UnauthorizedError('Refresh token revoked');

    record.revoked = true;
    await record.save();
    const tokens = await issueTokens(payload.userId);
    return { userId: payload.userId, ...tokens };
  },

  async logout(token: string | undefined) {
    if (!token) return;
    try {
      const payload = verifyRefreshToken(token);
      await RefreshToken.updateOne({ tokenId: payload.tokenId }, { revoked: true });
    } catch {
      /* already invalid — nothing to revoke */
    }
  },

  /** Returns the profile plus the orgs the user belongs to (for the org switcher). */
  async me(userId: string) {
    const user = await User.findById(userId).lean();
    if (!user) throw new BadRequestError('User no longer exists');
    const memberships = await Membership.find({ userId, status: 'active' })
      .populate('orgId', 'name slug plan')
      .lean();
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      organizations: memberships.map((m) => ({
        membershipId: m._id.toString(),
        role: m.role,
        org: m.orgId,
      })),
    };
  },

  refreshCookieMaxAge: REFRESH_TTL_MS,
  isProd: env.NODE_ENV === 'production',
};
