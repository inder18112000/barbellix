import { Types } from 'mongoose';
import type { TrainerMemberSummary, UserRole } from '@barbellix/shared';
import { ForbiddenError, NotFoundError } from '../../lib/errors.js';
import { toDomainUser } from '../../lib/mappers.js';
import { issuePairingToken } from '../../lib/pairingToken.js';
import { computeSummariesForUsers } from '../attendance/service.js';
import { getMembershipSummariesForUsers } from '../billing/service.js';
import { updateInfo as updateUserInfo } from '../users/repository.js';
import * as repo from './repository.js';

/** Fetches every member's plan/sessions/attendance/membership in a handful of batched queries
 * total (see the *ForUsers repository/service functions this calls) rather than the ~5 queries
 * per member this used to run - a 100-member roster used to fire 500+ queries, now it's ~6.
 *
 * `requester` decides the roster's scope: a trainer only ever sees members with an active
 * assignment to *them* specifically (never the whole tenant), while admin/superadmin - who
 * actually manage the whole gym - see every member. This is enforced here, not just hidden in the
 * UI, because this same function backs the /trainer/members endpoint for all three roles. */
export async function listMembers(
  tenantId: string,
  requester: { id: string; role: UserRole },
): Promise<TrainerMemberSummary[]> {
  const scopedTrainerId = requester.role === 'trainer' ? requester.id : undefined;
  const members = await repo.findMembersByTenant(tenantId, scopedTrainerId);
  const userIds = members.map((m) => m._id.toString());
  const trainerIds = [...new Set(members.map((m) => m.assignedTrainerId?.toString()).filter((id): id is string => !!id))];

  const [activePlans, sessionCounts, attendanceSummaries, membershipSummaries, trainerNames] = await Promise.all([
    repo.findActivePlansForUsers(userIds),
    repo.countSessionsForUsers(userIds),
    computeSummariesForUsers(userIds),
    getMembershipSummariesForUsers(userIds),
    trainerIds.length > 0 ? repo.findNamesByIds(trainerIds) : Promise.resolve(new Map<string, string>()),
  ]);

  return members.map((member) => {
    const userId = member._id.toString();
    const activePlan = activePlans.get(userId);
    const attendance = attendanceSummaries.get(userId)!;
    const membership = membershipSummaries.get(userId)!;
    const assignedTrainerId = member.assignedTrainerId?.toString();

    return {
      id: userId,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: member.phone,
      status: member.status,
      plan: activePlan?.name ?? 'No active plan',
      streak: attendance.streak,
      sessionsCount: sessionCounts.get(userId) ?? 0,
      lastSeenAt: attendance.lastCheckedIn,
      joinDate: member.createdAt.toISOString(),
      membershipPlan: membership.plan,
      membershipStatus: membership.status,
      paymentStatus: membership.paymentStatus,
      paymentMethod: membership.paymentMethod,
      subscriptionStatus: membership.subscriptionStatus,
      membershipStartDate: membership.startDate,
      membershipEndDate: membership.endDate,
      assignedTrainerId,
      assignedTrainerName: assignedTrainerId ? trainerNames.get(assignedTrainerId) : undefined,
    };
  });
}

export async function getStats(tenantId: string, requester: { id: string; role: UserRole }) {
  const scopedTrainerId = requester.role === 'trainer' ? requester.id : undefined;
  const members = await repo.findMembersByTenant(tenantId, scopedTrainerId);
  const memberIds = members.map((m) => m._id.toString());

  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

  const [checkedInThisMonth, sessionsTodayCount] = await Promise.all([
    repo.countMembersCheckedInSince(memberIds, startOfMonth),
    repo.countSessionsToday(memberIds, startOfDay, endOfDay),
  ]);

  return {
    activeMembersCount: memberIds.length,
    sessionsTodayCount,
    attendanceRate: memberIds.length > 0 ? Math.round((checkedInThisMonth / memberIds.length) * 100) : 0,
  };
}

export async function updateMemberStatus(tenantId: string, memberId: string, status: 'active' | 'inactive' | 'suspended') {
  const updated = await repo.updateMemberStatus(memberId, tenantId, status);
  if (!updated) throw new NotFoundError('Member not found');
  return { memberId, status: updated.status };
}

/** Reuses the exact same update path a member uses to edit their own info (users/repository.ts's
 * updateInfo) - the only new thing here is the tenant-ownership check, since this is being
 * called by an admin about someone else's account rather than by the account owner. */
export async function updateMemberInfo(
  tenantId: string,
  memberId: string,
  updates: { firstName?: string; lastName?: string; phone?: string },
) {
  const member = await repo.findMemberByIdInTenant(memberId, tenantId);
  if (!member) throw new NotFoundError('Member not found');

  const updated = await updateUserInfo(memberId, updates);
  if (!updated) throw new NotFoundError('Member not found');
  return toDomainUser(updated);
}

