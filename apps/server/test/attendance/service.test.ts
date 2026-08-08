import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundError, UnauthorizedError } from '../../src/lib/errors.js';

const findBranchByQrToken = vi.fn();
const getOrCreateDefaultBranch = vi.fn();
const createRecord = vi.fn();
const toDomainRecord = vi.fn();
const findThisMonthCount = vi.fn();
const findRecentCheckInDates = vi.fn();

vi.mock('../../src/modules/attendance/repository.js', () => ({
  findBranchByQrToken,
  getOrCreateDefaultBranch,
  createRecord,
  toDomainRecord,
  findThisMonthCount,
  findRecentCheckInDates,
}));

const getNotificationPreferences = vi.fn();
vi.mock('../../src/modules/users/service.js', () => ({ getNotificationPreferences }));

const sendPushToUser = vi.fn();
vi.mock('../../src/lib/push.js', () => ({ sendPushToUser }));

const { checkIn } = await import('../../src/modules/attendance/service.js');

const BRANCH = { _id: { toString: () => 'branch-1' }, checkInPin: '482913' };

describe('checkIn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getOrCreateDefaultBranch.mockResolvedValue(BRANCH);
    findBranchByQrToken.mockResolvedValue(BRANCH);
    createRecord.mockResolvedValue({ _id: 'record-1' });
    toDomainRecord.mockReturnValue({ id: 'record-1', method: 'qr' });
    findThisMonthCount.mockResolvedValue(0);
    findRecentCheckInDates.mockResolvedValue([]);
    getNotificationPreferences.mockResolvedValue({ streakAlerts: true });
  });

  it('rejects a PIN that does not match the branch PIN', async () => {
    await expect(checkIn('user-1', 'tenant-1', { pin: '000000' })).rejects.toThrow(UnauthorizedError);
    expect(createRecord).not.toHaveBeenCalled();
  });

  it('accepts a PIN that matches the branch PIN', async () => {
    const result = await checkIn('user-1', 'tenant-1', { pin: BRANCH.checkInPin });

    expect(createRecord).toHaveBeenCalledWith({ userId: 'user-1', branchId: 'branch-1', method: 'pin' });
    expect(result.record).toEqual({ id: 'record-1', method: 'qr' });
  });

  it('does not check the PIN at all for a QR-token check-in', async () => {
    await checkIn('user-1', 'tenant-1', { qrToken: 'gym-qr-token' });

    expect(findBranchByQrToken).toHaveBeenCalledWith('gym-qr-token');
    expect(createRecord).toHaveBeenCalledWith({ userId: 'user-1', branchId: 'branch-1', method: 'qr' });
  });

  it('throws NotFoundError when the scanned QR token matches no branch', async () => {
    findBranchByQrToken.mockResolvedValue(null);

    await expect(checkIn('user-1', 'tenant-1', { qrToken: 'unknown' })).rejects.toThrow(NotFoundError);
  });

  it('sends a push notification when the streak hits a milestone', async () => {
    findRecentCheckInDates.mockResolvedValue([new Date(), new Date(Date.now() - 86400000), new Date(Date.now() - 2 * 86400000)]);

    await checkIn('user-1', 'tenant-1', { pin: BRANCH.checkInPin });

    expect(sendPushToUser).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ data: { type: 'streak_milestone', streak: 3 } }),
    );
  });

  it('skips the push notification when the user has streak alerts disabled', async () => {
    findRecentCheckInDates.mockResolvedValue([new Date(), new Date(Date.now() - 86400000), new Date(Date.now() - 2 * 86400000)]);
    getNotificationPreferences.mockResolvedValue({ streakAlerts: false });

    await checkIn('user-1', 'tenant-1', { pin: BRANCH.checkInPin });

    expect(sendPushToUser).not.toHaveBeenCalled();
  });
});
