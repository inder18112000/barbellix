import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useQuery } from '@tanstack/react-query'
import { format, addDays } from 'date-fns'
import { Users, ClipboardList } from 'lucide-react'
import { queryKeys, fetchBranch, fetchClassSchedule, fetchClassRoster } from '@/api/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

interface RosterRow {
  id: string
  memberName?: string
  memberEmail?: string
  status: string
}

export const ClassRosterPage = observer(function ClassRosterPage() {
  const [rosterSessionId, setRosterSessionId] = useState<string | null>(null)

  const branchQuery = useQuery({ queryKey: queryKeys.admin.branch, queryFn: fetchBranch })
  const from = format(new Date(), 'yyyy-MM-dd')
  const to = format(addDays(new Date(), 13), 'yyyy-MM-dd')

  const scheduleQuery = useQuery({
    queryKey: queryKeys.admin.classSchedule(branchQuery.data?.id ?? '', from, to),
    queryFn: () => fetchClassSchedule(branchQuery.data!.id, from, to),
    enabled: !!branchQuery.data,
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Class rosters</h1>
        <p className="mt-1 text-muted-foreground">Upcoming sessions for the next two weeks - open one to see who's booked.</p>
      </div>

      {scheduleQuery.isPending ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : scheduleQuery.isError ? (
        <ErrorState message="Couldn't load the schedule." />
      ) : !scheduleQuery.data || scheduleQuery.data.length === 0 ? (
        <EmptyState icon={<ClipboardList className="size-5" />} title="No upcoming classes" description="No sessions scheduled in the next two weeks." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {scheduleQuery.data.map((session) => (
            <Card key={session.id} className="cursor-pointer transition-colors hover:border-primary" onClick={() => setRosterSessionId(session.id)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{session.name}</CardTitle>
                <p className="text-xs text-muted-foreground">with {session.trainerName ?? 'Unassigned'}</p>
              </CardHeader>
              <CardContent className="flex items-center justify-between pt-0">
                <span className="text-sm text-muted-foreground">
                  {format(new Date(`${session.date}T00:00:00`), 'EEE, MMM d')} · {session.startTime}
                </span>
                <Badge variant={session.bookedCount >= session.capacity ? 'warning' : 'success'}>
                  {session.bookedCount}/{session.capacity}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RosterDialog sessionId={rosterSessionId} onClose={() => setRosterSessionId(null)} />
    </div>
  )
})

function RosterDialog({ sessionId, onClose }: { sessionId: string | null; onClose: () => void }) {
  const { data, isPending, isError } = useQuery({
    queryKey: sessionId ? queryKeys.admin.classRoster(sessionId) : ['admin', 'class-sessions', 'none'],
    queryFn: () => fetchClassRoster(sessionId!),
    enabled: !!sessionId,
  })

  const columns: DataTableColumn<RosterRow>[] = [
    { key: 'name', header: 'Member', render: (row) => <span>{row.memberName ?? 'Unknown'}</span> },
    { key: 'email', header: 'Email', className: 'text-sm text-muted-foreground', render: (row) => row.memberEmail ?? '—' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant={row.status === 'booked' ? 'success' : 'secondary'} className="capitalize">{row.status}</Badge>,
    },
  ]

  return (
    <Dialog open={!!sessionId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{data?.session.name ?? 'Roster'}</DialogTitle>
          <DialogDescription>Who's booked into this session.</DialogDescription>
        </DialogHeader>

        {isPending ? (
          <Skeleton className="h-32 w-full" />
        ) : isError ? (
          <ErrorState message="Couldn't load the roster." />
        ) : (
          <DataTable
            columns={columns}
            data={data!.bookings}
            getRowKey={(row) => row.id}
            emptyState={<EmptyState icon={<Users className="size-5" />} title="No bookings yet" />}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
