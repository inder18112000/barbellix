import type Stripe from 'stripe';
import type { MembershipPlan, MembershipStatus, PaymentStatus } from '@fitpulse/shared';
import type { Env } from '../../config/env.js';
import { NotFoundError, BadGatewayError } from '../../lib/errors.js';
import * as stripeLib from '../../lib/stripe.js';
import { findMemberByIdInTenant } from '../trainer/repository.js';
import * as repo from './repository.js';

// ─── Plans ────────────────────────────────────────────────────────────────────

export async function listPlans(tenantId: string): Promise<MembershipPlan[]> {
  const docs = await repo.findPlansByTenant(tenantId);
  return docs.map(repo.toDomainPlan);
}

/** Lightweight lookup for embedding into other rosters (e.g. the trainer/admin member list) - a member with no Membership doc yet just shows as unset, not an error. */
export async function getMembershipSummary(userId: string): Promise<{ plan?: string; status?: MembershipStatus; paymentStatus?: PaymentStatus }> {
  const doc = await repo.findMembershipByUserId(userId);
  if (!doc) return {};
  return { plan: doc.planName, status: doc.status, paymentStatus: doc.paymentStatus };
}

interface CreatePlanInput {
  name: string;
  description?: string;
  priceCents: number;
  currency?: string;
  billingInterval: 'month' | 'year';
}

export async function createPlan(tenantId: string, input: CreatePlanInput): Promise<MembershipPlan> {
  const currency = input.currency ?? 'usd';

  // Stripe product/price creation is best-effort: if STRIPE_SECRET_KEY isn't configured yet,
  // the plan is still created (usable for display/manual tracking) - just without real Stripe
  // ids, so checkout-session creation for it will fail clearly later rather than the whole
  // "create a plan" action being blocked on Stripe being set up first.
  const product = await stripeLib.createProduct(input.name, input.description);
  const price = product
    ? await stripeLib.createPrice({ productId: product.id, priceCents: input.priceCents, currency, interval: input.billingInterval })
    : null;

  const doc = await repo.createPlan({
    tenantId,
    name: input.name,
    description: input.description,
    priceCents: input.priceCents,
    currency,
    billingInterval: input.billingInterval,
    stripeProductId: product?.id,
    stripePriceId: price?.id,
  });

  return repo.toDomainPlan(doc);
}

interface UpdatePlanInput {
  name?: string;
  description?: string;
  active?: boolean;
  // Changing price/interval creates a new Stripe Price (Stripe prices are immutable once
  // created) and archives the old one - not a mutation of the existing price.
  priceCents?: number;
  billingInterval?: 'month' | 'year';
}

export async function updatePlan(tenantId: string, planId: string, input: UpdatePlanInput): Promise<MembershipPlan> {
  const existing = await repo.findPlanById(planId, tenantId);
  if (!existing) throw new NotFoundError('Membership plan not found');

  const updates: Record<string, unknown> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.description !== undefined) updates.description = input.description;
  if (input.active !== undefined) updates.active = input.active;

  const priceChanged = input.priceCents !== undefined || input.billingInterval !== undefined;
  if (priceChanged && existing.stripeProductId) {
    const newPrice = await stripeLib.createPrice({
      productId: existing.stripeProductId,
      priceCents: input.priceCents ?? existing.priceCents,
      currency: existing.currency,
      interval: input.billingInterval ?? existing.billingInterval,
    });
    if (newPrice) {
      if (existing.stripePriceId) await stripeLib.archivePrice(existing.stripePriceId);
      updates.stripePriceId = newPrice.id;
    }
    if (input.priceCents !== undefined) updates.priceCents = input.priceCents;
    if (input.billingInterval !== undefined) updates.billingInterval = input.billingInterval;
  } else if (priceChanged) {
    // No Stripe product exists yet (created before Stripe was configured) - just update the
    // stored numbers, there's no Stripe price to rotate.
    if (input.priceCents !== undefined) updates.priceCents = input.priceCents;
    if (input.billingInterval !== undefined) updates.billingInterval = input.billingInterval;
  }

  const updated = await repo.updatePlan(planId, tenantId, updates);
  if (!updated) throw new NotFoundError('Membership plan not found');
  return repo.toDomainPlan(updated);
}

// ─── Member-facing membership actions ──────────────────────────────────────────

export async function createCheckoutSessionForMember(
  tenantId: string,
  memberId: string,
  planId: string,
  config: Pick<Env, 'STRIPE_SUCCESS_URL' | 'STRIPE_CANCEL_URL'>,
) {
  // The member's email is looked up server-side, never trusted from the request body - a
  // checkout link must always be for the real member it claims to be for.
  const member = await findMemberByIdInTenant(memberId, tenantId);
  if (!member) throw new NotFoundError('Member not found');

  const plan = await repo.findPlanById(planId, tenantId);
  if (!plan) throw new NotFoundError('Membership plan not found');
  if (!plan.stripePriceId) throw new BadGatewayError('This plan has no associated Stripe price yet - configure Stripe and recreate the plan');

  const session = await stripeLib.createCheckoutSession({
    priceId: plan.stripePriceId,
    customerEmail: member.email,
    successUrl: config.STRIPE_SUCCESS_URL,
    cancelUrl: config.STRIPE_CANCEL_URL,
    metadata: { userId: memberId, tenantId, planId },
  });

  return { checkoutUrl: session.url };
}

export async function markPaid(tenantId: string, memberId: string, planName: string) {
  const doc = await repo.upsertMembership(memberId, {
    tenantId,
    planName,
    status: 'active' as MembershipStatus,
    paymentStatus: 'comp' as PaymentStatus,
  });
  return repo.toDomainMembership(doc);
}

// ─── Webhook handling ───────────────────────────────────────────────────────────

export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const { userId, tenantId, planId } = session.metadata ?? {};
      if (!userId || !tenantId) break; // not one of our sessions

      const plan = planId ? await repo.findPlanById(planId, tenantId) : null;

      await repo.upsertMembership(userId, {
        tenantId,
        planId: plan?._id.toString(),
        planName: plan?.name ?? 'Membership',
        status: 'active' as MembershipStatus,
        paymentStatus: 'paid' as PaymentStatus,
        stripeCustomerId: typeof session.customer === 'string' ? session.customer : session.customer?.id,
        stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : session.subscription?.id,
      });
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const membership = await repo.findMembershipByStripeSubscriptionId(subscription.id);
      if (!membership) break;

      const periodEnd = (subscription as unknown as { current_period_end?: number }).current_period_end;
      await repo.upsertMembership(membership.userId.toString(), {
        status: subscription.status === 'active' ? ('active' as MembershipStatus) : ('paused' as MembershipStatus),
        currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : undefined,
      });
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const membership = await repo.findMembershipByStripeSubscriptionId(subscription.id);
      if (!membership) break;

      await repo.upsertMembership(membership.userId.toString(), { status: 'cancelled' as MembershipStatus });
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
      if (!customerId) break;
      const membership = await repo.findMembershipByStripeCustomerId(customerId);
      if (!membership) break;

      await repo.upsertMembership(membership.userId.toString(), { paymentStatus: 'overdue' as PaymentStatus });
      break;
    }

    default:
      break;
  }
}
