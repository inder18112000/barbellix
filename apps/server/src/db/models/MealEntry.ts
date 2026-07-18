import { Schema, model, Types } from 'mongoose';
import type { MealType } from '@fitpulse/shared';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export interface MealEntryDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  loggedAt: Date;
  name: string;
  mealType: MealType;
  calories: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
}

const mealEntrySchema = new Schema<MealEntryDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  loggedAt: { type: Date, required: true, default: Date.now },
  name: { type: String, required: true },
  mealType: { type: String, enum: MEAL_TYPES, required: true },
  calories: { type: Number, required: true },
  proteinG: { type: Number },
  carbsG: { type: Number },
  fatG: { type: Number },
});

mealEntrySchema.index({ userId: 1, loggedAt: -1 });

export const MealEntryModel = model<MealEntryDocument>('MealEntry', mealEntrySchema);
