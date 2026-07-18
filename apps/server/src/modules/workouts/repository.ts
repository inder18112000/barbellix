import type { HydratedDocument } from 'mongoose';
import type { WorkoutPlan } from '@fitpulse/shared';
import { WorkoutPlanModel, type WorkoutPlanDocument } from '../../db/models/WorkoutPlan.js';

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
