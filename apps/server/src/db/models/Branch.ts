import { Schema, model, Types } from 'mongoose';
import type { CheckInMethod } from '@barbellix/shared';

const CHECK_IN_METHODS: CheckInMethod[] = ['qr', 'nfc', 'pin', 'manual'];

/** 6-digit default so a freshly-created branch has a working PIN check-in path out of the box -
 * admins can see/change it from Branch Settings (front desk reads it off to members who forgot
 * their phone). See attendance/service.ts's checkIn() for the verification side. */
function generateCheckInPin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export interface BranchDocument {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  name: string;
  location: string;
  qrCodeToken: string;
  checkInPin: string;
  capacity?: number;
  checkInMethods: CheckInMethod[];
  autoCheckoutEnabled: boolean;
  autoCheckoutAfterMins: number;
  guestPassEnabled: boolean;
  gracePeriodDays: number;
  checkInIntervalDays: number;
}

const branchSchema = new Schema<BranchDocument>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  name: { type: String, required: true },
  location: { type: String, required: true, default: '' },
  qrCodeToken: { type: String, required: true, unique: true },
  checkInPin: { type: String, required: true, default: generateCheckInPin },
  capacity: { type: Number },
  checkInMethods: { type: [String], enum: CHECK_IN_METHODS, default: ['qr', 'pin'] },
  autoCheckoutEnabled: { type: Boolean, default: true },
  autoCheckoutAfterMins: { type: Number, default: 180 },
  guestPassEnabled: { type: Boolean, default: false },
  gracePeriodDays: { type: Number, default: 2 },
  checkInIntervalDays: { type: Number, default: 7 },
});

export const BranchModel = model<BranchDocument>('Branch', branchSchema);
