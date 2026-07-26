import { Schema, model, Types } from 'mongoose';
import type { FitnessGoal, MealType, WorkoutGeneratedBy } from '@fitpulse/shared';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const GENERATED_BY: WorkoutGeneratedBy[] = ['ai', 'trainer', 'user'];

export interface DietPlanMealSubdoc {
  mealType: MealType;
  name: string;
  calories: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  notes?: string;
}

export interface DietPlanDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  goal: FitnessGoal;
  generatedBy: WorkoutGeneratedBy;
  dailyCalorieTarget: number;
  dailyProteinG: number;
  dailyCarbsG: number;
  dailyFatG: number;
  meals: DietPlanMealSubdoc[];
  active: boolean;
  createdAt: Date;
}

const dietPlanMealSchema = new Schema<DietPlanMealSubdoc>(
  {
    mealType: { type: String, enum: MEAL_TYPES, required: true },
    name: { type: String, required: true },
    calories: { type: Number, required: true },
    proteinG: { type: Number },
    carbsG: { type: Number },
    fatG: { type: Number },
    notes: { type: String },
  },
  { _id: false },
);

const dietPlanSchema = new Schema<DietPlanDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    goal: { type: String, required: true },
    generatedBy: { type: String, enum: GENERATED_BY, required: true },
    dailyCalorieTarget: { type: Number, required: true },
    dailyProteinG: { type: Number, required: true },
    dailyCarbsG: { type: Number, required: true },
    dailyFatG: { type: Number, required: true },
    meals: { type: [dietPlanMealSchema], default: [] },
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const DietPlanModel = model<DietPlanDocument>('DietPlan', dietPlanSchema);
