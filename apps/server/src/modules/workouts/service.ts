import { isValidObjectId } from '../../lib/objectId.js';
import { NotFoundError } from '../../lib/errors.js';
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
