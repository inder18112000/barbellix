import type { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';
import type { AttendanceRecord } from '@barbellix/shared';
import { AttendanceRecordModel, type AttendanceRecordDocument } from '../../db/models/AttendanceRecord.js';
import { BranchModel } from '../../db/models/Branch.js';
import { idStr, isoStr } from '../../lib/mappers-base.js';

export function toDomainRecord(doc: HydratedDocument<AttendanceRecordDocument>): AttendanceRecord {
  return {
    id: idStr(doc._id),
    userId: idStr(doc.userId),
    branchId: idStr(doc.branchId),
    checkedInAt: isoStr(doc.checkedInAt),
    checkOutAt: isoStr(doc.checkOutAt),
    method: doc.method,
  };
}

export async function findBranchByQrToken(qrToken: string) {
  return BranchModel.findOne({ qrCodeToken: qrToken });
}

export async function findBranchById(id: string) {
  return BranchModel.findById(id);
}

/** Every default-tenant member checks into a single seeded default branch until real branch selection exists. */
export async function getOrCreateDefaultBranch(tenantId: string) {
  const existing = await BranchModel.findOne({ tenantId, name: 'BarBellix Default Branch' });
  if (existing) return existing;

  return BranchModel.create({
    tenantId,
    name: 'BarBellix Default Branch',
    location: 'Main location',
    qrCodeToken: `default-branch-${tenantId}`,
  });
}

export async function createRecord(input: {
  userId: string;
  branchId: string;
  method: AttendanceRecordDocument['method'];
}) {
  return AttendanceRecordModel.create(input);
}

export async function findHistory(userId: string) {
  return AttendanceRecordModel.find({ userId }).sort({ checkedInAt: -1 });
}

export async function findThisMonthCount(userId: string, startOfMonth: Date) {
  return AttendanceRecordModel.countDocuments({ userId, checkedInAt: { $gte: startOfMonth } });
}

export async function findRecentCheckInDates(userId: string, limit = 60) {
  const records = await AttendanceRecordModel.find({ userId })
    .sort({ checkedInAt: -1 })
    .limit(limit)
    .select('checkedInAt');
  return records.map((r) => r.checkedInAt);
}

/** Batched sibling of findThisMonthCount - one aggregation instead of one countDocuments per
 * member, for roster-style pages that need this for every member at once (see trainer/service.ts
 * listMembers). Aggregate pipelines skip Mongoose's automatic string->ObjectId query casting, so
 * the ids are cast explicitly here (unlike the single-user finds above, which cast for free). */
export async function findThisMonthCountsForUsers(userIds: string[], startOfMonth: Date) {
  const objectIds = userIds.map((id) => new Types.ObjectId(id));
  const rows = await AttendanceRecordModel.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { userId: { $in: objectIds }, checkedInAt: { $gte: startOfMonth } } },
    { $group: { _id: '$userId', count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [r._id.toString(), r.count]));
}

/** Batched sibling of findRecentCheckInDates - one aggregation for every member's most recent
 * check-in dates instead of one query per member. */
export async function findRecentCheckInDatesForUsers(userIds: string[], limit = 60) {
  const objectIds = userIds.map((id) => new Types.ObjectId(id));
  const rows = await AttendanceRecordModel.aggregate<{ _id: Types.ObjectId; dates: Date[] }>([
    { $match: { userId: { $in: objectIds } } },
    { $sort: { checkedInAt: -1 } },
    { $group: { _id: '$userId', dates: { $push: '$checkedInAt' } } },
    { $project: { dates: { $slice: ['$dates', limit] } } },
  ]);
  return new Map(rows.map((r) => [r._id.toString(), r.dates]));
}
