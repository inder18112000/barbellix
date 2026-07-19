import { observer } from 'mobx-react-lite'
import { useQuery } from '@tanstack/react-query'
import { Users, CalendarCheck, TrendingUp, Activity } from 'lucide-react'
import { authStore } from '@/store/authStore'
import { queryKeys, fetchTrainerStats, fetchAttendanceAnalytics, fetchRecentAttendance } from '@/api/queries'
import { StatCard } from '@/components/common/StatCard'
import { ErrorState } from '@/components/common/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'

export const AdminHomePage = observer(function AdminHomePage() {
  const statsQuery = useQuery({ queryKey: queryKeys.trainer.stats, queryFn: fetchTrainerStats })
  const analyticsQuery = useQuery({ queryKey: queryKeys.admin.attendanceAnalytics, queryFn: fetchAttendanceAnalytics })
  const recentQuery = useQuery({ queryKey: [...queryKeys.admin.recentAttendance, 5], queryFn: () => fetchRecentAttendance(5) })

  const checkinsLast30d = analyticsQuery.data?.reduce((sum, row) => sum + row.count, 0) ?? 0

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome, {authStore.user?.firstName}</h1>
        <p className="mt-1 text-muted-foreground">Here's how your gym is doing right now.</p>
      </div>

      {statsQuery.isError || analyticsQuery.isError ? (
        <ErrorState message="Couldn't load dashboard stats." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsQuery.isPending ? (
            <>
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </>
          ) : (
            <>
              <StatCard
                label="Active members"
                value={statsQuery.data.activeMembersCount}
                icon={<Users className="size-5" />}
              />
              <StatCard
                label="Sessions today"
                value={statsQuery.data.sessionsTodayCount}
                icon={<Activity className="size-5" />}
              />
              <StatCard
                label="Attendance rate"
                value={`${Math.round(statsQuery.data.attendanceRate * 100)}%`}
                icon={<TrendingUp className="size-5" />}
              />
              <StatCard
                label="Check-ins (30d)"
                value={checkinsLast30d}
                icon={<CalendarCheck className="size-5" />}
              />
            </>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentQuery.isPending ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-9" />
              <Skeleton className="h-9" />
              <Skeleton className="h-9" />
            </div>
          ) : recentQuery.isError ? (
            <ErrorState message="Couldn't load recent activity." />
          ) : recentQuery.data.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No check-ins yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {recentQuery.data.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="font-medium">{entry.memberName}</span>
                  <span className="text-muted-foreground">
                    checked in via {entry.method} · {formatDistanceToNow(new Date(entry.checkedInAt), { addSuffix: true })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
})
