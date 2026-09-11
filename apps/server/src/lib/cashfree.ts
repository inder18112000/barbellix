import { Cashfree, CFEnvironment, type CreateOrderRequest } from 'cashfree-pg';
import { AppError } from './errors.js';

export class CashfreeNotConfiguredError extends AppError {
  constructor() {
    super(503, 'Payment processing is not configured on this server');
  }
}

let client: Cashfree | null = null;

function getClient(): Cashfree | null {
  if (client) return client;
  const appId = process.env.CASHFREE_APP_ID;
  const secret = process.env.CASHFREE_SECRET_KEY;
  if (!appId || !secret) return null;

  const env = process.env.CASHFREE_ENV === 'production' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;
  client = new Cashfree(env, appId, secret);
  return client;
}

/** True once CASHFREE_APP_ID/CASHFREE_SECRET_KEY are set - lets plan CRUD/manual mark-paid stay
 * usable before Cashfree is configured, same convention as the old Stripe isConfigured(). */
export function isConfigured(): boolean {
  return getClient() !== null;
}

/**
 * Cashfree's Orders API returns only a payment_session_id, never a ready-made checkout URL -
 * confirmed against Cashfree's own docs (docs.cashfree.com/payments/online/web/redirect): their
 * hosted checkout genuinely requires loading the client-side cashfree-js SDK and calling
 * cashfree.checkout({paymentSessionId}) from a real webpage, there is no plain-URL redirect
 * pattern for a server-only integration. See apps/web/src/pages/billing/CheckoutRedirectPage.tsx,
 * which is that webpage - billing/service.ts builds a URL pointing at it (not at Cashfree
 * directly) from the paymentSessionId this function returns.
 */
export async function createOrder(input: {
  orderId: string;
  amountCents: number;
  currency: string;
  customerId: string;
  customerEmail: string;
  customerPhoneE164: string;
  returnUrl: string;
  tags?: Record<string, string>;
}): Promise<{ cfOrderId: string; paymentSessionId: string }> {
  const cashfree = getClient();
  if (!cashfree) throw new CashfreeNotConfiguredError();

  const request: CreateOrderRequest = {
    order_id: input.orderId,
    // Cashfree's order_amount is a decimal amount (e.g. rupees, paisa as the 2nd decimal place),
    // not the integer-cents convention used everywhere else in this codebase - this is the only
    // place that conversion should happen.
    order_amount: input.amountCents / 100,
    order_currency: input.currency.toUpperCase(),
    customer_details: {
      customer_id: input.customerId,
      customer_email: input.customerEmail,
      customer_phone: input.customerPhoneE164,
    },
    order_meta: {
      return_url: input.returnUrl,
    },
    order_tags: input.tags,
  };

  const response = await cashfree.PGCreateOrder(request);
  const order = response.data;
  if (!order.payment_session_id || !order.cf_order_id) {
    throw new Error('Cashfree order creation did not return a payment session');
  }

  return {
    cfOrderId: order.cf_order_id,
    paymentSessionId: order.payment_session_id,
  };
}

/** Manual reconciliation path (see billing/service.ts) - deliberately not a cron job, matches
 * this codebase's "check lazily at the instant needed" philosophy (see isAccessBlocked()). */
export async function getOrderStatus(cfOrderId: string): Promise<{ status: string }> {
  const cashfree = getClient();
  if (!cashfree) throw new CashfreeNotConfiguredError();

  const response = await cashfree.PGFetchOrder(cfOrderId);
  return { status: response.data.order_status ?? 'UNKNOWN' };
}

const WEBHOOK_TIMESTAMP_TOLERANCE_SECS = 300; // 5 minutes

/** PGVerifyWebhookSignature() throws if the signature itself doesn't match the body+timestamp,
 * but doesn't by itself guarantee the timestamp is recent - a captured, valid webhook payload
 * could otherwise be replayed indefinitely. That freshness check is added here explicitly. */
export function verifyWebhookSignature(rawBody: string, signature: string, timestamp: string): unknown {
  const cashfree = getClient();
  if (!cashfree) throw new CashfreeNotConfiguredError();

  const event = cashfree.PGVerifyWebhookSignature(signature, rawBody, timestamp);

  const tsSeconds = Number(timestamp);
  if (!Number.isFinite(tsSeconds) || Math.abs(Date.now() / 1000 - tsSeconds) > WEBHOOK_TIMESTAMP_TOLERANCE_SECS) {
    throw new Error('Webhook timestamp is stale - possible replay');
  }

  return event.object;
}
