import { Types } from 'mongoose';
import { UserModel } from '../../db/models/User.js';
import { WorkoutPlanModel } from '../../db/models/WorkoutPlan.js';
import { WorkoutSessionModel } from '../../db/models/WorkoutSession.js';
import { AttendanceRecordModel } from '../../db/models/AttendanceRecord.js';

/** trainerId scopes the roster to that trainer's own assigned members only - pass undefined for
 * the tenant-wide roster (legitimate for admin/superadmin, who manage the whole gym, but never for
 * a trainer - see trainer/service.ts's listMembers(), which is the only caller that decides this). */
export async function findMembersByTenant(tenantId: string, trainerId?: string) {
  return UserModel.find({ tenantId, role: 'member', ...(trainerId ? { assignedTrainerId: trainerId } : {}) });
}

export async function findMemberByIdInTenant(memberId: string, tenantId: string) {
  return UserModel.findOne({ _id: memberId, tenantId, role: 'member' });
}

/** Same lookup, additionally scoped to a specific assigned trainer - used wherever a trainer (as
 * opposed to an admin) reaches for one member's record by id, so a trainer can never fetch a
 * member who isn't actually theirs just by guessing an id. */
export async function findAssignedMemberByIdInTenant(memberId: string, tenantId: string, trainerId: string) {
  return UserModel.findOne({ _id: memberId, tenantId, role: 'member', assignedTrainerId: trainerId });
}

export async function findTrainerByIdInTenant(trainerId: string, tenantId: string) {
  return UserModel.findOne({ _id: trainerId, tenantId, role: 'trainer' });
}

/** Real trainers only (role: 'trainer') - distinct from classes/repository.ts's
 * findTrainersByTenant(), which also includes admin/superadmin since an owner can lead a class
 * too. Assigning a *member's trainer* is narrower: it must be an actual trainer account, because
 * every scoping check elsewhere (roster, messaging) keys specifically off role === 'trainer'.
 * Full documents (not just firstName/lastName) - also backs the Trainer Management page, which
 * needs trainerPermissions/reportsToRole per trainer, not just an id/name pair for a dropdown. */
export async function findRealTrainersByTenant(tenantId: string) {
  return UserModel.find({ tenantId, role: 'trainer' });
}

export async function updateTrainerPermissions(
  trainerId: string,
  tenantId: string,
  updates: { canManageExerciseLibrary?: boolean; canManageMealLibrary?: boolean },
) {
  const setOps: Record<string, boolean> = {};
  if (updates.canManageExerciseLibrary !== undefined) setOps['trainerPermissions.canManageExerciseLibrary'] = updates.canManageExerciseLibrary;
  if (updates.canManageMealLibrary !== undefined) setOps['trainerPermissions.canManageMealLibrary'] = updates.canManageMealLibrary;
  return UserModel.findOneAndUpdate({ _id: trainerId, tenantId, role: 'trainer' }, { $set: setOps }, { new: true });
}

export async function assignTrainerToMember(memberId: string, tenantId: string, trainerId: string | null) {
  const update = trainerId ? { $set: { assignedTrainerId: trainerId } } : { $unset: { assignedTrainerId: '' } };
  return UserModel.findOneAndUpdate({ _id: memberId, tenantId, role: 'member' }, update, { new: true });
}

/** id -> "First Last" lookup map, used to attach each member's assigned trainer name onto the
 * roster without a per-member query (see trainer/service.ts's listMembers). */
export async function findNamesByIds(userIds: string[]) {
  const docs = await UserModel.find({ _id: { $in: userIds } }).select('firstName lastName');
  return new Map(docs.map((d) => [d._id.toString(), `${d.firstName} ${d.lastName}`]));
}

export async function updateMemberStatus(memberId: string, tenantId: string, status: 'active' | 'inactive' | 'suspended') {
  return UserModel.findOneAndUpdate({ _id: memberId, tenantId, role: 'member' }, { $set: { status } }, { new: true });
}

export async function findActivePlanForUser(userId: string) {
  return WorkoutPlanModel.findOne({ userId, active: true }).sort({ createdAt: -1 });
}

export async function countSessionsForUser(userId: string) {
  return WorkoutSessionModel.countDocuments({ userId });
}

/** Batched sibling of findActivePlanForUser - one query for every member's most recent active
 * plan instead of one per member (see trainer/service.ts's listMembers). Sorted the same way
 * (createdAt desc) then reduced to first-seen-per-user, so it's the same "most recent" pick. */
export async function findActivePlansForUsers(userIds: string[]) {
  const plans = await WorkoutPlanModel.find({ userId: { $in: userIds }, active: true }).sort({ createdAt: -1 });
  const map = new Map<string, (typeof plans)[number]>();
  for (const plan of plans) {
    const key = plan.userId.toString();
    if (!map.has(key)) map.set(key, plan);
  }
  return map;
}

/** Batched sibling of countSessionsForUser - one aggregation for every member's session count
 * instead of one countDocuments per member. Aggregate pipelines skip Mongoose's automatic
 * string->ObjectId query casting, so the ids are cast explicitly here. */
export async function countSessionsForUsers(userIds: string[]) {
  const objectIds = userIds.map((id) => new Types.ObjectId(id));
  const rows = await WorkoutSessionModel.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { userId: { $in: objectIds } } },
    { $group: { _id: '$userId', count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [r._id.toString(), r.count]));
}

export async function countMembersCheckedInSince(memberIds: string[], since: Date) {
  const distinctUsers = await AttendanceRecordModel.distinct('userId', {
    userId: { $in: memberIds },
    checkedInAt: { $gte: since },
  });
  return distinctUsers.length;
}

export async function countSessionsToday(memberIds: string[], startOfDay: Date, endOfDay: Date) {
  return WorkoutSessionModel.countDocuments({
    userId: { $in: memberIds },
    date: { $gte: startOfDay, $lt: endOfDay },
  });
}

export async function findPlanById(id: string) {
  return WorkoutPlanModel.findById(id);
}

export async function createPlanCopyForMember(input: {
  sourcePlan: { name: string; goal: string; days: unknown };
  memberId: string;
  trainerId: string;
}) {
  return WorkoutPlanModel.create({
    userId: input.memberId,
    trainerId: input.trainerId,
    name: input.sourcePlan.name,
    goal: input.sourcePlan.goal,
    generatedBy: 'trainer',
    active: true,
    days: input.sourcePlan.days,
  });
}
