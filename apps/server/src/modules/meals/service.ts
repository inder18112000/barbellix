import type { MealType, UserRole } from '@barbellix/shared';
import { NotFoundError } from '../../lib/errors.js';
import { assertTrainerCanManage } from '../../lib/trainerPermissions.js';
import * as repo from './repository.js';

export async function searchMeals(tenantId: string, query?: string) {
  const docs = await repo.search(tenantId, query);
  return docs.map(repo.toDomainMeal);
}

interface MealInput {
  name: string;
  mealType: MealType;
  calories: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
}

/** Every trainer-authored meal is scoped to their own tenant (isCustom: true) - the global library
 * (tenantId unset) is curated separately, same convention as exercises/service.ts's
 * createExercise(). */
export async function createMeal(tenantId: string, requester: { id: string; role: UserRole }, input: MealInput) {
  await assertTrainerCanManage(requester, 'canManageMealLibrary', 'Your admin has not granted you meal library management access');

  const doc = await repo.create({ tenantId, ...input });
  return repo.toDomainMeal(doc);
}

export async function updateMeal(
  tenantId: string,
  requester: { id: string; role: UserRole },
  id: string,
  updates: Partial<MealInput>,
) {
  await assertTrainerCanManage(requester, 'canManageMealLibrary', 'Your admin has not granted you meal library management access');

  const existing = await repo.findByIdInTenant(id, tenantId);
  if (!existing) throw new NotFoundError('Meal not found');

  const updated = await repo.update(id, tenantId, updates);
  if (!updated) throw new NotFoundError('Meal not found');
  return repo.toDomainMeal(updated);
}

export async function deleteMeal(tenantId: string, requester: { id: string; role: UserRole }, id: string) {
  await assertTrainerCanManage(requester, 'canManageMealLibrary', 'Your admin has not granted you meal library management access');

  const existing = await repo.findByIdInTenant(id, tenantId);
  if (!existing) throw new NotFoundError('Meal not found');

  await repo.remove(id, tenantId);
  return { id, deleted: true };
}
