import { Schema, model, Types } from 'mongoose';
import type { CheckInMethod } from '@barbellix/shared';

const CHECK_IN_METHODS: CheckInMethod[] = ['qr', 'nfc', 'pin', 'manual'];

export interface BranchDocument {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  name: string;
  location: string;
  qrCodeToken: string;
  capacity?: number;
  checkInMethods: CheckInMethod[];
  autoCheckoutEnabled: boolean;
  autoCheckoutAfterMins: number;
  guestPassEnabled: boolean;
  gracePeriodDays: number;
}

const branchSchema = new Schema<BranchDocument>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  name: { type: String, required: true },
  location: { type: String, required: true, default: '' },
  qrCodeToken: { type: String, required: true, unique: true },
  capacity: { type: Number },
  checkInMethods: { type: [String], enum: CHECK_IN_METHODS, default: ['qr', 'pin'] },
  autoCheckoutEnabled: { type: Boolean, default: true },
  autoCheckoutAfterMins: { type: Number, default: 180 },
  guestPassEnabled: { type: Boolean, default: false },
  gracePeriodDays: { type: Number, default: 2 },
});

export const BranchModel = model<BranchDocument>('Branch', branchSchema);
