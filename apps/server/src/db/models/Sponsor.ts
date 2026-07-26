import { Schema, model, Types } from 'mongoose';

export interface SponsorDocument {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  name: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  active: boolean;
}

const sponsorSchema = new Schema<SponsorDocument>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  logoUrl: { type: String },
  websiteUrl: { type: String },
  active: { type: Boolean, required: true, default: true },
});

export const SponsorModel = model<SponsorDocument>('Sponsor', sponsorSchema);
