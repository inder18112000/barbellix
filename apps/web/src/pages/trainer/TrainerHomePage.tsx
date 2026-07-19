import { observer } from 'mobx-react-lite'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Users, Activity, TrendingUp, ClipboardList, MessageSquare } from 'lucide-react'
import { authStore } from '@/store/authStore'
import { queryKeys, fetchTrainerStats, fetchTrainerMembers } from '@/api/queries'
import { StatCard } from '@/components/common/StatCard'
import { ErrorState } from '@/components/common/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserStatusBadge } from '@/lib/statusBadges'

export const TrainerHomePage = observer(function TrainerHomePage() {
  const statsQuery = useQuery({ queryKey: queryKeys.trainer.stats, queryFn: fetchTrainerStats })
  const membersQuery = useQuery({ queryKey: queryKeys.trainer.members, queryFn: fetchTrainerMembers })

  const recentMembers = [...(membersQuery.data ?? [])]
    .sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime())
    .slice(0, 5)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Welcome, {authStore.user?.firstName}</h1>
          <p className="mt-1 text-muted-foreground">Your roster at a glance.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/trainer/plans/new">
              <ClipboardList className="size-4" />
              Create plan
            </Link>
          </Button>
          <Button asChild>
            <Link to="/trainer/messages">
              <MessageSquare className="size-4" />
              Messages
            </Link>
          </Button>
        </div>
      </div>

      {statsQuery.isError ? (
        <ErrorState message="Couldn't load dashboard stats." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {statsQuery.isPending ? (
            <>
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </>
          ) : (
            <>
              <StatCard label="Active members" value={statsQuery.data.activeMembersCount} icon={<Users className="size-5" />} />
              <StatCard label="Sessions today" value={statsQuery.data.sessionsTodayCount} icon={<Activity className="size-5" />} />
              <StatCard
                label="Attendance rate"
                value={`${Math.round(statsQuery.data.attendanceRate * 100)}%`}
                icon={<TrendingUp className="size-5" />}
              />
            </>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recently joined</CardTitle>
        </CardHeader>
        <CardContent>
          {membersQuery.isPending ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-9" />
              <Skeleton className="h-9" />
              <Skeleton className="h-9" />
            </div>
          ) : membersQuery.isError ? (
            <ErrorState message="Couldn't load members." />
          ) : recentMembers.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No members yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {recentMembers.map((member) => (
                <li key={member.id}>
                  <Link
                    to={`/trainer/members/${member.id}`}
                    className="flex items-center justify-between py-2.5 text-sm transition-colors hover:text-primary"
                  >
                    <span className="font-medium">
                      {member.firstName} {member.lastName}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">{member.plan}</span>
                      <UserStatusBadge status={member.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
})
