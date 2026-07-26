import { Schema, model, Types } from 'mongoose';

/** Short-lived, single-use token for QR-based device-pairing login - an admin generates one
 * (shown as a QR code in the web dashboard), the member scans it in the mobile app once to get
 * a real session, without ever typing a password. Email/password login remains the default path. */
export interface PairingTokenDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  tenantId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
}

const pairingTokenSchema = new Schema<PairingTokenDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const PairingTokenModel = model<PairingTokenDocument>('PairingToken', pairingTokenSchema);
