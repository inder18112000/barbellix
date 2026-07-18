import type { HydratedDocument } from 'mongoose';
import type { MealEntry } from '@fitpulse/shared';
import { MealEntryModel, type MealEntryDocument } from '../../db/models/MealEntry.js';
import { isValidObjectId } from '../../lib/objectId.js';

export function toDomainMeal(doc: HydratedDocument<MealEntryDocument>): MealEntry {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    loggedAt: doc.loggedAt.toISOString(),
    name: doc.name,
    mealType: doc.mealType,
    calories: doc.calories,
    proteinG: doc.proteinG,
    carbsG: doc.carbsG,
    fatG: doc.fatG,
  };
}

export async function findToday(userId: string) {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

  return MealEntryModel.find({ userId, loggedAt: { $gte: startOfDay, $lt: endOfDay } }).sort({ loggedAt: -1 });
}

export async function create(input: {
  userId: string;
  name: string;
  mealType: MealEntryDocument['mealType'];
  calories: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
}) {
  return MealEntryModel.create(input);
}

export async function deleteForUser(id: string, userId: string) {
  if (!isValidObjectId(id)) return false;
  const result = await MealEntryModel.deleteOne({ _id: id, userId });
  return result.deletedCount > 0;
}
