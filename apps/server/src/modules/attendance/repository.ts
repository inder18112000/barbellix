import type { HydratedDocument } from 'mongoose';
import type { AttendanceRecord } from '@fitpulse/shared';
import { AttendanceRecordModel, type AttendanceRecordDocument } from '../../db/models/AttendanceRecord.js';
import { BranchModel } from '../../db/models/Branch.js';

export function toDomainRecord(doc: HydratedDocument<AttendanceRecordDocument>): AttendanceRecord {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    branchId: doc.branchId.toString(),
    checkedInAt: doc.checkedInAt.toISOString(),
    checkOutAt: doc.checkOutAt?.toISOString(),
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
  const existing = await BranchModel.findOne({ tenantId, name: 'FitPulse Default Branch' });
  if (existing) return existing;

  return BranchModel.create({
    tenantId,
    name: 'FitPulse Default Branch',
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
