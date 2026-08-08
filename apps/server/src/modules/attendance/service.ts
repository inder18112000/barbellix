import { NotFoundError, UnauthorizedError } from '../../lib/errors.js';
import { sendPushToUser } from '../../lib/push.js';
import { getNotificationPreferences } from '../users/service.js';
import * as repo from './repository.js';

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];

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

/** Batched sibling of computeSummary - fetches every member's monthly count and recent check-in
 * dates in two aggregations total (see attendance/repository.ts) instead of two queries per
 * member, then runs the same pure computeStreak() per user in memory. Used by roster-style pages
 * (trainer/service.ts's listMembers) that need this summary for every member at once. */
export async function computeSummariesForUsers(userIds: string[]) {
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const [monthCounts, recentDatesByUser] = await Promise.all([
    repo.findThisMonthCountsForUsers(userIds, startOfMonth),
    repo.findRecentCheckInDatesForUsers(userIds),
  ]);

  const summaries = new Map<string, { totalThisMonth: number; streak: number; lastCheckedIn?: string }>();
  for (const userId of userIds) {
    const recentDates = recentDatesByUser.get(userId) ?? [];
    summaries.set(userId, {
      totalThisMonth: monthCounts.get(userId) ?? 0,
      streak: computeStreak(recentDates),
      lastCheckedIn: recentDates[0]?.toISOString(),
    });
  }
  return summaries;
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

  if (input.pin && input.pin !== branch.checkInPin) {
    throw new UnauthorizedError('Incorrect PIN');
  }

  const method = input.qrToken ? 'qr' : input.pin ? 'pin' : 'manual';

  const doc = await repo.createRecord({ userId, branchId: branch._id.toString(), method });
  const record = repo.toDomainRecord(doc);
  const summary = await computeSummary(userId);

  if (STREAK_MILESTONES.includes(summary.streak)) {
    const prefs = await getNotificationPreferences(userId);
    if (prefs.streakAlerts) {
      await sendPushToUser(userId, {
        title: `🔥 ${summary.streak}-day streak!`,
        body: `You've checked in ${summary.streak} days in a row - keep it going.`,
        data: { type: 'streak_milestone', streak: summary.streak },
      });
    }
  }

  return { record, summary };
}
