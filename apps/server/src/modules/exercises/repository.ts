import type { Exercise } from '@fitpulse/shared';
import { ExerciseModel, type ExerciseDocument } from '../../db/models/Exercise.js';
import type { HydratedDocument } from 'mongoose';
import { idStr } from '../../lib/mappers-base.js';

export function toDomainExercise(doc: HydratedDocument<ExerciseDocument>): Exercise {
  return {
    id: idStr(doc._id),
    name: doc.name,
    muscleGroups: doc.muscleGroups,
    equipment: doc.equipment,
    instructions: doc.instructions,
    mediaUrl: doc.mediaUrl,
    isCustom: doc.isCustom,
    tenantId: doc.tenantId ? idStr(doc.tenantId) : undefined,
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

/** id -> name lookup map, used wherever exercise names need to be resolved from just an id (e.g. the AI context builder). */
export async function findNamesByIds(ids: string[]): Promise<Map<string, string>> {
  const docs = await ExerciseModel.find({ _id: { $in: ids } }).select('name');
  return new Map(docs.map((d) => [d._id.toString(), d.name]));
}
