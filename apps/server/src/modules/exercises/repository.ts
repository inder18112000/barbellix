import type { Exercise } from '@fitpulse/shared';
import { ExerciseModel, type ExerciseDocument } from '../../db/models/Exercise.js';
import type { HydratedDocument } from 'mongoose';

export function toDomainExercise(doc: HydratedDocument<ExerciseDocument>): Exercise {
  return {
    id: doc._id.toString(),
    name: doc.name,
    muscleGroups: doc.muscleGroups,
    equipment: doc.equipment,
    instructions: doc.instructions,
    mediaUrl: doc.mediaUrl,
    isCustom: doc.isCustom,
    tenantId: doc.tenantId?.toString(),
  };
}

/** Exercises are either global (no tenantId) or custom to the requester's own gym. */
export async function search(tenantId: string, query?: string) {
  const filter: Record<string, unknown> = {
    $or: [{ tenantId: { $exists: false } }, { tenantId }],
  };
  if (query) {
    filter.name = { $regex: query, $options: 'i' };
  }
  return ExerciseModel.find(filter);
}
