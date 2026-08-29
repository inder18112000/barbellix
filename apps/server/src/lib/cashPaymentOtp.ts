import { randomInt, createHash } from 'node:crypto';
import { Types } from 'mongoose';
import { CashPaymentOtpModel } from '../db/models/CashPaymentOtp.js';
import { ValidationError, NotFoundError } from './errors.js';

// Same hashing convention as lib/pairingToken.ts and lib/refreshToken.ts - never store the raw
// code, only its hash.
function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;

export async function issueCashPaymentOtp(input: {
  tenantId: string;
  memberId: string;
  initiatedByAdminId: string;
  amountCents: number;
  currency: string;
  planId?: string;
  planName: string;
}) {
  const code = randomInt(100000, 1000000).toString();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await CashPaymentOtpModel.create({
    tenantId: new Types.ObjectId(input.tenantId),
    memberId: new Types.ObjectId(input.memberId),
    initiatedByAdminId: new Types.ObjectId(input.initiatedByAdminId),
    codeHash: hashCode(code),
    amountCents: input.amountCents,
    currency: input.currency,
    planId: input.planId ? new Types.ObjectId(input.planId) : undefined,
    planName: input.planName,
    expiresAt,
  });

  return { code, expiresAt };
}

/** Atomically consumes a pending OTP for this member+amount. Wrong codes increment `attempts`
 * without consuming the OTP (so the member's real code still works after a typo) until
 * MAX_ATTEMPTS is hit, at which point the OTP is voided (usedAt set) to force a fresh SMS rather
 * than allow indefinite guessing within the TTL window. */
export async function verifyCashPaymentOtp(input: { memberId: string; amountCents: number; code: string }) {
  const pending = await CashPaymentOtpModel.findOne({
    memberId: new Types.ObjectId(input.memberId),
    amountCents: input.amountCents,
    usedAt: null,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!pending) {
    throw new NotFoundError('No pending cash payment for this amount - request a new code');
  }

  if (pending.codeHash !== hashCode(input.code)) {
    pending.attempts += 1;
    if (pending.attempts >= MAX_ATTEMPTS) {
      pending.usedAt = new Date();
      await pending.save();
      throw new ValidationError('Too many incorrect attempts - request a new code');
    }
    await pending.save();
    throw new ValidationError('Incorrect code');
  }

  // Atomic redeem - findOneAndUpdate keyed on usedAt:null guarantees single-use even under
  // concurrent confirm requests, same pattern as pairingToken.ts's redeemPairingToken().
  const redeemed = await CashPaymentOtpModel.findOneAndUpdate(
    { _id: pending._id, usedAt: null },
    { $set: { usedAt: new Date() } },
    { new: true },
  );
  if (!redeemed) throw new ValidationError('This code was already used or has expired - request a new code');

  return redeemed;
}
