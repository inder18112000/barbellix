import { Schema, model } from 'mongoose';
import type { PlanTier } from '@fitpulse/shared';

const PLAN_TIERS: PlanTier[] = ['free', 'pro', 'gym_starter', 'gym_business', 'enterprise'];

const themeConfigSchema = new Schema(
  {
    primaryColor: { type: String, required: true },
    logoUrl: { type: String },
    brandName: { type: String, required: true },
  },
  { _id: false },
);

const tenantSchema = new Schema(
  {
    name: { type: String, required: true },
    planTier: { type: String, enum: PLAN_TIERS, required: true, default: 'free' },
    themeConfig: { type: themeConfigSchema, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const TenantModel = model('Tenant', tenantSchema);
