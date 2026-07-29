import type { FastifyInstance } from 'fastify';
import type { HydratedDocument } from 'mongoose';
import type { UserRole } from '@barbellix/shared';
import { hashPassword, verifyPassword } from '../../lib/password.js';
import { issueRefreshToken, rotateRefreshToken, revokeRefreshToken } from '../../lib/refreshToken.js';
import { redeemPairingToken } from '../../lib/pairingToken.js';
import { ConflictError, UnauthorizedError, ForbiddenError } from '../../lib/errors.js';
import { findMembershipByUserId } from '../billing/repository.js';
import { isAccessBlocked } from '../billing/service.js';
import { getOrCreateDefaultBranch } from '../attendance/repository.js';
import type { UserDocument } from '../../db/models/User.js';
import * as repo from './repository.js';

/**
 * Grace-period enforcement only applies to paying members, not staff accounts (admin/trainer
 * aren't billed and shouldn't be able to lock themselves out by an expired membership record
 * that doesn't even apply to them). See billing/service.ts's isAccessBlocked() for why this is
 * a lazy, per-request check rather than a scheduled job.
 */
async function assertMembershipNotExpired(doc: HydratedDocument<UserDocument>): Promise<void> {
  if (doc.role !== 'member') return;

  const [membership, branch] = await Promise.all([
    findMembershipByUserId(doc._id.toString()),
    getOrCreateDefaultBranch(doc.tenantId.toString()),
  ]);

  if (isAccessBlocked(membership, branch.gracePeriodDays)) {
    throw new ForbiddenError('Your membership has expired. Please renew to continue.');
  }
}

function signAccessToken(fastify: FastifyInstance, user: { id: string; tenantId: string; role: UserRole; branchId?: string }) {
  return fastify.jwt.sign({
    sub: user.id,
    tenantId: user.tenantId,
    role: user.role,
    branchId: user.branchId,
  });
}

/** Shared by login() and pairDevice() - both end with "this user's identity is now verified,
 * issue them a real session," differing only in *how* identity was verified (password vs a
 * redeemed pairing token). Keeping this in one place means the suspended/grace-period checks and
 * token issuance can't drift between the two entry points. */
async function establishSession(fastify: FastifyInstance, doc: HydratedDocument<UserDocument>) {
  if (doc.status === 'suspended') throw new ForbiddenError('This account has been suspended');
  await assertMembershipNotExpired(doc);

  const user = repo.toDomainUser(doc);
  const accessToken = signAccessToken(fastify, user);
  const refreshToken = await issueRefreshToken(doc._id, fastify.config.JWT_REFRESH_EXPIRES_IN_DAYS);

  return { user, accessToken, refreshToken };
}

export async function register(
  fastify: FastifyInstance,
  input: { firstName: string; lastName: string; email: string; password: string },
) {
  const existing = await repo.findUserByEmail(input.email);
  if (existing) throw new ConflictError('An account with this email already exists');

  const tenant = await repo.getOrCreateDefaultTenant();
  const passwordHash = await hashPassword(input.password);

  const doc = await repo.createUser({
    tenantId: tenant._id,
    role: 'member',
    email: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
    passwordHash,
  });

  const user = repo.toDomainUser(doc);
  const accessToken = signAccessToken(fastify, user);
  const refreshToken = await issueRefreshToken(doc._id, fastify.config.JWT_REFRESH_EXPIRES_IN_DAYS);

  return { user, accessToken, refreshToken };
}

export async function login(fastify: FastifyInstance, input: { email: string; password: string }) {
  const doc = await repo.findUserByEmail(input.email);
  if (!doc) throw new UnauthorizedError('Invalid email or password');

  const valid = await verifyPassword(doc.passwordHash, input.password);
  if (!valid) throw new UnauthorizedError('Invalid email or password');

  return establishSession(fastify, doc);
}

/** Redeems a one-time QR device-pairing token (see lib/pairingToken.ts and
 * trainer/service.ts's generateLoginPairingToken) - the scan-to-sign-in flow. Identity here is
 * "whoever the admin generated this specific token for," verified by the token itself rather
 * than a password. */
export async function pairDevice(fastify: FastifyInstance, token: string) {
  const redeemed = await redeemPairingToken(token);
  if (!redeemed) throw new UnauthorizedError('This QR code is invalid or has expired');

  const doc = await repo.findUserById(redeemed.userId.toString());
  if (!doc) throw new UnauthorizedError('This QR code is invalid or has expired');

  return establishSession(fastify, doc);
}

export async function refresh(fastify: FastifyInstance, presentedToken: string) {
  const rotated = await rotateRefreshToken(presentedToken, fastify.config.JWT_REFRESH_EXPIRES_IN_DAYS);
  if (!rotated) throw new UnauthorizedError('Invalid or expired refresh token');

  const doc = await repo.findUserById(rotated.userId.toString());
  if (!doc) throw new UnauthorizedError('Invalid or expired refresh token');

  // Re-checked on every silent refresh (not just at login) so a suspension - or an expired
  // membership past its grace period - takes effect within one access-token lifetime, not only
  // on the user's next fresh login.
  if (doc.status === 'suspended') throw new ForbiddenError('This account has been suspended');
  await assertMembershipNotExpired(doc);

  const user = repo.toDomainUser(doc);
  const accessToken = signAccessToken(fastify, user);

  return { accessToken, refreshToken: rotated.token };
}

export async function logout(refreshToken: string) {
  await revokeRefreshToken(refreshToken);
}

/** Always returns the same message regardless of whether the email exists, to prevent user enumeration. */
export async function forgotPassword(fastify: FastifyInstance, email: string) {
  const user = await repo.findUserByEmail(email);
  if (user) {
    fastify.log.info({ email }, 'Password reset requested (no email sending configured yet)');
  }
  return { message: 'If an account with that email exists, a reset link has been sent.' };
}
