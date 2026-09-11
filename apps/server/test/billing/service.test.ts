import { describe, it, expect, vi, beforeEach } from 'vitest';

const findMemberByIdInTenant = vi.fn();
vi.mock('../../src/modules/trainer/repository.js', () => ({ findMemberByIdInTenant }));

const extendMembershipAtomic = vi.fn();
const recordPaymentEvent = vi.fn();
const findPlanById = vi.fn();
vi.mock('../../src/modules/billing/repository.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/modules/billing/repository.js')>();
  return { ...actual, extendMembershipAtomic, recordPaymentEvent, findPlanById };
});

const verifyCashPaymentOtp = vi.fn();
vi.mock('../../src/lib/cashPaymentOtp.js', () => ({ issueCashPaymentOtp: vi.fn(), verifyCashPaymentOtp }));

const toE164 = vi.fn((phone: string) => phone);
vi.mock('../../src/lib/phone.js', () => ({ toE164 }));

const sendSms = vi.fn();
vi.mock('../../src/lib/sms.js', () => ({ sendSms }));

const sendPushToUser = vi.fn();
vi.mock('../../src/lib/push.js', () => ({ sendPushToUser }));

const verifyWebhookSignature = vi.fn();
const createOrder = vi.fn();
vi.mock('../../src/lib/cashfree.js', () => ({
  isConfigured: vi.fn(),
  createOrder,
  getOrderStatus: vi.fn(),
  verifyWebhookSignature,
}));

const cfOrderFindOneAndUpdate = vi.fn();
const cfOrderCreate = vi.fn();
vi.mock('../../src/db/models/CashfreeOrder.js', () => ({
  CashfreeOrderModel: { findOneAndUpdate: cfOrderFindOneAndUpdate, create: cfOrderCreate },
}));

const {
  deriveSubscriptionStatus,
  isAccessBlocked,
  confirmCashPayment,
  handleCashfreeWebhook,
  createCheckoutSessionForMember,
} = await import('../../src/modules/billing/service.js');

describe('deriveSubscriptionStatus', () => {
  it('is expired when there is no status at all', () => {
    expect(deriveSubscriptionStatus(undefined, undefined)).toBe('expired');
  });

  it('is expired for expired/cancelled status regardless of paymentStatus', () => {
    expect(deriveSubscriptionStatus('expired', 'paid')).toBe('expired');
    expect(deriveSubscriptionStatus('cancelled', 'paid')).toBe('expired');
  });

  it('is expired when paymentStatus is overdue, even if status is active', () => {
    expect(deriveSubscriptionStatus('active', 'overdue')).toBe('expired');
  });

  it('is pending for incomplete/paused status or a due payment', () => {
    expect(deriveSubscriptionStatus('incomplete', 'paid')).toBe('pending');
    expect(deriveSubscriptionStatus('paused', 'paid')).toBe('pending');
    expect(deriveSubscriptionStatus('active', 'due')).toBe('pending');
  });

  it('is active for an active status with paid or comp payment', () => {
    expect(deriveSubscriptionStatus('active', 'paid')).toBe('active');
    expect(deriveSubscriptionStatus('active', 'comp')).toBe('active');
  });
});

describe('isAccessBlocked', () => {
  it('never blocks a membership with no endDate (e.g. still incomplete)', () => {
    expect(isAccessBlocked({ paymentStatus: 'due', endDate: undefined }, 7)).toBe(false);
  });

  it('never blocks when paymentStatus is paid or comp, regardless of endDate', () => {
    const longExpired = new Date(Date.now() - 365 * 86400000);
    expect(isAccessBlocked({ paymentStatus: 'paid', endDate: longExpired }, 7)).toBe(false);
    expect(isAccessBlocked({ paymentStatus: 'comp', endDate: longExpired }, 7)).toBe(false);
  });

  it('does not block within the grace period after endDate', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000);
    expect(isAccessBlocked({ paymentStatus: 'due', endDate: threeDaysAgo }, 7)).toBe(false);
  });

  it('blocks once the grace period has fully elapsed', () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 86400000);
    expect(isAccessBlocked({ paymentStatus: 'due', endDate: tenDaysAgo }, 7)).toBe(true);
  });

  it('blocks immediately on expiry when gracePeriodDays is 0', () => {
    const yesterday = new Date(Date.now() - 86400000);
    expect(isAccessBlocked({ paymentStatus: 'overdue', endDate: yesterday }, 0)).toBe(true);
  });
});

