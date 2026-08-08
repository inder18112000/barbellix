import type { Readable } from 'node:stream';
import type { MuscleGroup, Equipment, ExerciseTag, UserRole } from '@barbellix/shared';
import { NotFoundError, ValidationError } from '../../lib/errors.js';
import { assertTrainerCanManage } from '../../lib/trainerPermissions.js';
import { putVideoStream, isSupportedVideoMimeType } from '../../lib/storage.js';
import * as repo from './repository.js';

export async function searchExercises(tenantId: string, query?: string) {
  const docs = await repo.search(tenantId, query);
  return docs.map(repo.toDomainExercise);
}

export async function getExercisesByIds(ids: string[]) {
  const docs = await repo.findByIds(ids);
  return docs.map(repo.toDomainExercise);
}

interface ExerciseInput {
  name: string;
  muscleGroups: MuscleGroup[];
  equipment: Equipment[];
  instructions: string;
  mediaUrl?: string;
  tags?: ExerciseTag[];
}

/** Every trainer-authored exercise is scoped to their own tenant (isCustom: true) - never the
 * global (tenantId-less) library, which is curated separately. See exercises/repository.ts's
 * search(), which already resolves `tenantId = :self OR tenantId IS NULL` so custom exercises
 * created here show up alongside the global catalog immediately. */
export async function createExercise(tenantId: string, requester: { id: string; role: UserRole }, input: ExerciseInput) {
  await assertTrainerCanManage(requester, 'canManageExerciseLibrary', 'Your admin has not granted you exercise library management access');

  const doc = await repo.create({ tenantId, ...input });
  return repo.toDomainExercise(doc);
}

/** Tenant-ownership check first - a trainer/admin may only ever edit their own gym's custom
 * exercises, never the shared global library or another tenant's. */
export async function updateExercise(
  tenantId: string,
  requester: { id: string; role: UserRole },
  id: string,
  updates: Partial<ExerciseInput>,
) {
  await assertTrainerCanManage(requester, 'canManageExerciseLibrary', 'Your admin has not granted you exercise library management access');

  const existing = await repo.findByIdInTenant(id, tenantId);
  if (!existing) throw new NotFoundError('Exercise not found');

  const updated = await repo.update(id, tenantId, updates);
  if (!updated) throw new NotFoundError('Exercise not found');
  return repo.toDomainExercise(updated);
}

/** Video-only endpoint - only touches mediaUrl/mediaType (via repo.setVideo()), never the rest of
 * the exercise, so an upload can never accidentally clobber other fields from a stale form state.
 * Only ever succeeds for tenant-custom exercises - the global catalog (tenantId unset) can't match
 * findByIdInTenant()'s tenant-scoped lookup, which is the intended scope: video upload is a
 * per-gym content-authoring action, not a way to edit the shared library. */
export async function uploadExerciseVideo(
  tenantId: string,
  requester: { id: string; role: UserRole },
  id: string,
  fileStream: Readable,
  mimeType: string,
) {
  await assertTrainerCanManage(requester, 'canManageExerciseLibrary', 'Your admin has not granted you exercise library management access');

  if (!isSupportedVideoMimeType(mimeType)) {
    throw new ValidationError('Unsupported video type - upload an MP4, MOV, or WebM file');
  }

  const existing = await repo.findByIdInTenant(id, tenantId);
  if (!existing) throw new NotFoundError('Exercise not found');

  const mediaUrl = await putVideoStream(fileStream, `exercises/${tenantId}`, mimeType);

  const updated = await repo.setVideo(id, tenantId, mediaUrl);
  if (!updated) throw new NotFoundError('Exercise not found');
  return repo.toDomainExercise(updated);
}

export async function deleteExercise(tenantId: string, requester: { id: string; role: UserRole }, id: string) {
  await assertTrainerCanManage(requester, 'canManageExerciseLibrary', 'Your admin has not granted you exercise library management access');

  const existing = await repo.findByIdInTenant(id, tenantId);
  if (!existing) throw new NotFoundError('Exercise not found');

  await repo.remove(id, tenantId);
  return { id, deleted: true };
}
