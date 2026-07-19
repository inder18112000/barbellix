import { Schema, model, Types } from 'mongoose';

export interface MembershipPlanDocument {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  name: string;
  description?: string;
  priceCents: number;
  currency: string;
  billingInterval: 'month' | 'year';
  stripeProductId?: string;
  stripePriceId?: string;
  active: boolean;
}

const membershipPlanSchema = new Schema<MembershipPlanDocument>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  priceCents: { type: Number, required: true },
  currency: { type: String, required: true, default: 'usd' },
  billingInterval: { type: String, enum: ['month', 'year'], required: true },
  stripeProductId: { type: String },
  stripePriceId: { type: String },
  active: { type: Boolean, required: true, default: true },
});

export const MembershipPlanModel = model<MembershipPlanDocument>('MembershipPlan', membershipPlanSchema);
