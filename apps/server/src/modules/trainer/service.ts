import type { TrainerMemberSummary } from '@fitpulse/shared';
import { NotFoundError } from '../../lib/errors.js';
import { computeSummary } from '../attendance/service.js';
import * as repo from './repository.js';

export async function listMembers(tenantId: string): Promise<TrainerMemberSummary[]> {
  const members = await repo.findMembersByTenant(tenantId);

  return Promise.all(
    members.map(async (member) => {
      const userId = member._id.toString();
      const [activePlan, sessionsCount, attendance] = await Promise.all([
        repo.findActivePlanForUser(userId),
        repo.countSessionsForUser(userId),
        computeSummary(userId),
      ]);

      return {
        id: userId,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        plan: activePlan?.name ?? 'No active plan',
        streak: attendance.streak,
        sessionsCount,
        lastSeenAt: attendance.lastCheckedIn,
        joinDate: member.createdAt.toISOString(),
      };
    }),
  );
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