describe('recordSuccessfulPayment branching (via its two real callers)', () => {
  const MEMBER = { _id: { toString: () => 'member-1' }, phone: '+919876543210', email: 'm@x.com' };

  beforeEach(() => {
    vi.clearAllMocks();
    findMemberByIdInTenant.mockResolvedValue(MEMBER);
    extendMembershipAtomic.mockResolvedValue({});
  });

  it('cash payment (via confirmCashPayment): logs a marked_paid event, not checkout_completed', async () => {
    verifyCashPaymentOtp.mockResolvedValue({});

    await confirmCashPayment('tenant-1', 'member-1', {
      code: '123456',
      planName: 'Monthly',
      amountCents: 150000,
      currency: 'inr',
      billingInterval: 'month',
    });

    expect(extendMembershipAtomic).toHaveBeenCalledWith(
      'member-1',
      expect.objectContaining({ paymentMethod: 'cash', paymentStatus: 'paid' }),
    );
    expect(recordPaymentEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'marked_paid' }));
  });

  it('online payment (via handleCashfreeWebhook): logs a checkout_completed event, extends the right membership, and never double-credits a duplicate webhook delivery', async () => {
    verifyWebhookSignature.mockReturnValue({
      type: 'PAYMENT_SUCCESS_WEBHOOK',
      data: { order: { cf_order_id: 'cf-order-1' } },
    });
    findPlanById.mockResolvedValue({ name: 'Monthly', billingInterval: 'month' });
    // First delivery: the atomic created->paid transition succeeds.
    cfOrderFindOneAndUpdate.mockResolvedValueOnce({
      tenantId: { toString: () => 'tenant-1' },
      userId: { toString: () => 'member-1' },
      planId: { toString: () => 'plan-1' },
      amountCents: 150000,
      currency: 'inr',
    });

    await handleCashfreeWebhook('{}', 'sig', '123');

    expect(extendMembershipAtomic).toHaveBeenCalledWith(
      'member-1',
      expect.objectContaining({ paymentMethod: 'online', gatewayOrderId: 'cf-order-1' }),
    );
    expect(recordPaymentEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'checkout_completed' }));

    // Second delivery of the SAME webhook (gateways retry) - the atomic filter no longer matches
    // (status is already 'paid'), so findOneAndUpdate returns null and no side effects re-fire.
    vi.clearAllMocks();
    cfOrderFindOneAndUpdate.mockResolvedValueOnce(null);
    verifyWebhookSignature.mockReturnValue({
      type: 'PAYMENT_SUCCESS_WEBHOOK',
      data: { order: { cf_order_id: 'cf-order-1' } },
    });

    await handleCashfreeWebhook('{}', 'sig', '123');

    expect(extendMembershipAtomic).not.toHaveBeenCalled();
    expect(recordPaymentEvent).not.toHaveBeenCalled();
  });

  it('ignores webhook payloads that are not a payment-success event', async () => {
    verifyWebhookSignature.mockReturnValue({ type: 'PAYMENT_FAILED_WEBHOOK', data: {} });

    await handleCashfreeWebhook('{}', 'sig', '123');

    expect(cfOrderFindOneAndUpdate).not.toHaveBeenCalled();
    expect(extendMembershipAtomic).not.toHaveBeenCalled();
  });
});

describe('createCheckoutSessionForMember', () => {
  const MEMBER = { _id: { toString: () => 'member-1' }, phone: '+919876543210', email: 'm@x.com' };
  const CONFIG = { CASHFREE_RETURN_URL: 'https://default-return.example.com', WEB_APP_BASE_URL: 'https://app.example.com', CASHFREE_ENV: 'sandbox' as const };

  beforeEach(() => {
    vi.clearAllMocks();
    findMemberByIdInTenant.mockResolvedValue(MEMBER);
    findPlanById.mockResolvedValue({ priceCents: 150000, currency: 'inr' });
    createOrder.mockResolvedValue({ cfOrderId: 'cf-1', paymentSessionId: 'session-abc' });
  });

  it('builds a checkout URL pointing at this app\'s own SDK-loading page, not a Cashfree URL - Cashfree has no plain-URL redirect', async () => {
    const result = await createCheckoutSessionForMember('tenant-1', 'member-1', 'plan-1', CONFIG);

    expect(result.checkoutUrl).toBe('https://app.example.com/billing/checkout?session=session-abc&mode=sandbox');
  });

  it('passes the mobile-provided return URL through to Cashfree instead of the server default', async () => {
    await createCheckoutSessionForMember('tenant-1', 'member-1', 'plan-1', CONFIG, 'barbellix://payment-return');

    expect(createOrder).toHaveBeenCalledWith(expect.objectContaining({ returnUrl: 'barbellix://payment-return' }));
  });

  it('falls back to the server-configured return URL when the caller does not provide one', async () => {
    await createCheckoutSessionForMember('tenant-1', 'member-1', 'plan-1', CONFIG);

    expect(createOrder).toHaveBeenCalledWith(expect.objectContaining({ returnUrl: 'https://default-return.example.com' }));
  });
});
