import { Schema, model, Types } from 'mongoose';
import type { DayOfWeek } from '@fitpulse/shared';

export interface ClassTemplateOccurrenceSubdoc {
  dayOfWeek: DayOfWeek;
  startTime: string;
  durationMins: number;
}

export interface ClassTemplateDocument {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  branchId: Types.ObjectId;
  name: string;
  trainerId: Types.ObjectId;
  occurrences: ClassTemplateOccurrenceSubdoc[];
  capacity: number;
  active: boolean;
}

const occurrenceSchema = new Schema<ClassTemplateOccurrenceSubdoc>(
  {
    dayOfWeek: { type: Number, min: 0, max: 6, required: true },
    startTime: { type: String, required: true },
    durationMins: { type: Number, required: true },
  },
  { _id: false },
);

const classTemplateSchema = new Schema<ClassTemplateDocument>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
  name: { type: String, required: true },
  trainerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  occurrences: { type: [occurrenceSchema], default: [] },
  capacity: { type: Number, required: true },
  active: { type: Boolean, required: true, default: true },
});

export const ClassTemplateModel = model<ClassTemplateDocument>('ClassTemplate', classTemplateSchema);
