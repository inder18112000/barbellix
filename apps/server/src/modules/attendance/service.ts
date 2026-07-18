import { NotFoundError } from '../../lib/errors.js';
import * as repo from './repository.js';

function toCalendarDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function computeStreak(checkInDates: Date[]): number {
  if (checkInDates.length === 0) return 0;

  const distinctDayKeys = [...new Set(checkInDates.map(toCalendarDateKey))].sort().reverse();

  let streak = 1;
  let cursor = new Date(distinctDayKeys[0]);

  for (let i = 1; i < distinctDayKeys.length; i++) {
    const expectedPrevDay = new Date(cursor);
    expectedPrevDay.setUTCDate(expectedPrevDay.getUTCDate() - 1);

    if (toCalendarDateKey(expectedPrevDay) === distinctDayKeys[i]) {
      streak++;
      cursor = expectedPrevDay;
    } else {
      break;
    }
  }

  return streak;
}

export async function computeSummary(userId: string) {
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const [totalThisMonth, recentDates] = await Promise.all([
    repo.findThisMonthCount(userId, startOfMonth),
    repo.findRecentCheckInDates(userId),
  ]);

  return {
    totalThisMonth,
    streak: computeStreak(recentDates),
    lastCheckedIn: recentDates[0]?.toISOString(),
  };
}

export async function getHistory(userId: string) {
  const docs = await repo.findHistory(userId);
  return docs.map(repo.toDomainRecord);
}

export async function checkIn(
  userId: string,
  tenantId: string,
  input: { qrToken?: string; pin?: string },
) {
  const branch = input.qrToken
    ? await repo.findBranchByQrToken(input.qrToken)
    : await repo.getOrCreateDefaultBranch(tenantId);

  if (!branch) throw new NotFoundError('Branch not found for that QR code');

  const method = input.qrToken ? 'qr' : input.pin ? 'pin' : 'manual';

  const doc = await repo.createRecord({ userId, branchId: branch._id.toString(), method });
  const record = repo.toDomainRecord(doc);
  const summary = await computeSummary(userId);

  return { record, summary };
}
