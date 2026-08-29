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

/** Admin-initiated account creation for either role - the account gets a random, never-shared
 * password hash (see trainer/service.ts's createTrainer()/createMember()) since the person's
 * first login is always the QR device-pairing flow, the same one already used for existing
 * accounts (see lib/pairingToken.ts), not a password they'd need to be told out of band. */
export async function createStaffAccount(input: {
  tenantId: string;
  role: 'trainer' | 'member';
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  passwordHash: string;
}) {
  return UserModel.create(input);
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

export async function findPlanForMember(planId: string, memberId: string) {
  return WorkoutPlanModel.findOne({ _id: planId, userId: memberId });
}

/** Deactivates every other active plan for a member - shared by createPlanCopyForMember and
 * supersedePlan below, so a member can never end up with two simultaneously active:true plans
 * (which would contradict the "Superseded" badge's implied one-active-plan invariant in the web
 * UI). `exceptPlanId` excludes the plan that's about to become the new active one, if it already
 * exists (supersedePlan creates the new doc after this call, so it has no id yet there). */
async function deactivateOtherActivePlans(memberId: string, exceptPlanId?: string) {
  await WorkoutPlanModel.updateMany(
    { userId: memberId, active: true, ...(exceptPlanId ? { _id: { $ne: exceptPlanId } } : {}) },
    { $set: { active: false } },
  );
}

export async function createPlanCopyForMember(input: {
  sourcePlan: { name: string; goal: string; days: unknown };
  memberId: string;
  trainerId: string;
}) {
  await deactivateOtherActivePlans(input.memberId);
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

/** Edits an existing plan by superseding it - the old doc is deactivated (never mutated in
 * place), a new version is created carrying the version/previousPlanId/changeSummary chain the
 * web UI already renders (the "v2" badge, "Superseded" badge, change-note bullets). */
export async function supersedePlan(
  oldPlan: { _id: Types.ObjectId; userId: Types.ObjectId; trainerId?: Types.ObjectId; name: string; goal: string; generatedBy: string; days: unknown; version: number },
  updates: { name?: string; goal?: string; days?: unknown },
  editedByUserId: string,
  changeNote?: string,
) {
  await WorkoutPlanModel.findByIdAndUpdate(oldPlan._id, { $set: { active: false } });
  await deactivateOtherActivePlans(oldPlan.userId.toString(), oldPlan._id.toString());

  return WorkoutPlanModel.create({
    userId: oldPlan.userId,
    trainerId: new Types.ObjectId(editedByUserId),
    name: updates.name ?? oldPlan.name,
    goal: updates.goal ?? oldPlan.goal,
    generatedBy: oldPlan.generatedBy,
    active: true,
    days: updates.days ?? oldPlan.days,
    version: oldPlan.version + 1,
    previousPlanId: oldPlan._id,
    changeSummary: changeNote ? [changeNote] : undefined,
  });
}
