import { Schema, model, Types } from 'mongoose';

export interface MembershipPlanDocument {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  name: string;
  description?: string;
  priceCents: number;
  currency: string;
  billingInterval: 'month' | 'year';
  active: boolean;
}

const membershipPlanSchema = new Schema<MembershipPlanDocument>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  priceCents: { type: Number, required: true },
  // Cashfree's UPI payment method is INR-only - default new plans to INR rather than Stripe-era 'usd'.
  currency: { type: String, required: true, default: 'inr' },
  billingInterval: { type: String, enum: ['month', 'year'], required: true },
  active: { type: Boolean, required: true, default: true },
});

export const MembershipPlanModel = model<MembershipPlanDocument>('MembershipPlan', membershipPlanSchema);
