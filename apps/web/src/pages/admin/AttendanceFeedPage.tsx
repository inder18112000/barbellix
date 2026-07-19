import { observer } from 'mobx-react-lite'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { RefreshCw, Radio, QrCode, Nfc, Hash, Hand } from 'lucide-react'
import { queryKeys, fetchRecentAttendance } from '@/api/queries'
import type { CheckInMethod } from '@fitpulse/shared'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'

const METHOD_ICON: Record<CheckInMethod, typeof QrCode> = {
  qr: QrCode,
  nfc: Nfc,
  pin: Hash,
  manual: Hand,
}

export const AttendanceFeedPage = observer(function AttendanceFeedPage() {
  const { data, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: [...queryKeys.admin.recentAttendance, 50],
    queryFn: () => fetchRecentAttendance(50),
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Attendance feed</h1>
          <p className="mt-1 text-muted-foreground">The most recent check-ins across your gym.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={isFetching ? 'size-4 animate-spin' : 'size-4'} />
          Refresh
        </Button>
      </div>

      {isPending ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : isError ? (
        <ErrorState message="Couldn't load the attendance feed." />
      ) : data.length === 0 ? (
        <EmptyState icon={<Radio className="size-5" />} title="No check-ins yet" description="Recent check-ins will show up here as members arrive." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="flex flex-col divide-y divide-border">
              {data.map((entry) => {
                const Icon = METHOD_ICON[entry.method]
                return (
                  <li key={entry.id} className="flex items-center gap-3 px-6 py-3.5">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <span className="font-medium">{entry.memberName}</span>
                      <span className="text-xs text-muted-foreground capitalize">{entry.method} check-in</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{formatDistanceToNow(new Date(entry.checkedInAt), { addSuffix: true })}</span>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
})
