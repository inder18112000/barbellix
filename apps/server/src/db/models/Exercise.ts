import { Schema, model, Types } from 'mongoose';
import type { MuscleGroup, Equipment, ExerciseTag } from '@barbellix/shared';
import { MUSCLE_GROUPS, EQUIPMENT, EXERCISE_TAGS } from '@barbellix/shared';

export interface ExerciseDocument {
  _id: Types.ObjectId;
  name: string;
  muscleGroups: MuscleGroup[];
  equipment: Equipment[];
  instructions: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  tags: ExerciseTag[];
  isCustom: boolean;
  tenantId?: Types.ObjectId;
}

const exerciseSchema = new Schema<ExerciseDocument>({
  name: { type: String, required: true },
  muscleGroups: { type: [String], enum: MUSCLE_GROUPS, default: [] },
  equipment: { type: [String], enum: EQUIPMENT, default: [] },
  instructions: { type: String, required: true },
  mediaUrl: { type: String },
  mediaType: { type: String, enum: ['image', 'video'] },
  tags: { type: [String], enum: EXERCISE_TAGS, default: [] },
  isCustom: { type: Boolean, required: true, default: false },
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', index: { sparse: true } },
});

export const ExerciseModel = model<ExerciseDocument>('Exercise', exerciseSchema);
