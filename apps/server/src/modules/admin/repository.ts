import { UserModel } from '../../db/models/User.js';
import { AttendanceRecordModel } from '../../db/models/AttendanceRecord.js';

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
