import { Schema, model, Types } from 'mongoose';

export type RevokedReason = 'rotated' | 'logout' | 'security';

export interface RefreshTokenDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date;
  revokedReason?: RevokedReason;
  replacedByTokenId?: Types.ObjectId;
  createdAt: Date;
}

const refreshTokenSchema = new Schema<RefreshTokenDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  revokedAt: { type: Date },
  revokedReason: { type: String, enum: ['rotated', 'logout', 'security'] },
  replacedByTokenId: { type: Schema.Types.ObjectId, ref: 'RefreshToken' },
  createdAt: { type: Date, default: Date.now },
});

// TTL index: MongoDB automatically deletes documents once expiresAt is in the past.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshTokenModel = model<RefreshTokenDocument>('RefreshToken', refreshTokenSchema);
