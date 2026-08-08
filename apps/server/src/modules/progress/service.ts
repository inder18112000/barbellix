import type { BodyMetric, CheckInStatus } from '@barbellix/shared';
import type { PRUnit } from '../../db/models/PersonalRecord.js';
import { getOrCreateDefaultBranch } from '../attendance/repository.js';
import * as repo from './repository.js';

export async function listMetrics(userId: string) {
  const docs = await repo.findMetrics(userId);
  return docs.map(repo.toDomainMetric);
}

export async function logMetric(
  userId: string,
  input: { weightKg?: number; bodyFatPct?: number; measurements?: BodyMetric['measurements'] },
) {
  const doc = await repo.createMetric({ userId, ...input });
  return repo.toDomainMetric(doc);
}

/**
 * Pure function - no I/O, no scheduled job needed, same philosophy as billing/service.ts's
 * isAccessBlocked(): correct at the instant it's checked, computed lazily wherever a check-in
 * status is needed rather than by a background process that flips a "due" flag on a timer.
 * A member with no logged metric yet is immediately due (dueAt: now) so onboarding always
 * prompts a first check-in rather than waiting a full interval.
 */
export function computeCheckInStatus(lastRecordedAt: Date | undefined, intervalDays: number): CheckInStatus {
  if (!lastRecordedAt) {
    const now = new Date();
    return { dueAt: now.toISOString(), isDue: true, intervalDays };
  }

  const dueAt = new Date(lastRecordedAt);
  dueAt.setUTCDate(dueAt.getUTCDate() + intervalDays);

  return {
    dueAt: dueAt.toISOString(),
    isDue: new Date() >= dueAt,
    lastCheckInAt: lastRecordedAt.toISOString(),
    intervalDays,
  };
}

export async function getCheckInStatus(userId: string, tenantId: string): Promise<CheckInStatus> {
  const [metrics, branch] = await Promise.all([repo.findMetrics(userId), getOrCreateDefaultBranch(tenantId)]);
  return computeCheckInStatus(metrics[0]?.recordedAt, branch.checkInIntervalDays);
}

export async function listPRs(userId: string) {
  const docs = await repo.findLatestPRs(userId);
  return docs.map(repo.toDomainPR);
}

/** Records a new PR if this value beats the user's current best for this (exercise, unit) - called from the workouts module when a session is logged. */
export async function recordIfPR(userId: string, exerciseId: string, value: number, unit: PRUnit) {
  const best = await repo.findBestValue(userId, exerciseId, unit);
  if (best && best.value >= value) return null;

  const doc = await repo.createPR({ userId, exerciseId, value, unit });
  return repo.toDomainPR(doc);
}
