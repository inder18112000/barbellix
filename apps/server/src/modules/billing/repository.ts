import type { HydratedDocument } from 'mongoose';
import type { MembershipPlan, Membership, PaymentEvent, PaymentEventType } from '@fitpulse/shared';
import { MembershipPlanModel, type MembershipPlanDocument } from '../../db/models/MembershipPlan.js';
import { MembershipModel, type MembershipDocument } from '../../db/models/Membership.js';
import { PaymentEventModel, type PaymentEventDocument } from '../../db/models/PaymentEvent.js';

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
    paymentMethod: doc.paymentMethod,
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
  // $set and $setOnInsert can't both touch the same field path - Mongo rejects the whole
  // update with a "conflict at" error if they do. Callers that explicitly set startDate
  // (e.g. admin date edits) would otherwise collide with the default below on every call.
  const setOnInsert: Record<string, unknown> = { userId };
  if (!('startDate' in updates)) setOnInsert.startDate = new Date();

  return MembershipModel.findOneAndUpdate(
    { userId },
    { $set: updates, $setOnInsert: setOnInsert },
    { new: true, upsert: true },
  );
}

export async function getMembershipCounts(tenantId: string) {
  const [expiredSubscriptions, pendingPayments, onlinePayments, cashPayments] = await Promise.all([
    MembershipModel.countDocuments({ tenantId, status: { $in: ['expired', 'cancelled'] } }),
    MembershipModel.countDocuments({ tenantId, paymentStatus: 'due' }),
    MembershipModel.countDocuments({ tenantId, paymentMethod: 'online' }),
    MembershipModel.countDocuments({ tenantId, paymentMethod: 'cash' }),
  ]);
  return { expiredSubscriptions, pendingPayments, onlinePayments, cashPayments };
}

// ─── Payment history ────────────────────────────────────────────────────────────

export function toDomainPaymentEvent(doc: HydratedDocument<PaymentEventDocument>): PaymentEvent {
  return {
    id: doc._id.toString(),
    tenantId: doc.tenantId.toString(),
    userId: doc.userId.toString(),
    type: doc.type,
    amountCents: doc.amountCents,
    currency: doc.currency,
    planName: doc.planName,
    occurredAt: doc.occurredAt.toISOString(),
  };
}

export async function recordPaymentEvent(input: {
  tenantId: string;
  userId: string;
  type: PaymentEventType;
  amountCents?: number;
  currency?: string;
  planName?: string;
}) {
  return PaymentEventModel.create(input);
}

export async function findPaymentEventsByUser(userId: string, limit = 50) {
  return PaymentEventModel.find({ userId }).sort({ occurredAt: -1 }).limit(limit);
}
