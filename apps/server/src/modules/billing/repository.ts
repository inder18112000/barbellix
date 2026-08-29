import { Types, type HydratedDocument } from 'mongoose';
import type { MembershipPlan, Membership, PaymentEvent, PaymentEventType, PaymentStatus, PaymentMethod } from '@barbellix/shared';
import { MembershipPlanModel, type MembershipPlanDocument } from '../../db/models/MembershipPlan.js';
import { MembershipModel, type MembershipDocument } from '../../db/models/Membership.js';
import { PaymentEventModel, type PaymentEventDocument } from '../../db/models/PaymentEvent.js';
import { idStr, isoStr } from '../../lib/mappers-base.js';

export function toDomainPlan(doc: HydratedDocument<MembershipPlanDocument>): MembershipPlan {
  return {
    id: idStr(doc._id),
    tenantId: idStr(doc.tenantId),
    name: doc.name,
    description: doc.description,
    priceCents: doc.priceCents,
    currency: doc.currency,
    billingInterval: doc.billingInterval,
    active: doc.active,
  };
}

export function toDomainMembership(doc: HydratedDocument<MembershipDocument>): Membership {
  return {
    id: idStr(doc._id),
    userId: idStr(doc.userId),
    tenantId: idStr(doc.tenantId),
    planId: doc.planId ? idStr(doc.planId) : undefined,
    plan: doc.planName,
    status: doc.status,
    paymentStatus: doc.paymentStatus,
    paymentMethod: doc.paymentMethod,
    gatewayOrderId: doc.gatewayOrderId,
    currentPeriodEnd: isoStr(doc.currentPeriodEnd),
    startDate: isoStr(doc.startDate),
    endDate: isoStr(doc.endDate),
    lastPaymentReminderAt: isoStr(doc.lastPaymentReminderAt),
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

/** Batched sibling of findMembershipByUserId - one query for every member's membership instead
 * of one per member. userId is unique on the Membership schema, so this is a safe 1:1 map. */
export async function findMembershipsByUserIds(userIds: string[]) {
  const docs = await MembershipModel.find({ userId: { $in: userIds } });
  return new Map(docs.map((doc) => [doc.userId.toString(), doc]));
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

/**
 * Extends a membership's endDate by exactly one billing interval, computed entirely inside a
 * single atomic MongoDB aggregation-pipeline update - never read-then-compute-then-write in
 * application code. That matters because two payments can legitimately land at nearly the same
 * moment (a member finishing online checkout right as an admin confirms a cash payment for them) -
 * a naive "read endDate, add an interval, write it back" would let one of those two payments'
 * worth of credit get silently overwritten by the other. Using MongoDB's $$NOW (a single
 * consistent timestamp for the whole pipeline execution) and $dateAdd means every call - no
 * matter how concurrent - always extends from the true latest stored value, not a stale read.
 *
 * $setOnInsert isn't available in pipeline-style updates, so "set only if missing" is expressed
 * with $ifNull directly in the $set stage instead (used for startDate here).
 */
export async function extendMembershipAtomic(
  userId: string,
  input: {
    tenantId: string;
    planId?: string;
    planName: string;
    paymentStatus: PaymentStatus;
    paymentMethod: PaymentMethod;
    billingInterval: 'month' | 'year';
    gatewayOrderId?: string;
  },
) {
  return MembershipModel.findOneAndUpdate(
    { userId },
    [
      {
        $set: {
          userId: new Types.ObjectId(userId),
          tenantId: new Types.ObjectId(input.tenantId),
          planId: input.planId ? new Types.ObjectId(input.planId) : '$planId',
          planName: input.planName,
          status: 'active',
          paymentStatus: input.paymentStatus,
          paymentMethod: input.paymentMethod,
          gatewayOrderId: input.gatewayOrderId ?? '$gatewayOrderId',
          startDate: { $ifNull: ['$startDate', '$$NOW'] },
          endDate: {
            $dateAdd: {
              startDate: { $max: [{ $ifNull: ['$endDate', '$$NOW'] }, '$$NOW'] },
              unit: input.billingInterval === 'year' ? 'year' : 'month',
              amount: 1,
            },
          },
        },
      },
    ],
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
    id: idStr(doc._id),
    tenantId: idStr(doc.tenantId),
    userId: idStr(doc.userId),
    type: doc.type,
    amountCents: doc.amountCents,
    currency: doc.currency,
    planName: doc.planName,
    occurredAt: isoStr(doc.occurredAt),
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
