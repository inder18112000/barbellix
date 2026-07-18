import { Schema, model, Types } from 'mongoose';

export type PRUnit = 'kg' | 'lbs' | 'reps' | 'secs';
const PR_UNITS: PRUnit[] = ['kg', 'lbs', 'reps', 'secs'];

export interface PersonalRecordDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  exerciseId: Types.ObjectId;
  value: number;
  unit: PRUnit;
  achievedAt: Date;
}

const personalRecordSchema = new Schema<PersonalRecordDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  exerciseId: { type: Schema.Types.ObjectId, ref: 'Exercise', required: true },
  value: { type: Number, required: true },
  unit: { type: String, enum: PR_UNITS, required: true },
  achievedAt: { type: Date, required: true, default: Date.now },
});

// Append-only history log; reads aggregate "latest per (exerciseId, unit)".
personalRecordSchema.index({ userId: 1, exerciseId: 1, unit: 1, achievedAt: -1 });

export const PersonalRecordModel = model<PersonalRecordDocument>('PersonalRecord', personalRecordSchema);
