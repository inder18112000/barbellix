import type { Exercise } from '@barbellix/shared';
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
    mediaType: doc.mediaType,
    tags: doc.tags,
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

export async function findByIdInTenant(id: string, tenantId: string) {
  return ExerciseModel.findOne({ _id: id, tenantId });
}

/** Full documents (not just names) for a batch of exercise ids - used by the injury-aware plan
 * regenerator, which needs each exercise's muscleGroups to decide what to strip. */
export async function findByIds(ids: string[]) {
  return ExerciseModel.find({ _id: { $in: ids } });
}

export async function create(input: {
  tenantId: string;
  name: string;
  muscleGroups: ExerciseDocument['muscleGroups'];
  equipment: ExerciseDocument['equipment'];
  instructions: string;
  mediaUrl?: string;
  tags?: ExerciseDocument['tags'];
}) {
  return ExerciseModel.create({ ...input, isCustom: true });
}

export async function update(
  id: string,
  tenantId: string,
  updates: Partial<Pick<ExerciseDocument, 'name' | 'muscleGroups' | 'equipment' | 'instructions' | 'mediaUrl' | 'mediaType' | 'tags'>>,
) {
  return ExerciseModel.findOneAndUpdate({ _id: id, tenantId }, { $set: updates }, { new: true });
}

/** Used by the video-upload endpoint - a narrower update than the general update() above, since
 * uploading a video should only ever touch media fields, never accidentally overwrite other
 * exercise data from a stale client payload. */
export async function setVideo(id: string, tenantId: string, mediaUrl: string) {
  return ExerciseModel.findOneAndUpdate(
    { _id: id, tenantId },
    { $set: { mediaUrl, mediaType: 'video' } },
    { new: true },
  );
}

export async function remove(id: string, tenantId: string) {
  const result = await ExerciseModel.deleteOne({ _id: id, tenantId });
  return result.deletedCount > 0;
}
