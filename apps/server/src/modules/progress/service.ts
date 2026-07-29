import type { BodyMetric } from '@barbellix/shared';
import type { PRUnit } from '../../db/models/PersonalRecord.js';
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
