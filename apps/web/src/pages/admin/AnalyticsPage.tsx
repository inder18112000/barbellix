import { observer } from 'mobx-react-lite'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { format } from 'date-fns'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BarChart3, TableIcon } from 'lucide-react'
import { queryKeys, fetchAttendanceAnalytics } from '@/api/queries'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

/** Backend groups by UTC calendar day and sends "YYYY-MM-DD" - parsing via `new Date(string)`
 * would read it as UTC-midnight and then shift a day back when formatted in a negative-offset
 * timezone, so the Y/M/D parts are read directly instead. */
function parseDayString(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const AnalyticsPage = observer(function AnalyticsPage() {
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const { data, isPending, isError } = useQuery({
    queryKey: queryKeys.admin.attendanceAnalytics,
    queryFn: fetchAttendanceAnalytics,
  })

  const total = data?.reduce((sum, row) => sum + row.count, 0) ?? 0
  const avgPerDay = data && data.length > 0 ? Math.round((total / data.length) * 10) / 10 : 0

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="mt-1 text-muted-foreground">Daily check-in volume, last 30 days.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Check-ins</CardTitle>
            <CardDescription>
              {total} total &middot; {avgPerDay} / day average
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 rounded-md border p-0.5">
            <Button variant={view === 'chart' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('chart')} aria-label="Chart view">
              <BarChart3 className="size-4" />
            </Button>
            <Button variant={view === 'table' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('table')} aria-label="Table view">
              <TableIcon className="size-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <Skeleton className="h-72 w-full" />
          ) : isError ? (
            <ErrorState message="Couldn't load attendance analytics." />
          ) : data.length === 0 ? (
            <EmptyState
              icon={<BarChart3 className="size-5" />}
              title="No check-ins yet"
              description="Attendance data will appear here once members start checking in."
            />
          ) : view === 'chart' ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} barSize={20}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => format(parseDayString(value), 'MMM d')}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    axisLine={{ stroke: 'var(--border)' }}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                  />
                  <Tooltip
                    cursor={{ fill: 'var(--accent)' }}
                    labelFormatter={(label) => format(parseDayString(String(label)), 'EEEE, MMM d')}
                    contentStyle={{ background: 'var(--popover)', borderColor: 'var(--border)', borderRadius: 8 }}
                    labelStyle={{ color: 'var(--muted-foreground)', fontSize: 12, marginBottom: 4 }}
                    itemStyle={{ color: 'var(--popover-foreground)', fontWeight: 600 }}
                  />
                  <Bar dataKey="count" name="Check-ins" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Check-ins</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.date}>
                    <TableCell>{format(parseDayString(row.date), 'EEEE, MMM d, yyyy')}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
})
