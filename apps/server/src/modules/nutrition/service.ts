import { NotFoundError } from '../../lib/errors.js';
import * as repo from './repository.js';

export async function listToday(userId: string) {
  const docs = await repo.findToday(userId);
  return docs.map(repo.toDomainMeal);
}

interface LogMealInput {
  name: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
}

export async function logMeal(userId: string, input: LogMealInput) {
  const doc = await repo.create({ userId, ...input });
  return repo.toDomainMeal(doc);
}

export async function deleteMeal(id: string, userId: string) {
  const deleted = await repo.deleteForUser(id, userId);
  if (!deleted) throw new NotFoundError('Meal not found');
  return { success: true };
}
