import type { AttendanceAnalytics } from '@fitpulse/shared';
import * as repo from './repository.js';

export async function getAttendanceAnalytics(tenantId: string): Promise<AttendanceAnalytics[]> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 30);
  since.setUTCHours(0, 0, 0, 0);

  const rows = await repo.attendanceByDay(tenantId, since);
  return rows.map((row) => ({ date: row._id, count: row.count }));
}
