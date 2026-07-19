import type { HydratedDocument } from 'mongoose';
import type { MembershipPlan, Membership } from '@fitpulse/shared';
import { MembershipPlanModel, type MembershipPlanDocument } from '../../db/models/MembershipPlan.js';
import { MembershipModel, type MembershipDocument } from '../../db/models/Membership.js';

export function toDomainPlan(doc: HydratedDocument<MembershipPlanDocument>): MembershipPlan {
  return {
    id: doc._id.toString(),
    tenantId: doc.tenantId.toString(),
    name: doc.name,
    description: doc.description,
    priceCents: doc.priceCents,
    currency: doc.currency,
    billingInterval: doc.billingInterval,
    stripeProductId: doc.stripeProductId,
    stripePriceId: doc.stripePriceId,
    active: doc.active,
  };
}

export function toDomainMembership(doc: HydratedDocument<MembershipDocument>): Membership {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    tenantId: doc.tenantId.toString(),
    planId: doc.planId?.toString(),
    plan: doc.planName,
    status: doc.status,
    paymentStatus: doc.paymentStatus,
    stripeCustomerId: doc.stripeCustomerId,
    stripeSubscriptionId: doc.stripeSubscriptionId,
    currentPeriodEnd: doc.currentPeriodEnd?.toISOString(),
    startDate: doc.startDate.toISOString(),
    endDate: doc.endDate?.toISOString(),
  };
}

// ─── Plans ────────────────────────────────────────────────────────────────────

export async function findPlansByTenant(tenantId: string) {
  return MembershipPlanModel.find({ tenantId }).sort({ priceCents: 1 });
}

export async function findPlanById(id: string, tenantId: string) {
  return MembershipPlanModel.findOne({ _id: id, tenantId });
}

export async function createPlan(input: {
  tenantId: string;
  name: string;
  description?: string;
  priceCents: number;
  currency: string;
  billingInterval: 'month' | 'year';
  stripeProductId?: string;
  stripePriceId?: string;
}) {
  return MembershipPlanModel.create(input);
}

export async function updatePlan(id: string, tenantId: string, updates: Partial<MembershipPlanDocument>) {
  return MembershipPlanModel.findOneAndUpdate({ _id: id, tenantId }, { $set: updates }, { new: true });
}

// ─── Memberships ──────────────────────────────────────────────────────────────

export async function findMembershipByUserId(userId: string) {
  return MembershipModel.findOne({ userId });
}

export async function findMembershipByStripeCustomerId(stripeCustomerId: string) {
  return MembershipModel.findOne({ stripeCustomerId });
}

export async function findMembershipByStripeSubscriptionId(stripeSubscriptionId: string) {
  return MembershipModel.findOne({ stripeSubscriptionId });
}

type UpsertMembershipInput = Omit<Partial<MembershipDocument>, 'tenantId' | 'planId'> & {
  // Mongoose casts these string ids to ObjectId on write - callers deal in strings, not
  // hydrated document types.
  tenantId?: string;
  planId?: string;
};

export async function upsertMembership(userId: string, updates: UpsertMembershipInput) {
  return MembershipModel.findOneAndUpdate(
    { userId },
    { $set: updates, $setOnInsert: { userId, startDate: new Date() } },
    { new: true, upsert: true },
  );
}
