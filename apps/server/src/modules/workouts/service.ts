import type { FitnessGoal, UserRole } from '@fitpulse/shared';
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

interface CreatePlanInput {
  name: string;
  goal: FitnessGoal;
  days: Array<{
    dayLabel: string;
    exercises: Array<{ exerciseId: string; sets: number; reps: string; restSecs: number; notes?: string }>;
  }>;
}

export async function createPlan(userId: string, role: UserRole, input: CreatePlanInput) {
  // Reflects who actually built it - this endpoint has no role gate (a member can build
  // their own plan same as a trainer building a template for their roster).
  const generatedBy = role === 'trainer' || role === 'admin' || role === 'superadmin' ? 'trainer' : 'user';

  const doc = await repo.createPlan({
    userId,
    name: input.name,
    goal: input.goal,
    generatedBy,
    days: input.days,
  });
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
