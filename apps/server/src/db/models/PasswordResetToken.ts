import { Schema, model, Types } from 'mongoose';

/** Short-lived, single-use token for the "forgot password" email flow - same shape and hashing
 * convention as PairingToken (never store the raw token, only its hash), just a longer TTL since
 * this one waits on a human reading an email rather than scanning a QR code immediately. */
export interface PasswordResetTokenDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
}

const passwordResetTokenSchema = new Schema<PasswordResetTokenDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const PasswordResetTokenModel = model<PasswordResetTokenDocument>(
  'PasswordResetToken',
  passwordResetTokenSchema,
);
