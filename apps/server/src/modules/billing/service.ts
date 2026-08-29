import { randomUUID } from 'node:crypto';
import type { MembershipStatus, PaymentStatus, SubscriptionStatus } from '@barbellix/shared';
import type { Env } from '../../config/env.js';
import { NotFoundError, ValidationError } from '../../lib/errors.js';
import * as cashfreeLib from '../../lib/cashfree.js';
import { toE164 } from '../../lib/phone.js';
import { sendSms } from '../../lib/sms.js';
import { issueCashPaymentOtp, verifyCashPaymentOtp } from '../../lib/cashPaymentOtp.js';
import { sendPushToUser } from '../../lib/push.js';
import { CashfreeOrderModel } from '../../db/models/CashfreeOrder.js';
import { findMemberByIdInTenant } from '../trainer/repository.js';
import * as repo from './repository.js';

/** Simplified 3-state traffic-light view of status+paymentStatus, for client-facing display. */
export function deriveSubscriptionStatus(status?: MembershipStatus, paymentStatus?: PaymentStatus): SubscriptionStatus {
  if (!status) return 'expired';
  if (status === 'expired' || status === 'cancelled' || paymentStatus === 'overdue') return 'expired';
  if (status === 'incomplete' || status === 'paused' || paymentStatus === 'due') return 'pending';
  return 'active';
}

/**
 * Pure function - no I/O, no scheduled job needed. Enforced lazily at the moment a member tries
 * to log in or refresh their session (see auth/service.ts), not by a background process that
 * proactively suspends accounts. This is a deliberate architectural choice: it's always correct
 * at the instant it's checked (no "the cron hasn't run yet" staleness window), it needs no new
 * server infrastructure, and "access restored after payment" falls out for free - the very next
 * check after a webhook updates paymentStatus/endDate just naturally passes again.
 */
export function isAccessBlocked(
  membership: { paymentStatus: PaymentStatus; endDate?: Date } | null | undefined,
  gracePeriodDays: number,
): boolean {
  if (!membership?.endDate) return false;
  if (membership.paymentStatus === 'paid' || membership.paymentStatus === 'comp') return false;

  const graceEnd = new Date(membership.endDate);
  graceEnd.setUTCDate(graceEnd.getUTCDate() + gracePeriodDays);
  return new Date() > graceEnd;
}

// ─── Plans ────────────────────────────────────────────────────────────────────

export async function listPlans(tenantId: string) {
  const docs = await repo.findPlansByTenant(tenantId);
  return docs.map(repo.toDomainPlan);
}

/** Member-facing plan list for the mobile "pay now" flow - active plans only, unlike the admin
 * listPlans() above which shows every plan (including inactive ones, so admin can still see and
 * reactivate them). */
export async function listActivePlans(tenantId: string) {
  const plans = await listPlans(tenantId);
  return plans.filter((p) => p.active);
}

function toMembershipSummary(doc: Awaited<ReturnType<typeof repo.findMembershipByUserId>> | undefined) {
  if (!doc) return {};
  return {
    plan: doc.planName,
    status: doc.status,
    paymentStatus: doc.paymentStatus,
    paymentMethod: doc.paymentMethod,
    subscriptionStatus: deriveSubscriptionStatus(doc.status, doc.paymentStatus),
    startDate: doc.startDate?.toISOString(),
    endDate: doc.endDate?.toISOString(),
    lastPaymentReminderAt: doc.lastPaymentReminderAt?.toISOString(),
  };
}

/** Lightweight lookup for embedding into other rosters (e.g. the trainer/admin member list) - a member with no Membership doc yet just shows as unset, not an error. */
export async function getMembershipSummary(userId: string) {
  const doc = await repo.findMembershipByUserId(userId);
  return toMembershipSummary(doc);
}

/** Batched sibling of getMembershipSummary - one query for every member's membership instead of
 * one per member (see trainer/service.ts's listMembers), reusing the exact same summary shape. */
export async function getMembershipSummariesForUsers(userIds: string[]) {
  const docsByUser = await repo.findMembershipsByUserIds(userIds);
  const summaries = new Map<string, ReturnType<typeof toMembershipSummary>>();
  for (const userId of userIds) {
    summaries.set(userId, toMembershipSummary(docsByUser.get(userId)));
  }
  return summaries;
}

