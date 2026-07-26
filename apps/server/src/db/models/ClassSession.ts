import { Schema, model, Types } from 'mongoose';
import type { ClassSessionStatus } from '@fitpulse/shared';

export interface ClassSessionDocument {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  branchId: Types.ObjectId;
  templateId: Types.ObjectId;
  name: string;
  trainerId: Types.ObjectId;
  date: string; // "YYYY-MM-DD" - a calendar date, not a timezone-sensitive Date
  startTime: string; // "HH:MM"
  durationMins: number;
  capacity: number;
  bookedCount: number;
  waitlistCount: number;
  status: ClassSessionStatus;
}

const classSessionSchema = new Schema<ClassSessionDocument>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
  templateId: { type: Schema.Types.ObjectId, ref: 'ClassTemplate', required: true },
  name: { type: String, required: true },
  trainerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  durationMins: { type: Number, required: true },
  capacity: { type: Number, required: true },
  bookedCount: { type: Number, required: true, default: 0 },
  waitlistCount: { type: Number, required: true, default: 0 },
  status: { type: String, enum: ['scheduled', 'cancelled'], required: true, default: 'scheduled' },
});

// Makes lazy session generation safely idempotent - generating for an overlapping date range
// twice just no-ops on the sessions that already exist instead of duplicating them.
classSessionSchema.index({ templateId: 1, date: 1 }, { unique: true });

export const ClassSessionModel = model<ClassSessionDocument>('ClassSession', classSessionSchema);