/** Generates a one-time QR device-pairing token for this member's first mobile login - see
 * lib/pairingToken.ts and auth/service.ts's pairDevice() for the redemption side. */
export async function generateLoginPairingToken(tenantId: string, memberId: string) {
  const member = await repo.findMemberByIdInTenant(memberId, tenantId);
  if (!member) throw new NotFoundError('Member not found');

  const { token, expiresAt } = await issuePairingToken(new Types.ObjectId(memberId), new Types.ObjectId(tenantId));
  return { token, expiresAt: expiresAt.toISOString() };
}

export async function assignPlan(
  requester: { id: string; role: UserRole },
  tenantId: string,
  memberId: string,
  planId: string,
) {
  // A trainer may only assign plans to their own assigned members; admin/superadmin manage the
  // whole roster and can assign to anyone in the tenant.
  const member =
    requester.role === 'trainer'
      ? await repo.findAssignedMemberByIdInTenant(memberId, tenantId, requester.id)
      : await repo.findMemberByIdInTenant(memberId, tenantId);
  if (!member) throw new NotFoundError('Member not found');

  const sourcePlan = await repo.findPlanById(planId);
  if (!sourcePlan) throw new NotFoundError('Source plan not found');

  const newPlan = await repo.createPlanCopyForMember({
    sourcePlan: { name: sourcePlan.name, goal: sourcePlan.goal, days: sourcePlan.days },
    memberId,
    trainerId: requester.id,
  });

  return { memberId, planId: newPlan._id.toString(), success: true };
}

/** Single-purpose, matching the established GET /admin/members/:memberId/progress convention
 * rather than a kitchen-sink member-detail endpoint. Same scope split as assignPlan() above: a
 * trainer only reaches their own assigned member's injuries, never the whole tenant's. */
export async function getMemberInjuries(requester: { id: string; role: UserRole }, tenantId: string, memberId: string) {
  const member =
    requester.role === 'trainer'
      ? await repo.findAssignedMemberByIdInTenant(memberId, tenantId, requester.id)
      : await repo.findMemberByIdInTenant(memberId, tenantId);
  if (!member) throw new NotFoundError('Member not found');

  return toDomainUser(member).profile.injuries ?? [];
}

/** Admin can manage permissions for their own tenant's trainers - but only the ones who report to
 * them (reportsToRole: 'admin'). A trainer escalated to reportsToRole: 'superadmin' can only have
 * their permissions changed by a superadmin, even by their own gym's admin. */
export async function setTrainerPermissions(
  tenantId: string,
  trainerId: string,
  updates: { canManageExerciseLibrary?: boolean; canManageMealLibrary?: boolean },
  requesterRole: UserRole,
) {
  const trainer = await repo.findTrainerByIdInTenant(trainerId, tenantId);
  if (!trainer) throw new NotFoundError('Trainer not found');

  if (trainer.reportsToRole === 'superadmin' && requesterRole !== 'superadmin') {
    throw new ForbiddenError('This trainer reports directly to a super admin - only a super admin can change their permissions');
  }

  const updated = await repo.updateTrainerPermissions(trainerId, tenantId, updates);
  if (!updated) throw new NotFoundError('Trainer not found');
  return toDomainUser(updated);
}

/** Backs both the assign-trainer dropdown (id/name only, used) and the Trainer Management page
 * (also reads email/trainerPermissions/reportsToRole) - one endpoint, since both are "list this
 * tenant's real trainers" and splitting them would just be two near-identical queries. */
export async function listAvailableTrainers(tenantId: string) {
  const docs = await repo.findRealTrainersByTenant(tenantId);
  return docs.map((d) => ({
    id: d._id.toString(),
    name: `${d.firstName} ${d.lastName}`,
    email: d.email,
    trainerPermissions: d.trainerPermissions,
    reportsToRole: d.reportsToRole,
  }));
}

/** Admin/superadmin only - assigns (or clears, with trainerId: null) a member's trainer. Validates
 * the target is a real trainer in this tenant so a member can never end up "assigned" to a
 * non-trainer or someone from another gym. */
export async function assignTrainer(tenantId: string, memberId: string, trainerId: string | null) {
  const member = await repo.findMemberByIdInTenant(memberId, tenantId);
  if (!member) throw new NotFoundError('Member not found');

  if (trainerId) {
    const trainer = await repo.findTrainerByIdInTenant(trainerId, tenantId);
    if (!trainer) throw new NotFoundError('Trainer not found');
  }

  const updated = await repo.assignTrainerToMember(memberId, tenantId, trainerId);
  if (!updated) throw new NotFoundError('Member not found');
  return toDomainUser(updated);
}
