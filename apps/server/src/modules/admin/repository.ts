import type { HydratedDocument } from 'mongoose';
import type { Branch } from '@barbellix/shared';
import { UserModel } from '../../db/models/User.js';
import { AttendanceRecordModel } from '../../db/models/AttendanceRecord.js';
import { BranchModel, type BranchDocument } from '../../db/models/Branch.js';
import { getOrCreateDefaultBranch } from '../attendance/repository.js';
import { idStr } from '../../lib/mappers-base.js';

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
    id: idStr(doc._id),
    tenantId: idStr(doc.tenantId),
    name: doc.name,
    location: doc.location,
    qrCodeToken: doc.qrCodeToken,
    checkInPin: doc.checkInPin,
    capacity: doc.capacity,
    checkInMethods: doc.checkInMethods,
    autoCheckoutEnabled: doc.autoCheckoutEnabled,
    autoCheckoutAfterMins: doc.autoCheckoutAfterMins,
    guestPassEnabled: doc.guestPassEnabled,
    gracePeriodDays: doc.gracePeriodDays,
    checkInIntervalDays: doc.checkInIntervalDays,
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

export async function countClientsBreakdown(tenantId: string) {
  const [totalClients, activeClients] = await Promise.all([
    UserModel.countDocuments({ tenantId, role: 'member' }),
    UserModel.countDocuments({ tenantId, role: 'member', status: 'active' }),
  ]);
  return { totalClients, activeClients };
}

/** Members with >=1 injury logged, not a count of injury entries. `'profile.injuries.0': {
 * $exists: true }` is the standard Mongo idiom for "array is non-empty" - no aggregation/$unwind
 * needed since this counts matching User documents, not array elements. */
export async function countMembersWithInjuries(tenantId: string) {
  return UserModel.countDocuments({ tenantId, role: 'member', 'profile.injuries.0': { $exists: true } });
}