export async function getMembershipCounts(tenantId: string) {
  return repo.getMembershipCounts(tenantId);
}

export async function updateMembershipDates(tenantId: string, memberId: string, input: { startDate?: string; endDate?: string }) {
  const member = await findMemberByIdInTenant(memberId, tenantId);
  if (!member) throw new NotFoundError('Member not found');

  // upsertMembership's $setOnInsert doesn't cover the required `planName` field, so creating a
  // membership from scratch here (rather than updating dates on an existing one) would fail
  // Mongoose validation with a confusing error - give a clear one instead.
  const existing = await repo.findMembershipByUserId(memberId);
  if (!existing) throw new NotFoundError('This member has no membership yet - send a checkout link or mark them as paid first');

  const updates: Record<string, unknown> = {};
  if (input.startDate) updates.startDate = new Date(input.startDate);
  if (input.endDate) updates.endDate = new Date(input.endDate);

  const doc = await repo.upsertMembership(memberId, { tenantId, ...updates });
  return repo.toDomainMembership(doc);
}

interface CreatePlanInput {
  name: string;
  description?: string;
  priceCents: number;
  currency?: string;
  billingInterval: 'month' | 'year';
}

export async function createPlan(tenantId: string, input: CreatePlanInput) {
  // No provider-side product/price object needed for Cashfree's Orders API (unlike Stripe) -
  // an order references the plan's priceCents/currency directly at checkout time, so plan
  // creation is now pure local data with no external API call at all.
  const doc = await repo.createPlan({
    tenantId,
    name: input.name,
    description: input.description,
    priceCents: input.priceCents,
    currency: input.currency ?? 'inr',
    billingInterval: input.billingInterval,
  });

  return repo.toDomainPlan(doc);
}

interface UpdatePlanInput {
  name?: string;
  description?: string;
  active?: boolean;
  priceCents?: number;
  billingInterval?: 'month' | 'year';
}

export async function updatePlan(tenantId: string, planId: string, input: UpdatePlanInput) {
  const existing = await repo.findPlanById(planId, tenantId);
  if (!existing) throw new NotFoundError('Membership plan not found');

  const updates: Record<string, unknown> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.description !== undefined) updates.description = input.description;
  if (input.active !== undefined) updates.active = input.active;
  if (input.priceCents !== undefined) updates.priceCents = input.priceCents;
  if (input.billingInterval !== undefined) updates.billingInterval = input.billingInterval;

  const updated = await repo.updatePlan(planId, tenantId, updates);
  if (!updated) throw new NotFoundError('Membership plan not found');
  return repo.toDomainPlan(updated);
}

// ─── Shared payment-recording core ─────────────────────────────────────────────

/**
 * The single place both the Cashfree webhook path and the cash-OTP confirm path fund a
 * successful payment through - see repository.ts's extendMembershipAtomic() for why this must
 * never be a read-then-write in application code (a member paying online at the same moment an
 * admin confirms a cash payment for them must never let one payment's credit silently vanish).
 */
async function recordSuccessfulPayment(
  tenantId: string,
  memberId: string,
  input: {
    planId?: string;
    planName: string;
    amountCents: number;
    currency: string;
    method: 'online' | 'cash';
    billingInterval: 'month' | 'year';
    gatewayOrderId?: string;
  },
) {
  await repo.extendMembershipAtomic(memberId, {
    tenantId,
    planId: input.planId,
    planName: input.planName,
    paymentStatus: 'paid' as PaymentStatus,
    paymentMethod: input.method,
    billingInterval: input.billingInterval,
    gatewayOrderId: input.gatewayOrderId,
  });

  await repo.recordPaymentEvent({
    tenantId,
    userId: memberId,
    type: input.method === 'online' ? 'checkout_completed' : 'marked_paid',
    amountCents: input.amountCents,
    currency: input.currency,
    planName: input.planName,
  });
}

// ─── Member-facing membership actions ──────────────────────────────────────────

