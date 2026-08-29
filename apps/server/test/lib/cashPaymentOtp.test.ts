import { createHash } from 'node:crypto';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ValidationError, NotFoundError } from '../../src/lib/errors.js';

const create = vi.fn();
const findOne = vi.fn();
const findOneAndUpdate = vi.fn();

vi.mock('../../src/db/models/CashPaymentOtp.js', () => ({
  CashPaymentOtpModel: { create, findOne, findOneAndUpdate },
}));

const { verifyCashPaymentOtp } = await import('../../src/lib/cashPaymentOtp.js');

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

const MEMBER_ID = '507f1f77bcf86cd799439011';
const AMOUNT_CENTS = 150000;
const REAL_CODE = '482913';

function makePendingDoc(overrides: Partial<{ codeHash: string; attempts: number }> = {}) {
  const doc = {
    _id: 'otp-doc-1',
    codeHash: hashCode(REAL_CODE),
    attempts: 0,
    usedAt: null,
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  return doc;
}

describe('verifyCashPaymentOtp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws NotFoundError when there is no pending OTP for this member+amount', async () => {
    findOne.mockReturnValue({ sort: vi.fn().mockResolvedValue(null) });

    await expect(verifyCashPaymentOtp({ memberId: MEMBER_ID, amountCents: AMOUNT_CENTS, code: REAL_CODE })).rejects.toThrow(
      NotFoundError,
    );
  });

  it('redeems atomically and succeeds when the code matches', async () => {
    const pending = makePendingDoc();
    findOne.mockReturnValue({ sort: vi.fn().mockResolvedValue(pending) });
    findOneAndUpdate.mockResolvedValue({ ...pending, usedAt: new Date() });

    const result = await verifyCashPaymentOtp({ memberId: MEMBER_ID, amountCents: AMOUNT_CENTS, code: REAL_CODE });

    expect(findOneAndUpdate).toHaveBeenCalledWith(
      { _id: pending._id, usedAt: null },
      { $set: { usedAt: expect.any(Date) } },
      { new: true },
    );
    expect(result.usedAt).toBeTruthy();
  });

  it('increments attempts without consuming the OTP when the code is wrong', async () => {
    const pending = makePendingDoc();
    findOne.mockReturnValue({ sort: vi.fn().mockResolvedValue(pending) });

    await expect(verifyCashPaymentOtp({ memberId: MEMBER_ID, amountCents: AMOUNT_CENTS, code: '000000' })).rejects.toThrow(
      ValidationError,
    );

    expect(pending.attempts).toBe(1);
    expect(pending.save).toHaveBeenCalled();
    expect(findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('voids the OTP after 5 wrong attempts, forcing a fresh code', async () => {
    const pending = makePendingDoc({ attempts: 4 });
    findOne.mockReturnValue({ sort: vi.fn().mockResolvedValue(pending) });

    await expect(verifyCashPaymentOtp({ memberId: MEMBER_ID, amountCents: AMOUNT_CENTS, code: '000000' })).rejects.toThrow(
      'Too many incorrect attempts - request a new code',
    );

    expect(pending.attempts).toBe(5);
    expect(pending.usedAt).toBeInstanceOf(Date);
    expect(pending.save).toHaveBeenCalled();
  });

  it('rejects a code that was already redeemed even if it matches (concurrent-confirm race)', async () => {
    const pending = makePendingDoc();
    findOne.mockReturnValue({ sort: vi.fn().mockResolvedValue(pending) });
    // Simulates another request winning the atomic redeem first.
    findOneAndUpdate.mockResolvedValue(null);

    await expect(verifyCashPaymentOtp({ memberId: MEMBER_ID, amountCents: AMOUNT_CENTS, code: REAL_CODE })).rejects.toThrow(
      'This code was already used or has expired - request a new code',
    );
  });
});
