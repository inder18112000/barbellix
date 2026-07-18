import { Schema, model, Types } from 'mongoose';
import type { BodyMeasurements } from '@fitpulse/shared';

export interface BodyMetricDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  recordedAt: Date;
  weightKg?: number;
  bodyFatPct?: number;
  measurements?: BodyMeasurements;
}

const bodyMeasurementsSchema = new Schema<BodyMeasurements>(
  {
    chestCm: { type: Number },
    waistCm: { type: Number },
    hipsCm: { type: Number },
    armCm: { type: Number },
    thighCm: { type: Number },
  },
  { _id: false },
);

const bodyMetricSchema = new Schema<BodyMetricDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recordedAt: { type: Date, required: true, default: Date.now },
  weightKg: { type: Number },
  bodyFatPct: { type: Number },
  measurements: { type: bodyMeasurementsSchema },
});

bodyMetricSchema.index({ userId: 1, recordedAt: -1 });

export const BodyMetricModel = model<BodyMetricDocument>('BodyMetric', bodyMetricSchema);
