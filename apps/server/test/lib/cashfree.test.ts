import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const PGCreateOrder = vi.fn();
const PGFetchOrder = vi.fn();
const PGVerifyWebhookSignature = vi.fn();

vi.mock('cashfree-pg', () => ({
  CFEnvironment: { SANDBOX: 1, PRODUCTION: 2 },
  Cashfree: vi.fn().mockImplementation(() => ({ PGCreateOrder, PGFetchOrder, PGVerifyWebhookSignature })),
}));

const ORIGINAL_ENV = { ...process.env };

// lib/cashfree.ts caches its client in a module-level `let client` the first time
// CASHFREE_APP_ID/CASHFREE_SECRET_KEY are read as present - vi.resetModules() + a fresh dynamic
// import per test is required to observe both the "unconfigured" and "configured" states in the
// same file, since a plain top-level import would only ever see whichever state came first.
async function freshCashfreeModule() {
  vi.resetModules();
  return import('../../src/lib/cashfree.js');
}

describe('lib/cashfree.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('isConfigured() is false when the app id / secret key are absent', async () => {
    delete process.env.CASHFREE_APP_ID;
    delete process.env.CASHFREE_SECRET_KEY;
    const { isConfigured } = await freshCashfreeModule();

    expect(isConfigured()).toBe(false);
  });

  it('isConfigured() is true once both are set', async () => {
    process.env.CASHFREE_APP_ID = 'test-app-id';
    process.env.CASHFREE_SECRET_KEY = 'test-secret';
    const { isConfigured } = await freshCashfreeModule();

    expect(isConfigured()).toBe(true);
  });

  it('createOrder() throws CashfreeNotConfiguredError when unconfigured, without calling the SDK', async () => {
    delete process.env.CASHFREE_APP_ID;
    delete process.env.CASHFREE_SECRET_KEY;
    const { createOrder, CashfreeNotConfiguredError } = await freshCashfreeModule();

    await expect(
      createOrder({
        orderId: 'order-1', amountCents: 150000, currency: 'inr',
        customerId: 'member-1', customerEmail: 'm@x.com', customerPhoneE164: '+919876543210',
        returnUrl: 'https://example.com/return',
      }),
    ).rejects.toThrow(CashfreeNotConfiguredError);
    expect(PGCreateOrder).not.toHaveBeenCalled();
  });

  it('createOrder() converts integer cents to decimal rupees at the API boundary, and nowhere else', async () => {
    process.env.CASHFREE_APP_ID = 'test-app-id';
    process.env.CASHFREE_SECRET_KEY = 'test-secret';
    process.env.CASHFREE_ENV = 'sandbox';
    PGCreateOrder.mockResolvedValue({ data: { cf_order_id: 'cf-1', payment_session_id: 'session-abc' } });
    const { createOrder } = await freshCashfreeModule();

    // 150000 cents (integer) -> 1500.00 rupees (decimal) - this is the one conversion this whole
    // integration does; getting it wrong by a factor of 100 is the easiest bug to introduce here.
    await createOrder({
      orderId: 'order-1', amountCents: 150000, currency: 'inr',
      customerId: 'member-1', customerEmail: 'm@x.com', customerPhoneE164: '+919876543210',
      returnUrl: 'https://example.com/return',
    });

    expect(PGCreateOrder).toHaveBeenCalledWith(
      expect.objectContaining({ order_amount: 1500, order_currency: 'INR' }),
    );
  });

  it('createOrder() returns only cfOrderId/paymentSessionId - no fabricated checkout URL', async () => {
    // Cashfree's hosted checkout requires their client-side JS SDK (confirmed against Cashfree's
    // own docs) - there is no plain-URL redirect pattern, so this function must not invent one.
    // The actual checkout URL (pointing at this app's own SDK-loading page) is built one layer up,
    // in billing/service.ts's createCheckoutSessionForMember().
    process.env.CASHFREE_APP_ID = 'test-app-id';
    process.env.CASHFREE_SECRET_KEY = 'test-secret';
    PGCreateOrder.mockResolvedValue({ data: { cf_order_id: 'cf-1', payment_session_id: 'session-abc' } });
    const { createOrder } = await freshCashfreeModule();

    const result = await createOrder({
      orderId: 'order-1', amountCents: 100, currency: 'inr',
      customerId: 'member-1', customerEmail: 'm@x.com', customerPhoneE164: '+919876543210',
      returnUrl: 'https://example.com/return',
    });

    expect(result).toEqual({ cfOrderId: 'cf-1', paymentSessionId: 'session-abc' });
  });

  it('verifyWebhookSignature() rejects a stale timestamp even if the signature itself is valid', async () => {
    process.env.CASHFREE_APP_ID = 'test-app-id';
    process.env.CASHFREE_SECRET_KEY = 'test-secret';
    PGVerifyWebhookSignature.mockReturnValue({ object: { type: 'PAYMENT_SUCCESS_WEBHOOK' } });
    const { verifyWebhookSignature } = await freshCashfreeModule();

    const staleTimestamp = String(Math.floor(Date.now() / 1000) - 600); // 10 minutes old
    expect(() => verifyWebhookSignature('{}', 'sig', staleTimestamp)).toThrow('stale');
  });

  it('verifyWebhookSignature() accepts a fresh, correctly-signed payload', async () => {
    process.env.CASHFREE_APP_ID = 'test-app-id';
    process.env.CASHFREE_SECRET_KEY = 'test-secret';
    PGVerifyWebhookSignature.mockReturnValue({ object: { type: 'PAYMENT_SUCCESS_WEBHOOK' } });
    const { verifyWebhookSignature } = await freshCashfreeModule();

    const freshTimestamp = String(Math.floor(Date.now() / 1000));
    const result = verifyWebhookSignature('{}', 'sig', freshTimestamp);

    expect(result).toEqual({ type: 'PAYMENT_SUCCESS_WEBHOOK' });
  });
});
