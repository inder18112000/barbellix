import { Schema, model, Types } from 'mongoose';
import type { CheckInMethod } from '@barbellix/shared';

const CHECK_IN_METHODS: CheckInMethod[] = ['qr', 'nfc', 'pin', 'manual'];

export interface AttendanceRecordDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  branchId: Types.ObjectId;
  checkedInAt: Date;
  checkOutAt?: Date;
  method: CheckInMethod;
}

const attendanceRecordSchema = new Schema<AttendanceRecordDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
  checkedInAt: { type: Date, required: true, default: Date.now },
  checkOutAt: { type: Date },
  method: { type: String, enum: CHECK_IN_METHODS, required: true },
});

attendanceRecordSchema.index({ userId: 1, checkedInAt: -1 });

export const AttendanceRecordModel = model<AttendanceRecordDocument>('AttendanceRecord', attendanceRecordSchema);
