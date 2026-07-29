import { Schema, model, Types } from 'mongoose';
import type { BookingStatus } from '@barbellix/shared';

export interface BookingDocument {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  sessionId: Types.ObjectId;
  userId: Types.ObjectId;
  status: BookingStatus;
  createdAt: Date;
}

const bookingSchema = new Schema<BookingDocument>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    sessionId: { type: Schema.Types.ObjectId, ref: 'ClassSession', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['booked', 'waitlisted', 'cancelled'], required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// A cancelled booking frees the user to book again (or get re-waitlisted), so the uniqueness
// guard against double-booking only applies to their still-live booking, if any.
bookingSchema.index(
  { sessionId: 1, userId: 1 },
  { unique: true, partialFilterExpression: { status: { $ne: 'cancelled' } } },
);

export const BookingModel = model<BookingDocument>('Booking', bookingSchema);
