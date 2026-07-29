import { Schema, model, Types } from 'mongoose';
import type { HabitId } from '@barbellix/shared';

const HABIT_IDS: HabitId[] = ['water', 'sleep', 'steps', 'stretch', 'no_junk', 'meditation'];

export interface HabitEntryDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  habitId: HabitId;
  date: string; // YYYY-MM-DD, matches the client's date-only (no timezone) representation
  completed: boolean;
  value?: number;
}

const habitEntrySchema = new Schema<HabitEntryDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  habitId: { type: String, enum: HABIT_IDS, required: true },
  date: { type: String, required: true },
  completed: { type: Boolean, required: true, default: false },
  value: { type: Number },
});

habitEntrySchema.index({ userId: 1, habitId: 1, date: 1 }, { unique: true });

export const HabitEntryModel = model<HabitEntryDocument>('HabitEntry', habitEntrySchema);
