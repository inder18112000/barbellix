import { describe, it, expect, vi, beforeEach } from 'vitest';

const create = vi.fn();
const findOneAndUpdate = vi.fn();

vi.mock('../../src/db/models/PasswordResetToken.js', () => ({
  PasswordResetTokenModel: { create, findOneAndUpdate },
}));

const { issuePasswordResetToken, redeemPasswordResetToken } = await import('../../src/lib/passwordResetToken.js');

const USER_ID = { toString: () => '507f1f77bcf86cd799439011' } as any;

describe('lib/passwordResetToken.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('issuePasswordResetToken() stores a hash, not the raw token, and returns the raw token to the caller', async () => {
    create.mockResolvedValue({});

    const { token, expiresAt } = await issuePasswordResetToken(USER_ID);

    expect(token).toMatch(/^[0-9a-f]{64}$/); // randomBytes(32).toString('hex')
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: USER_ID, expiresAt: expect.any(Date) }),
    );
    const storedHash = create.mock.calls[0]![0].tokenHash;
    expect(storedHash).not.toBe(token);
    expect(storedHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('redeemPasswordResetToken() looks up by hash, only among unused/unexpired tokens, and returns null when not found', async () => {
    findOneAndUpdate.mockResolvedValue(null);

    const result = await redeemPasswordResetToken('some-token');

    expect(result).toBeNull();
    const [filter, update] = findOneAndUpdate.mock.calls[0]!;
    expect(filter).toMatchObject({ usedAt: null });
    expect(filter.expiresAt.$gt).toBeInstanceOf(Date);
    expect(filter.tokenHash).not.toBe('some-token');
    expect(update).toEqual({ $set: { usedAt: expect.any(Date) } });
  });

  it('redeemPasswordResetToken() returns the redeemed document when the token is valid', async () => {
    const doc = { userId: USER_ID };
    findOneAndUpdate.mockResolvedValue(doc);

    const result = await redeemPasswordResetToken('some-token');

    expect(result).toBe(doc);
  });
});
