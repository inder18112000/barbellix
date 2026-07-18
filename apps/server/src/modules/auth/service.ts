import type { FastifyInstance } from 'fastify';
import type { UserRole } from '@fitpulse/shared';
import { hashPassword, verifyPassword } from '../../lib/password.js';
import { issueRefreshToken, rotateRefreshToken, revokeRefreshToken } from '../../lib/refreshToken.js';
import { ConflictError, UnauthorizedError } from '../../lib/errors.js';
import * as repo from './repository.js';

function signAccessToken(fastify: FastifyInstance, user: { id: string; tenantId: string; role: UserRole; branchId?: string }) {
  return fastify.jwt.sign({
    sub: user.id,
    tenantId: user.tenantId,
    role: user.role,
    branchId: user.branchId,
  });
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

  const user = repo.toDomainUser(doc);
  const accessToken = signAccessToken(fastify, user);
  const refreshToken = await issueRefreshToken(doc._id, fastify.config.JWT_REFRESH_EXPIRES_IN_DAYS);

  return { user, accessToken, refreshToken };
}

export async function refresh(fastify: FastifyInstance, presentedToken: string) {
  const rotated = await rotateRefreshToken(presentedToken, fastify.config.JWT_REFRESH_EXPIRES_IN_DAYS);
  if (!rotated) throw new UnauthorizedError('Invalid or expired refresh token');

  const doc = await repo.findUserById(rotated.userId.toString());
  if (!doc) throw new UnauthorizedError('Invalid or expired refresh token');

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
