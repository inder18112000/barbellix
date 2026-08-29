import { Schema, model, Types } from 'mongoose';

/** Short-lived, single-use OTP confirming an in-person cash payment - an admin initiates one for
 * a specific member+amount, the member receives a 6-digit code by SMS, and the admin re-enters it
 * to confirm the payment actually happened with the member's knowledge (a lightweight anti-fraud
 * consent step). Modeled on PairingToken.ts's issue/hash/redeem-once pattern, but numeric (spoken
 * aloud at a front desk, not scanned) and bound to a specific amount so a code can't be replayed
 * against a different payment. */
export interface CashPaymentOtpDocument {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  memberId: Types.ObjectId;
  initiatedByAdminId: Types.ObjectId;
  codeHash: string;
  amountCents: number;
  currency: string;
  planId?: Types.ObjectId;
  planName: string;
  attempts: number;
  expiresAt: Date;
  usedAt?: Date;
}

const cashPaymentOtpSchema = new Schema<CashPaymentOtpDocument>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    initiatedByAdminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    codeHash: { type: String, required: true },
    amountCents: { type: Number, required: true },
    currency: { type: String, required: true },
    planId: { type: Schema.Types.ObjectId, ref: 'MembershipPlan' },
    planName: { type: String, required: true },
    attempts: { type: Number, required: true, default: 0 },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const CashPaymentOtpModel = model<CashPaymentOtpDocument>('CashPaymentOtp', cashPaymentOtpSchema);
