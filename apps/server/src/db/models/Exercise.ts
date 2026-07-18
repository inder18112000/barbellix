import { Schema, model, Types } from 'mongoose';
import type { MuscleGroup, Equipment } from '@fitpulse/shared';

const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'core', 'quads', 'hamstrings', 'glutes', 'calves', 'full_body',
];
const EQUIPMENT: Equipment[] = [
  'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight',
  'kettlebell', 'resistance_band', 'smith_machine', 'other',
];

export interface ExerciseDocument {
  _id: Types.ObjectId;
  name: string;
  muscleGroups: MuscleGroup[];
  equipment: Equipment[];
  instructions: string;
  mediaUrl?: string;
  isCustom: boolean;
  tenantId?: Types.ObjectId;
}

const exerciseSchema = new Schema<ExerciseDocument>({
  name: { type: String, required: true },
  muscleGroups: { type: [String], enum: MUSCLE_GROUPS, default: [] },
  equipment: { type: [String], enum: EQUIPMENT, default: [] },
  instructions: { type: String, required: true },
  mediaUrl: { type: String },
  isCustom: { type: Boolean, required: true, default: false },
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', index: { sparse: true } },
});

export const ExerciseModel = model<ExerciseDocument>('Exercise', exerciseSchema);
