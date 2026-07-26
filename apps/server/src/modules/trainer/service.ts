import { Types } from 'mongoose';
import type { TrainerMemberSummary } from '@fitpulse/shared';
import { NotFoundError } from '../../lib/errors.js';
import { toDomainUser } from '../../lib/mappers.js';
import { issuePairingToken } from '../../lib/pairingToken.js';
import { computeSummariesForUsers } from '../attendance/service.js';
import { getMembershipSummariesForUsers } from '../billing/service.js';
import { updateInfo as updateUserInfo } from '../users/repository.js';
import * as repo from './repository.js';

/** Fetches every member's plan/sessions/attendance/membership in a handful of batched queries
 * total (see the *ForUsers repository/service functions this calls) rather than the ~5 queries
 * per member this used to run - a 100-member roster used to fire 500+ queries, now it's ~6. */
export async function listMembers(tenantId: string): Promise<TrainerMemberSummary[]> {
  const members = await repo.findMembersByTenant(tenantId);
  const userIds = members.map((m) => m._id.toString());

  const [activePlans, sessionCounts, attendanceSummaries, membershipSummaries] = await Promise.all([
    repo.findActivePlansForUsers(userIds),
    repo.countSessionsForUsers(userIds),
    computeSummariesForUsers(userIds),
    getMembershipSummariesForUsers(userIds),
  ]);

  return members.map((member) => {
    const userId = member._id.toString();
    const activePlan = activePlans.get(userId);
    const attendance = attendanceSummaries.get(userId)!;
    const membership = membershipSummaries.get(userId)!;

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
    };
  });
}

export async function getStats(tenantId: string) {
  const members = await repo.findMembersByTenant(tenantId);
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

export async function assignPlan(trainerId: string, tenantId: string, memberId: string, planId: string) {
  const member = await repo.findMemberByIdInTenant(memberId, tenantId);
  if (!member) throw new NotFoundError('Member not found');

  const sourcePlan = await repo.findPlanById(planId);
  if (!sourcePlan) throw new NotFoundError('Source plan not found');

  const newPlan = await repo.createPlanCopyForMember({
    sourcePlan: { name: sourcePlan.name, goal: sourcePlan.goal, days: sourcePlan.days },
    memberId,
    trainerId,
  });

  return { memberId, planId: newPlan._id.toString(), success: true };
}
