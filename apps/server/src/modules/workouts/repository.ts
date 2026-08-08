import type { HydratedDocument } from 'mongoose';
import type { WorkoutPlan, WorkoutSession } from '@barbellix/shared';
import { WorkoutPlanModel, type WorkoutPlanDocument } from '../../db/models/WorkoutPlan.js';
import { WorkoutSessionModel, type WorkoutSessionDocument, type WorkoutSetSubdoc } from '../../db/models/WorkoutSession.js';
import { idStr, isoStr } from '../../lib/mappers-base.js';

export function toDomainPlan(doc: HydratedDocument<WorkoutPlanDocument>): WorkoutPlan {
  return {
    id: idStr(doc._id),
    userId: idStr(doc.userId),
    trainerId: doc.trainerId ? idStr(doc.trainerId) : undefined,
    name: doc.name,
    goal: doc.goal,
    generatedBy: doc.generatedBy,
    active: doc.active,
    version: doc.version,
    previousPlanId: doc.previousPlanId ? idStr(doc.previousPlanId) : undefined,
    changeSummary: doc.changeSummary,
    days: doc.days.map((day) => ({
      dayLabel: day.dayLabel,
      dayOfWeek: day.dayOfWeek,
      exercises: day.exercises.map((ex) => ({
        exerciseId: idStr(ex.exerciseId),
        sets: ex.sets,
        reps: ex.reps,
        restSecs: ex.restSecs,
        notes: ex.notes,
      })),
    })),
    createdAt: isoStr(doc.createdAt),
  };
}

// Sorted newest-first so callers that pick a single "current" plan (e.g. mobile's
// WorkoutHomeScreen using plans[0]) reliably get the most recent one, not whatever order Mongo
// happens to return.
export async function findByUser(userId: string) {
  return WorkoutPlanModel.find({ userId }).sort({ createdAt: -1 });
}

export async function findActiveByUser(userId: string) {
  return WorkoutPlanModel.findOne({ userId, active: true }).sort({ createdAt: -1 });
}

export async function findByIdForUser(id: string, userId: string) {
  return WorkoutPlanModel.findOne({ _id: id, userId });
}

interface CreatePlanDayInput {
  dayLabel: string;
  dayOfWeek?: number;
  exercises: Array<{ exerciseId: string; sets: number; reps: string; restSecs: number; notes?: string }>;
}

export async function createPlan(input: {
  userId: string;
  name: string;
  goal: WorkoutPlanDocument['goal'];
  generatedBy: WorkoutPlanDocument['generatedBy'];
  days: CreatePlanDayInput[];
  trainerId?: string;
  version?: number;
  previousPlanId?: string;
  changeSummary?: string[];
}) {
  // Mongoose casts the exerciseId strings to ObjectId on write - this input shape matches
  // what the client actually sends, not the hydrated document shape.
  return WorkoutPlanModel.create({ ...input, active: true });
}

/** Deactivates a plan without deleting it - the superseded version stays readable via
 * previousPlanId chaining (see regenerateWorkoutPlan() in ai-coach/plan-generator.ts). */
export async function deactivatePlan(id: string) {
  return WorkoutPlanModel.findByIdAndUpdate(id, { $set: { active: false } });
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export function toDomainSession(doc: HydratedDocument<WorkoutSessionDocument>): WorkoutSession {
  return {
    id: idStr(doc._id),
    userId: idStr(doc.userId),
    planId: doc.planId ? idStr(doc.planId) : undefined,
    date: isoStr(doc.date),
    durationMins: doc.durationMins,
    notes: doc.notes,
    perceivedEffort: doc.perceivedEffort,
    sets: doc.sets.map((set, i) => ({
      id: `${idStr(doc._id)}_${i}`,
      sessionId: idStr(doc._id),
      exerciseId: idStr(set.exerciseId),
      setNumber: set.setNumber,
      reps: set.reps,
      weightKg: set.weightKg,
      durationSecs: set.durationSecs,
      restSecs: set.restSecs,
      completed: set.completed,
    })),
  };
}

export async function findSessionsByUser(userId: string) {
  return WorkoutSessionModel.find({ userId }).sort({ date: -1 });
}

export async function findRecentSessionsByUser(userId: string, limit: number) {
  return WorkoutSessionModel.find({ userId }).sort({ date: -1 }).limit(limit);
}

export async function createSession(input: {
  userId: string;
  planId?: string;
  date?: Date;
  durationMins?: number;
  notes?: string;
  perceivedEffort?: number;
  sets: Array<Omit<WorkoutSetSubdoc, 'exerciseId'> & { exerciseId: string }>;
}) {
  return WorkoutSessionModel.create(input);
}
