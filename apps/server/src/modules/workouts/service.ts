import { isValidObjectId } from '../../lib/objectId.js';
import { NotFoundError } from '../../lib/errors.js';
import { recordIfPR } from '../progress/service.js';
import * as repo from './repository.js';

export async function listPlans(userId: string) {
  const docs = await repo.findByUser(userId);
  return docs.map(repo.toDomainPlan);
}

export async function getPlan(id: string, userId: string) {
  if (!isValidObjectId(id)) throw new NotFoundError('Workout plan not found');
  const doc = await repo.findByIdForUser(id, userId);
  if (!doc) throw new NotFoundError('Workout plan not found');
  return repo.toDomainPlan(doc);
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function listSessions(userId: string) {
  const docs = await repo.findSessionsByUser(userId);
  return docs.map(repo.toDomainSession);
}

export async function findRecentSessions(userId: string, limit: number) {
  const docs = await repo.findRecentSessionsByUser(userId, limit);
  return docs.map(repo.toDomainSession);
}

interface LogSessionInput {
  planId?: string;
  date?: string;
  durationMins?: number;
  notes?: string;
  perceivedEffort?: number;
  sets: Array<{
    exerciseId: string;
    setNumber: number;
    reps?: number;
    weightKg?: number;
    durationSecs?: number;
    restSecs?: number;
    completed: boolean;
  }>;
}

export async function logSession(userId: string, input: LogSessionInput) {
  const doc = await repo.createSession({
    userId,
    planId: input.planId,
    date: input.date ? new Date(input.date) : undefined,
    durationMins: input.durationMins,
    notes: input.notes,
    perceivedEffort: input.perceivedEffort,
    sets: input.sets,
  });

  // New PR detection is genuinely new logic vs. the mock (whose PRs were static
  // fixtures with no write path) - this is what makes the PRs collection real.
  for (const set of input.sets) {
    if (!set.completed) continue;
    if (set.weightKg !== undefined) {
      await recordIfPR(userId, set.exerciseId, set.weightKg, 'kg');
    } else if (set.reps !== undefined && set.weightKg === undefined) {
      await recordIfPR(userId, set.exerciseId, set.reps, 'reps');
    }
  }

  return repo.toDomainSession(doc);
}
