import { Types, type HydratedDocument } from 'mongoose';
import type { BodyMetric, PersonalRecord } from '@fitpulse/shared';
import { BodyMetricModel, type BodyMetricDocument } from '../../db/models/BodyMetric.js';
import { PersonalRecordModel, type PersonalRecordDocument, type PRUnit } from '../../db/models/PersonalRecord.js';
import { idStr, isoStr } from '../../lib/mappers-base.js';

export function toDomainMetric(doc: HydratedDocument<BodyMetricDocument>): BodyMetric {
  return {
    id: idStr(doc._id),
    userId: idStr(doc.userId),
    recordedAt: isoStr(doc.recordedAt),
    weightKg: doc.weightKg,
    bodyFatPct: doc.bodyFatPct,
    measurements: doc.measurements,
  };
}

export function toDomainPR(doc: PersonalRecordDocument): PersonalRecord {
  return {
    id: idStr(doc._id),
    userId: idStr(doc.userId),
    exerciseId: idStr(doc.exerciseId),
    value: doc.value,
    unit: doc.unit,
    achievedAt: isoStr(doc.achievedAt),
  };
}

export async function findMetrics(userId: string) {
  return BodyMetricModel.find({ userId }).sort({ recordedAt: -1 });
}

export async function createMetric(input: {
  userId: string;
  weightKg?: number;
  bodyFatPct?: number;
  measurements?: BodyMetric['measurements'];
}) {
  return BodyMetricModel.create(input);
}

/** "Latest PR per (exerciseId, unit)" from the append-only history log. */
export async function findLatestPRs(userId: string) {
  const docs = await PersonalRecordModel.aggregate<PersonalRecordDocument>([
    { $match: { userId: Types.ObjectId.createFromHexString(userId) } },
    { $sort: { achievedAt: -1 } },
    { $group: { _id: { exerciseId: '$exerciseId', unit: '$unit' }, doc: { $first: '$$ROOT' } } },
    { $replaceRoot: { newRoot: '$doc' } },
  ]);
  return docs;
}

export async function findBestValue(userId: string, exerciseId: string, unit: PRUnit) {
  return PersonalRecordModel.findOne({ userId, exerciseId, unit }).sort({ value: -1 });
}

export async function createPR(input: { userId: string; exerciseId: string; value: number; unit: PRUnit }) {
  return PersonalRecordModel.create(input);
}
