import type { HydratedDocument } from 'mongoose';
import type { MealEntry, DietPlan } from '@fitpulse/shared';
import { MealEntryModel, type MealEntryDocument } from '../../db/models/MealEntry.js';
import { DietPlanModel, type DietPlanDocument, type DietPlanMealSubdoc } from '../../db/models/DietPlan.js';
import { isValidObjectId } from '../../lib/objectId.js';
import { idStr, isoStr } from '../../lib/mappers-base.js';

export function toDomainMeal(doc: HydratedDocument<MealEntryDocument>): MealEntry {
  return {
    id: idStr(doc._id),
    userId: idStr(doc.userId),
    loggedAt: isoStr(doc.loggedAt),
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

// ─── Diet plans (prescribed template, distinct from the meal log above) ────────

export function toDomainDietPlan(doc: HydratedDocument<DietPlanDocument>): DietPlan {
  return {
    id: idStr(doc._id),
    userId: idStr(doc.userId),
    name: doc.name,
    goal: doc.goal,
    generatedBy: doc.generatedBy,
    dailyCalorieTarget: doc.dailyCalorieTarget,
    dailyProteinG: doc.dailyProteinG,
    dailyCarbsG: doc.dailyCarbsG,
    dailyFatG: doc.dailyFatG,
    meals: doc.meals,
    active: doc.active,
    createdAt: isoStr(doc.createdAt),
  };
}

export async function findDietPlansByUser(userId: string) {
  return DietPlanModel.find({ userId }).sort({ createdAt: -1 });
}

export async function createDietPlan(input: {
  userId: string;
  name: string;
  goal: DietPlanDocument['goal'];
  generatedBy: DietPlanDocument['generatedBy'];
  dailyCalorieTarget: number;
  dailyProteinG: number;
  dailyCarbsG: number;
  dailyFatG: number;
  meals: DietPlanMealSubdoc[];
}) {
  return DietPlanModel.create({ ...input, active: true });
}