/** Used both by the admin "send checkout link" action and the member's own self-service "pay
 * now" - memberId is the caller's own id in the self-service case, someone else's in the admin
 * case, but the logic (and security boundary: member's email/phone looked up server-side, never
 * trusted from the request) is identical either way. */
export async function createCheckoutSessionForMember(
  tenantId: string,
  memberId: string,
  planId: string,
  config: Pick<Env, 'CASHFREE_RETURN_URL'>,
  returnUrlOverride?: string,
) {
  const member = await findMemberByIdInTenant(memberId, tenantId);
  if (!member) throw new NotFoundError('Member not found');

  const plan = await repo.findPlanById(planId, tenantId);
  if (!plan) throw new NotFoundError('Membership plan not found');

  const customerPhoneE164 = toE164(member.phone);
  const orderId = `membership-${randomUUID()}`;

  const order = await cashfreeLib.createOrder({
    orderId,
    amountCents: plan.priceCents,
    currency: plan.currency,
    customerId: memberId,
    customerEmail: member.email,
    customerPhoneE164,
    returnUrl: returnUrlOverride ?? config.CASHFREE_RETURN_URL,
    tags: { userId: memberId, tenantId, planId },
  });

  await CashfreeOrderModel.create({
    tenantId,
    userId: memberId,
    planId,
    cashfreeOrderId: order.cfOrderId,
    paymentSessionId: order.paymentSessionId,
    amountCents: plan.priceCents,
    currency: plan.currency,
    status: 'created',
  });

  return { checkoutUrl: order.checkoutUrl };
}

/** Admin override with no member-side confirmation at all - kept deliberately separate from the
 * OTP-confirmed cash-payment flow below (see billing/service.ts's confirmCashPayment): needed for
 * genuine comps (no real payment occurred, so there's nothing to OTP-confirm) and the rare case
 * where a member's phone can't receive SMS. */
export async function markPaid(tenantId: string, memberId: string, planName: string) {
  const doc = await repo.upsertMembership(memberId, {
    tenantId,
    planName,
    status: 'active' as MembershipStatus,
    paymentStatus: 'comp' as PaymentStatus,
    paymentMethod: 'cash',
  });
  await repo.recordPaymentEvent({ tenantId, userId: memberId, type: 'marked_paid', planName });
  return repo.toDomainMembership(doc);
}

/** Never exposes the actual key - only whether one is configured - so the web Settings page can
 * show real status without the UI (or its network tab) ever seeing a secret. */
export function getPaymentGatewayStatus() {
  return { cashfreeConfigured: cashfreeLib.isConfigured() };
}

export async function getPaymentHistory(tenantId: string, memberId: string) {
  const member = await findMemberByIdInTenant(memberId, tenantId);
  if (!member) throw new NotFoundError('Member not found');

  const docs = await repo.findPaymentEventsByUser(memberId);
  return docs.map(repo.toDomainPaymentEvent);
}

/** Lightweight self-service lookup for the mobile app to poll after returning from a hosted
 * checkout - the webhook, not the browser redirect, is the actual source of truth for whether a
 * payment succeeded, so the client polls this rather than trusting redirect query params.
 * Includes the derived subscriptionStatus (not part of the stored Membership document) so the
 * client doesn't need to duplicate deriveSubscriptionStatus()'s logic itself. */
export async function getMembershipForSelf(userId: string) {
  const doc = await repo.findMembershipByUserId(userId);
  if (!doc) return null;

  const membership = repo.toDomainMembership(doc);
  return { ...membership, subscriptionStatus: deriveSubscriptionStatus(doc.status, doc.paymentStatus) };
}

// ─── Cash-payment OTP confirmation ─────────────────────────────────────────────

export async function initiateCashPayment(
  tenantId: string,
  memberId: string,
  initiatedByAdminId: string,
  input: { planId?: string; planName: string; amountCents: number; currency: string },
) {
  const member = await findMemberByIdInTenant(memberId, tenantId);
  if (!member) throw new NotFoundError('Member not found');

  const phoneE164 = toE164(member.phone);

  const { code, expiresAt } = await issueCashPaymentOtp({
    tenantId,
    memberId,
    initiatedByAdminId,
    amountCents: input.amountCents,
    currency: input.currency,
    planId: input.planId,
    planName: input.planName,
  });

  await sendSms(phoneE164, `Your BarBellix payment code is ${code}. Give this to the front desk to confirm your payment. Expires in 10 minutes.`);

  return { expiresAt: expiresAt.toISOString() };
}

