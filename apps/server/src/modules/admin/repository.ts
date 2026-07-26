import type { HydratedDocument } from 'mongoose';
import type { Branch } from '@fitpulse/shared';
import { UserModel } from '../../db/models/User.js';
import { AttendanceRecordModel } from '../../db/models/AttendanceRecord.js';
import { BranchModel, type BranchDocument } from '../../db/models/Branch.js';
import { getOrCreateDefaultBranch } from '../attendance/repository.js';

interface DailyCount {
  _id: string;
  count: number;
}

export async function attendanceByDay(tenantId: string, since: Date) {
  const memberIds = await UserModel.find({ tenantId }).distinct('_id');

  return AttendanceRecordModel.aggregate<DailyCount>([
    { $match: { userId: { $in: memberIds }, checkedInAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$checkedInAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
}

export function toDomainBranch(doc: HydratedDocument<BranchDocument>): Branch {
  return {
    id: doc._id.toString(),
    tenantId: doc.tenantId.toString(),
    name: doc.name,
    location: doc.location,
    qrCodeToken: doc.qrCodeToken,
    capacity: doc.capacity,
    checkInMethods: doc.checkInMethods,
    autoCheckoutEnabled: doc.autoCheckoutEnabled,
    autoCheckoutAfterMins: doc.autoCheckoutAfterMins,
    guestPassEnabled: doc.guestPassEnabled,
  };
}

/** Single default branch per tenant, same convention attendance check-in already relies on. */
export async function findDefaultBranch(tenantId: string) {
  return getOrCreateDefaultBranch(tenantId);
}

export async function updateBranch(branchId: string, updates: Partial<BranchDocument>) {
  return BranchModel.findByIdAndUpdate(branchId, { $set: updates }, { new: true });
}

interface RecentCheckInRow {
  _id: unknown;
  checkedInAt: Date;
  method: string;
  userId: { _id: unknown; firstName: string; lastName: string } | null;
}

export async function findRecentAttendance(tenantId: string, limit: number) {
  const memberIds = await UserModel.find({ tenantId }).distinct('_id');

  const rows = await AttendanceRecordModel.find({ userId: { $in: memberIds } })
    .sort({ checkedInAt: -1 })
    .limit(limit)
    .populate<{ userId: { _id: unknown; firstName: string; lastName: string } }>('userId', 'firstName lastName')
    .lean<RecentCheckInRow[]>();

  return rows;
}

export async function countNewEnrollments(tenantId: string, since: Date) {
  return UserModel.countDocuments({ tenantId, role: 'member', createdAt: { $gte: since } });
}
