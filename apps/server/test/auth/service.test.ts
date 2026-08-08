import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { ForbiddenError, UnauthorizedError } from '../../src/lib/errors.js';

const redeemPairingToken = vi.fn();
vi.mock('../../src/lib/pairingToken.js', () => ({ redeemPairingToken }));

const findUserById = vi.fn();
const toDomainUser = vi.fn();
vi.mock('../../src/modules/auth/repository.js', () => ({ findUserById, toDomainUser }));

const issueRefreshToken = vi.fn();
vi.mock('../../src/lib/refreshToken.js', () => ({
  issueRefreshToken,
  rotateRefreshToken: vi.fn(),
  revokeRefreshToken: vi.fn(),
}));

const findMembershipByUserId = vi.fn();
vi.mock('../../src/modules/billing/repository.js', () => ({ findMembershipByUserId }));

const isAccessBlocked = vi.fn();
vi.mock('../../src/modules/billing/service.js', () => ({ isAccessBlocked }));

const getOrCreateDefaultBranch = vi.fn();
vi.mock('../../src/modules/attendance/repository.js', () => ({ getOrCreateDefaultBranch }));

const { pairDevice } = await import('../../src/modules/auth/service.js');

function fakeFastify() {
  return {
    jwt: { sign: vi.fn(() => 'signed.jwt.token') },
    config: { JWT_REFRESH_EXPIRES_IN_DAYS: 30 },
  } as unknown as FastifyInstance;
}

describe('pairDevice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects an invalid or expired pairing token', async () => {
    redeemPairingToken.mockResolvedValue(null);

    await expect(pairDevice(fakeFastify(), 'bad-token')).rejects.toThrow(UnauthorizedError);
    expect(findUserById).not.toHaveBeenCalled();
  });

  it('rejects when the token was valid but the user no longer exists', async () => {
    redeemPairingToken.mockResolvedValue({ userId: { toString: () => 'user-1' } });
    findUserById.mockResolvedValue(null);

    await expect(pairDevice(fakeFastify(), 'token')).rejects.toThrow(UnauthorizedError);
  });

  it('rejects a suspended account even with a valid token', async () => {
    redeemPairingToken.mockResolvedValue({ userId: { toString: () => 'user-1' } });
    findUserById.mockResolvedValue({ status: 'suspended', role: 'member' });

    await expect(pairDevice(fakeFastify(), 'token')).rejects.toThrow(ForbiddenError);
  });

  it('rejects a member whose membership is past its grace period', async () => {
    redeemPairingToken.mockResolvedValue({ userId: { toString: () => 'user-1' } });
    findUserById.mockResolvedValue({
      status: 'active',
      role: 'member',
      tenantId: { toString: () => 'tenant-1' },
      _id: { toString: () => 'user-1' },
    });
    findMembershipByUserId.mockResolvedValue({ paymentStatus: 'overdue', endDate: new Date('2020-01-01') });
    getOrCreateDefaultBranch.mockResolvedValue({ gracePeriodDays: 2 });
    isAccessBlocked.mockReturnValue(true);

    await expect(pairDevice(fakeFastify(), 'token')).rejects.toThrow(ForbiddenError);
  });

  it('issues a session for a valid token and an active member in good standing', async () => {
    redeemPairingToken.mockResolvedValue({ userId: { toString: () => 'user-1' } });
    findUserById.mockResolvedValue({
      status: 'active',
      role: 'member',
      tenantId: { toString: () => 'tenant-1' },
      _id: { toString: () => 'user-1' },
    });
    findMembershipByUserId.mockResolvedValue(null);
    getOrCreateDefaultBranch.mockResolvedValue({ gracePeriodDays: 2 });
    isAccessBlocked.mockReturnValue(false);
    toDomainUser.mockReturnValue({ id: 'user-1', tenantId: 'tenant-1', role: 'member' });
    issueRefreshToken.mockResolvedValue('refresh-token-value');

    const result = await pairDevice(fakeFastify(), 'good-token');

    expect(result).toEqual({
      user: { id: 'user-1', tenantId: 'tenant-1', role: 'member' },
      accessToken: 'signed.jwt.token',
      refreshToken: 'refresh-token-value',
    });
  });

  it('skips membership checks entirely for non-member roles (e.g. trainer)', async () => {
    redeemPairingToken.mockResolvedValue({ userId: { toString: () => 'trainer-1' } });
    findUserById.mockResolvedValue({ status: 'active', role: 'trainer' });
    toDomainUser.mockReturnValue({ id: 'trainer-1', role: 'trainer' });
    issueRefreshToken.mockResolvedValue('refresh-token-value');

    await pairDevice(fakeFastify(), 'token');

    expect(findMembershipByUserId).not.toHaveBeenCalled();
    expect(getOrCreateDefaultBranch).not.toHaveBeenCalled();
  });
});
