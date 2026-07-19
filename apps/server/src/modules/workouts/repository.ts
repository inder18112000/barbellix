import type { HydratedDocument } from 'mongoose';
import type { WorkoutPlan, WorkoutSession } from '@fitpulse/shared';
import { WorkoutPlanModel, type WorkoutPlanDocument } from '../../db/models/WorkoutPlan.js';
import { WorkoutSessionModel, type WorkoutSessionDocument, type WorkoutSetSubdoc } from '../../db/models/WorkoutSession.js';

export function toDomainPlan(doc: HydratedDocument<WorkoutPlanDocument>): WorkoutPlan {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    trainerId: doc.trainerId?.toString(),
    name: doc.name,
    goal: doc.goal,
    generatedBy: doc.generatedBy,
    active: doc.active,
    days: doc.days.map((day) => ({
      dayLabel: day.dayLabel,
      exercises: day.exercises.map((ex) => ({
        exerciseId: ex.exerciseId.toString(),
        sets: ex.sets,
        reps: ex.reps,
        restSecs: ex.restSecs,
        notes: ex.notes,
      })),
    })),
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function findByUser(userId: string) {
  return WorkoutPlanModel.find({ userId });
}

export async function findByIdForUser(id: string, userId: string) {
  return WorkoutPlanModel.findOne({ _id: id, userId });
}

interface CreatePlanDayInput {
  dayLabel: string;
  exercises: Array<{ exerciseId: string; sets: number; reps: string; restSecs: number; notes?: string }>;
}

export async function createPlan(input: {
  userId: string;
  name: string;
  goal: WorkoutPlanDocument['goal'];
  generatedBy: WorkoutPlanDocument['generatedBy'];
  days: CreatePlanDayInput[];
}) {
  // Mongoose casts the exerciseId strings to ObjectId on write - this input shape matches
  // what the client actually sends, not the hydrated document shape.
  return WorkoutPlanModel.create({ ...input, active: true });
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export function toDomainSession(doc: HydratedDocument<WorkoutSessionDocument>): WorkoutSession {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    planId: doc.planId?.toString(),
    date: doc.date.toISOString(),
    durationMins: doc.durationMins,
    notes: doc.notes,
    perceivedEffort: doc.perceivedEffort,
    sets: doc.sets.map((set, i) => ({
      id: `${doc._id.toString()}_${i}`,
      sessionId: doc._id.toString(),
      exerciseId: set.exerciseId.toString(),
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