export async function confirmCashPayment(
  tenantId: string,
  memberId: string,
  input: { code: string; planId?: string; planName: string; amountCents: number; currency: string; billingInterval: 'month' | 'year' },
) {
  const member = await findMemberByIdInTenant(memberId, tenantId);
  if (!member) throw new NotFoundError('Member not found');

  await verifyCashPaymentOtp({ memberId, amountCents: input.amountCents, code: input.code });

  await recordSuccessfulPayment(tenantId, memberId, {
    planId: input.planId,
    planName: input.planName,
    amountCents: input.amountCents,
    currency: input.currency,
    method: 'cash',
    billingInterval: input.billingInterval,
  });

  return { success: true };
}

// ─── Payment reminders ──────────────────────────────────────────────────────────

const PAYMENT_REMINDER_COOLDOWN_HOURS = 6;

export async function sendPaymentReminder(tenantId: string, memberId: string) {
  const member = await findMemberByIdInTenant(memberId, tenantId);
  if (!member) throw new NotFoundError('Member not found');

  const membership = await repo.findMembershipByUserId(memberId);
  if (!membership) throw new NotFoundError('This member has no membership to remind them about');

  if (membership.lastPaymentReminderAt) {
    const cooldownEnds = new Date(membership.lastPaymentReminderAt);
    cooldownEnds.setUTCHours(cooldownEnds.getUTCHours() + PAYMENT_REMINDER_COOLDOWN_HOURS);
    if (new Date() < cooldownEnds) {
      throw new ValidationError(`Already reminded recently - wait until ${cooldownEnds.toISOString()} to send another`);
    }
  }

  // Deliberately bypasses NotificationPreferences - this is a one-off, admin-initiated message
  // about money owed, not an automated recurring nudge a member should be able to silence via a
  // toggle meant for streak alerts/tips.
  await sendPushToUser(memberId, {
    title: 'Payment due',
    body: `Your ${membership.planName} membership payment is due. Pay in the app or visit the front desk.`,
    data: { type: 'payment_reminder' },
  });

  const doc = await repo.upsertMembership(memberId, { tenantId, lastPaymentReminderAt: new Date() });
  return repo.toDomainMembership(doc);
}

// ─── Webhook handling ───────────────────────────────────────────────────────────

interface CashfreeWebhookPayload {
  type?: string;
  data?: {
    order?: {
      order_id?: string;
      cf_order_id?: string;
      order_amount?: number;
      order_currency?: string;
    };
    payment?: {
      payment_status?: string;
    };
  };
}

export async function handleCashfreeWebhook(rawBody: string, signature: string, timestamp: string): Promise<void> {
  const payload = cashfreeLib.verifyWebhookSignature(rawBody, signature, timestamp) as CashfreeWebhookPayload;

  if (payload.type !== 'PAYMENT_SUCCESS_WEBHOOK') return;

  const cfOrderId = payload.data?.order?.cf_order_id;
  if (!cfOrderId) return;

  // Atomic created->paid transition - a null result means this cf_order_id is already 'paid' (or
  // 'failed'/'cancelled'), i.e. a duplicate webhook delivery (gateways retry on timeout/failure) -
  // skip re-applying the payment side effects rather than double-crediting the membership.
  const order = await CashfreeOrderModel.findOneAndUpdate(
    { cashfreeOrderId: cfOrderId, status: 'created' },
    { $set: { status: 'paid' } },
    { new: true },
  );
  if (!order) return;

  const plan = order.planId ? await repo.findPlanById(order.planId.toString(), order.tenantId.toString()) : null;

  await recordSuccessfulPayment(order.tenantId.toString(), order.userId.toString(), {
    planId: order.planId?.toString(),
    planName: plan?.name ?? 'Membership',
    amountCents: order.amountCents,
    currency: order.currency,
    method: 'online',
    billingInterval: plan?.billingInterval ?? 'month',
    gatewayOrderId: cfOrderId,
  });
}
