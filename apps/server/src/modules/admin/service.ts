import type { AttendanceAnalytics, Branch, RecentCheckIn } from '@fitpulse/shared';
import { NotFoundError } from '../../lib/errors.js';
import * as repo from './repository.js';

export async function getAttendanceAnalytics(tenantId: string): Promise<AttendanceAnalytics[]> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 30);
  since.setUTCHours(0, 0, 0, 0);

  const rows = await repo.attendanceByDay(tenantId, since);
  return rows.map((row) => ({ date: row._id, count: row.count }));
}

export async function getBranch(tenantId: string): Promise<Branch> {
  const doc = await repo.findDefaultBranch(tenantId);
  return repo.toDomainBranch(doc);
}

interface UpdateBranchInput {
  name?: string;
  location?: string;
  capacity?: number;
  checkInMethods?: Branch['checkInMethods'];
  autoCheckoutEnabled?: boolean;
  autoCheckoutAfterMins?: number;
  guestPassEnabled?: boolean;
}

export async function updateBranch(tenantId: string, updates: UpdateBranchInput): Promise<Branch> {
  const branch = await repo.findDefaultBranch(tenantId);
  const updated = await repo.updateBranch(branch._id.toString(), updates);
  if (!updated) throw new NotFoundError('Branch not found');
  return repo.toDomainBranch(updated);
}

export async function getRecentAttendance(tenantId: string, limit: number): Promise<RecentCheckIn[]> {
  const rows = await repo.findRecentAttendance(tenantId, limit);

  return rows
    .filter((row) => row.userId !== null)
    .map((row) => ({
      id: String(row._id),
      memberId: String(row.userId!._id),
      memberName: `${row.userId!.firstName} ${row.userId!.lastName}`,
      method: row.method as RecentCheckIn['method'],
      checkedInAt: row.checkedInAt.toISOString(),
    }));
}
