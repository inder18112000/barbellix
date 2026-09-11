import { randomBytes, createHash } from 'node:crypto';
import { Types } from 'mongoose';
import { PasswordResetTokenModel } from '../db/models/PasswordResetToken.js';

// Same hashing convention as lib/pairingToken.ts and lib/refreshToken.ts - never store the raw
// token, only its hash, so a database read alone can't be used to reset someone's password.
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

const PASSWORD_RESET_TOKEN_TTL_MINUTES = 60;

export async function issuePasswordResetToken(userId: Types.ObjectId) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000);

  await PasswordResetTokenModel.create({ userId, tokenHash: hashToken(token), expiresAt });

  return { token, expiresAt };
}

/** Atomically marks the token used as part of the same query that finds it, so a token can
 * never be redeemed twice even under concurrent requests - same pattern as
 * pairingToken.ts's redeemPairingToken(). Returns null if the token doesn't exist, already
 * expired, or was already used. */
export async function redeemPasswordResetToken(presentedToken: string) {
  const tokenHash = hashToken(presentedToken);
  return PasswordResetTokenModel.findOneAndUpdate(
    { tokenHash, usedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { usedAt: new Date() } },
  );
}
