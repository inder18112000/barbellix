import { Schema, model, Types } from 'mongoose';
import type { MealType } from '@barbellix/shared';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export interface MealDocument {
  _id: Types.ObjectId;
  name: string;
  mealType: MealType;
  calories: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  isCustom: boolean;
  tenantId?: Types.ObjectId;
}

/** Reusable meal-library entry - a trainer authors this once and references it from any number of
 * DietPlan.meals[] entries, mirroring how Exercise is authored once and referenced from any
 * WorkoutDay.exercises[]. Distinct from MealEntry (a member's own log of what they actually ate on
 * a given day) and from DietPlanMealSubdoc (an inline, non-reusable meal embedded in one specific
 * plan) - this is the shared, trainer-curated catalog those inline meals get picked from. */
const mealSchema = new Schema<MealDocument>({
  name: { type: String, required: true },
  mealType: { type: String, enum: MEAL_TYPES, required: true },
  calories: { type: Number, required: true },
  proteinG: { type: Number },
  carbsG: { type: Number },
  fatG: { type: Number },
  isCustom: { type: Boolean, required: true, default: false },
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', index: { sparse: true } },
});

export const MealModel = model<MealDocument>('Meal', mealSchema);
