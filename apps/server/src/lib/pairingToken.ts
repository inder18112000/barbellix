import { randomBytes, createHash } from 'node:crypto';
import { Types } from 'mongoose';
import { PairingTokenModel } from '../db/models/PairingToken.js';

// Same hashing convention as lib/refreshToken.ts - never store the raw token, only its hash, so
// a database read alone can't be used to impersonate a login.
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

const PAIRING_TOKEN_TTL_MINUTES = 10;

export async function issuePairingToken(userId: Types.ObjectId, tenantId: Types.ObjectId) {
  const token = randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + PAIRING_TOKEN_TTL_MINUTES * 60 * 1000);

  await PairingTokenModel.create({ userId, tenantId, tokenHash: hashToken(token), expiresAt });

  return { token, expiresAt };
}

/** Atomically marks the token used as part of the same query that finds it, so a token can
 * never be redeemed twice even under concurrent requests. Returns null if the token doesn't
 * exist, already expired, or was already used. */
export async function redeemPairingToken(presentedToken: string) {
  const tokenHash = hashToken(presentedToken);
  return PairingTokenModel.findOneAndUpdate(
    { tokenHash, usedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { usedAt: new Date() } },
  );
}
