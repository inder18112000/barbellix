import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { ForbiddenError, UnauthorizedError } from '../../src/lib/errors.js';

const findUserByEmail = vi.fn();
const findUserById = vi.fn();
const updatePasswordHash = vi.fn();
const toDomainUser = vi.fn();
vi.mock('../../src/modules/auth/repository.js', () => ({
  findUserByEmail,
  findUserById,
  createUser: vi.fn(),
  updatePasswordHash,
  getOrCreateDefaultTenant: vi.fn(),
  toDomainUser,
}));

const redeemPairingToken = vi.fn();
vi.mock('../../src/lib/pairingToken.js', () => ({ issuePairingToken: vi.fn(), redeemPairingToken }));

const issuePasswordResetToken = vi.fn();
const redeemPasswordResetToken = vi.fn();
vi.mock('../../src/lib/passwordResetToken.js', () => ({ issuePasswordResetToken, redeemPasswordResetToken }));

const sendEmail = vi.fn();
vi.mock('../../src/lib/email.js', () => ({ sendEmail }));

const hashPassword = vi.fn();
vi.mock('../../src/lib/password.js', () => ({ hashPassword, verifyPassword: vi.fn() }));

const issueRefreshToken = vi.fn();
const revokeAllRefreshTokens = vi.fn();
vi.mock('../../src/lib/refreshToken.js', () => ({
  issueRefreshToken,
  rotateRefreshToken: vi.fn(),
  revokeRefreshToken: vi.fn(),
  revokeAllRefreshTokens,
}));

vi.mock('../../src/lib/googleAuth.js', () => ({ verifyGoogleIdToken: vi.fn() }));

const findMembershipByUserId = vi.fn();
vi.mock('../../src/modules/billing/repository.js', () => ({ findMembershipByUserId }));

const isAccessBlocked = vi.fn();
vi.mock('../../src/modules/billing/service.js', () => ({ isAccessBlocked }));

const getOrCreateDefaultBranch = vi.fn();
vi.mock('../../src/modules/attendance/repository.js', () => ({ getOrCreateDefaultBranch }));

const { pairDevice, forgotPassword, resetPassword } = await import('../../src/modules/auth/service.js');

function fakeFastify(overrides: Partial<{ WEB_APP_BASE_URL: string }> = {}) {
  return {
    jwt: { sign: vi.fn(() => 'signed.jwt.token') },
    config: { JWT_REFRESH_EXPIRES_IN_DAYS: 30, WEB_APP_BASE_URL: 'https://app.barbellix.example', ...overrides },
    log: { warn: vi.fn(), info: vi.fn() },
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

describe('forgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the generic message and sends no email when no account matches', async () => {
    findUserByEmail.mockResolvedValue(null);
    const fastify = fakeFastify();

    const result = await forgotPassword(fastify, 'nobody@example.com');

    expect(result).toEqual({ message: 'If an account with that email exists, a reset link has been sent.' });
    expect(issuePasswordResetToken).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('issues a token and emails a reset link built from WEB_APP_BASE_URL when an account matches', async () => {
    findUserByEmail.mockResolvedValue({ _id: 'user-1', email: 'member@example.com' });
    issuePasswordResetToken.mockResolvedValue({ token: 'raw-token-123', expiresAt: new Date() });
    sendEmail.mockResolvedValue(undefined);
    const fastify = fakeFastify();

    const result = await forgotPassword(fastify, 'member@example.com');

    expect(issuePasswordResetToken).toHaveBeenCalledWith('user-1');
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'member@example.com',
        html: expect.stringContaining('https://app.barbellix.example/reset-password?token=raw-token-123'),
        text: expect.stringContaining('https://app.barbellix.example/reset-password?token=raw-token-123'),
      }),
    );
    expect(result).toEqual({ message: 'If an account with that email exists, a reset link has been sent.' });
  });

  it('still returns the generic success message when sending the email fails, and logs a warning', async () => {
    findUserByEmail.mockResolvedValue({ _id: 'user-1', email: 'member@example.com' });
    issuePasswordResetToken.mockResolvedValue({ token: 'raw-token-123', expiresAt: new Date() });
    sendEmail.mockRejectedValue(new Error('Resend API error (503)'));
    const fastify = fakeFastify();

    const result = await forgotPassword(fastify, 'member@example.com');

    expect(result).toEqual({ message: 'If an account with that email exists, a reset link has been sent.' });
    expect(fastify.log.warn).toHaveBeenCalled();
  });
});

describe('resetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws UnauthorizedError for an invalid or expired token, without touching the user', async () => {
    redeemPasswordResetToken.mockResolvedValue(null);

    await expect(resetPassword('bad-token', 'newPassword123')).rejects.toThrow(UnauthorizedError);
    expect(updatePasswordHash).not.toHaveBeenCalled();
    expect(revokeAllRefreshTokens).not.toHaveBeenCalled();
  });

  it('hashes and saves the new password and revokes every refresh token for that user on success', async () => {
    redeemPasswordResetToken.mockResolvedValue({ userId: 'user-1' });
    hashPassword.mockResolvedValue('hashed-value');

    const result = await resetPassword('good-token', 'newPassword123');

    expect(hashPassword).toHaveBeenCalledWith('newPassword123');
    expect(updatePasswordHash).toHaveBeenCalledWith('user-1', 'hashed-value');
    expect(revokeAllRefreshTokens).toHaveBeenCalledWith('user-1');
    expect(result).toEqual({ message: 'Your password has been reset. Please log in again.' });
  });
});
