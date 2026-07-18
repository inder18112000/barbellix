import { randomBytes, createHash } from 'node:crypto';
import { Types } from 'mongoose';
import { RefreshTokenModel } from '../db/models/RefreshToken.js';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function issueRefreshToken(userId: Types.ObjectId, expiresInDays: number) {
  const token = randomBytes(48).toString('hex');
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  await RefreshTokenModel.create({
    userId,
    tokenHash: hashToken(token),
    expiresAt,
  });

  return token;
}

/**
 * Verifies and rotates a refresh token.
 *
 * Reuse of a token already revoked by ROTATION (i.e. it was already legitimately
 * exchanged for a newer one) is a strong theft signal - the old token being presented
 * again means someone has a stale copy - so every other active session is defensively
 * revoked too. Reuse of a token revoked by plain LOGOUT is not treated as theft: that's
 * just "this session already ended," which shouldn't kill the user's other devices.
 */
export async function rotateRefreshToken(presentedToken: string, expiresInDays: number) {
  const tokenHash = hashToken(presentedToken);
  const existing = await RefreshTokenModel.findOne({ tokenHash });

  if (!existing) return null;

  if (existing.revokedAt || existing.expiresAt < new Date()) {
    if (existing.revokedReason === 'rotated') {
      await RefreshTokenModel.updateMany(
        { userId: existing.userId, revokedAt: null },
        { revokedAt: new Date(), revokedReason: 'security' },
      );
    }
    return null;
  }

  const newToken = randomBytes(48).toString('hex');
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
  const created = await RefreshTokenModel.create({
    userId: existing.userId,
    tokenHash: hashToken(newToken),
    expiresAt,
  });

  existing.revokedAt = new Date();
  existing.revokedReason = 'rotated';
  existing.replacedByTokenId = created._id;
  await existing.save();

  return { token: newToken, userId: existing.userId };
}

/** Revokes only the single presented token (normal logout - other sessions/devices stay active). */
export async function revokeRefreshToken(presentedToken: string) {
  await RefreshTokenModel.updateOne(
    { tokenHash: hashToken(presentedToken), revokedAt: null },
    { revokedAt: new Date(), revokedReason: 'logout' },
  );
}

/** Revokes every active token for a user (theft-detection response, or a future "log out everywhere"). */
export async function revokeAllRefreshTokens(userId: Types.ObjectId) {
  await RefreshTokenModel.updateMany(
    { userId, revokedAt: null },
    { revokedAt: new Date(), revokedReason: 'security' },
  );
}
