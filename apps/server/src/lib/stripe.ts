import Stripe from 'stripe';
import { AppError } from './errors.js';

class StripeNotConfiguredError extends AppError {
  constructor() {
    super(503, 'Payment processing is not configured on this server');
  }
}

let client: Stripe | null = null;

function getClient(): Stripe | null {
  if (client) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  client = new Stripe(key);
  return client;
}

/** True once STRIPE_SECRET_KEY is set - lets plan CRUD stay usable (minus real Stripe ids) before Stripe is configured. */
export function isConfigured(): boolean {
  return getClient() !== null;
}

export async function createProduct(name: string, description?: string) {
  const stripe = getClient();
  if (!stripe) return null;
  return stripe.products.create({ name, description });
}

export async function createPrice(input: {
  productId: string;
  priceCents: number;
  currency: string;
  interval: 'month' | 'year';
}) {
  const stripe = getClient();
  if (!stripe) return null;
  return stripe.prices.create({
    product: input.productId,
    unit_amount: input.priceCents,
    currency: input.currency,
    recurring: { interval: input.interval },
  });
}

export async function archivePrice(priceId: string) {
  const stripe = getClient();
  if (!stripe) return;
  await stripe.prices.update(priceId, { active: false });
}

export async function createCheckoutSession(input: {
  priceId: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
}) {
  const stripe = getClient();
  if (!stripe) throw new StripeNotConfiguredError();

  return stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: input.priceId, quantity: 1 }],
    customer_email: input.customerEmail,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata: input.metadata,
  });
}

// constructEvent() is pure HMAC verification against webhookSecret - it never calls the Stripe
// API, so it works even without a real STRIPE_SECRET_KEY. The Stripe SDK still requires *an*
// instance to reach .webhooks, so this falls back to a throwaway one when no real client exists.
const webhookOnlyClient = new Stripe('sk_test_unused_webhook_verification_only');

/** Throws if the signature doesn't verify - callers must not act on an unverified event. */
export function constructWebhookEvent(rawBody: Buffer, signature: string, webhookSecret: string): Stripe.Event {
  const stripe = getClient() ?? webhookOnlyClient;
  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
}
