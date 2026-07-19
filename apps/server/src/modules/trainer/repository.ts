import { UserModel } from '../../db/models/User.js';
import { WorkoutPlanModel } from '../../db/models/WorkoutPlan.js';
import { WorkoutSessionModel } from '../../db/models/WorkoutSession.js';
import { AttendanceRecordModel } from '../../db/models/AttendanceRecord.js';

export async function findMembersByTenant(tenantId: string) {
  return UserModel.find({ tenantId, role: 'member' });
}

export async function findMemberByIdInTenant(memberId: string, tenantId: string) {
  return UserModel.findOne({ _id: memberId, tenantId, role: 'member' });
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
