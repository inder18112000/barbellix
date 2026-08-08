import { Types } from 'mongoose';
import { TenantModel } from '../../db/models/Tenant.js';
import { UserModel } from '../../db/models/User.js';
import { MembershipModel } from '../../db/models/Membership.js';

/** Every tenant on the platform - deliberately not filtered by any single tenantId, unlike every
 * other query in this codebase. Only reachable via the superadmin-only routes in this module. */
export async function findAllTenants() {
  return TenantModel.find().sort({ createdAt: -1 });
}

export async function countMembersByTenant() {
  const rows = await UserModel.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { role: 'member' } },
    { $group: { _id: '$tenantId', count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [r._id.toString(), r.count]));
}

export async function countTrainersByTenant() {
  const rows = await UserModel.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { role: 'trainer' } },
    { $group: { _id: '$tenantId', count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [r._id.toString(), r.count]));
}

export async function countActiveMembershipsByTenant() {
  const rows = await MembershipModel.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { status: 'active' } },
    { $group: { _id: '$tenantId', count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [r._id.toString(), r.count]));
}

/** Not tenant-scoped, deliberately - a superadmin can reassign any trainer on the platform. Only
 * matches role: 'trainer' so this can never be used to silently promote/demote an admin. */
export async function updateTrainerReportsTo(trainerId: string, reportsToRole: 'admin' | 'superadmin') {
  return UserModel.findOneAndUpdate({ _id: trainerId, role: 'trainer' }, { $set: { reportsToRole } }, { new: true });
}

/** Members with >=1 injury logged, grouped by tenant - counts matching User documents (via the
 * "array non-empty" idiom, same as admin/repository.ts's countMembersWithInjuries), not injury
 * entries, so no $unwind is needed even across tenants. */
export async function countMembersWithInjuriesByTenant() {
  const rows = await UserModel.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { role: 'member', 'profile.injuries.0': { $exists: true } } },
    { $group: { _id: '$tenantId', count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [r._id.toString(), r.count]));
}
