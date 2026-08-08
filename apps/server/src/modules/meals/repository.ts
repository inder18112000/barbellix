import type { HydratedDocument } from 'mongoose';
import type { Meal } from '@barbellix/shared';
import { MealModel, type MealDocument } from '../../db/models/Meal.js';
import { idStr } from '../../lib/mappers-base.js';

export function toDomainMeal(doc: HydratedDocument<MealDocument>): Meal {
  return {
    id: idStr(doc._id),
    tenantId: doc.tenantId ? idStr(doc.tenantId) : undefined,
    name: doc.name,
    mealType: doc.mealType,
    calories: doc.calories,
    proteinG: doc.proteinG,
    carbsG: doc.carbsG,
    fatG: doc.fatG,
    isCustom: doc.isCustom,
  };
}

/** Meals are either global (no tenantId) or custom to the requester's own gym - same convention as
 * exercises/repository.ts's search(). */
export async function search(tenantId: string, query?: string) {
  const filter: Record<string, unknown> = {
    $or: [{ tenantId: { $exists: false } }, { tenantId }],
  };
  if (query) filter.name = { $regex: query, $options: 'i' };
  return MealModel.find(filter);
}

export async function findByIdInTenant(id: string, tenantId: string) {
  return MealModel.findOne({ _id: id, tenantId });
}

export async function create(input: {
  tenantId: string;
  name: string;
  mealType: MealDocument['mealType'];
  calories: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
}) {
  return MealModel.create({ ...input, isCustom: true });
}

export async function update(
  id: string,
  tenantId: string,
  updates: Partial<Pick<MealDocument, 'name' | 'mealType' | 'calories' | 'proteinG' | 'carbsG' | 'fatG'>>,
) {
  return MealModel.findOneAndUpdate({ _id: id, tenantId }, { $set: updates }, { new: true });
}

export async function remove(id: string, tenantId: string) {
  const result = await MealModel.deleteOne({ _id: id, tenantId });
  return result.deletedCount > 0;
}
