import { observer } from 'mobx-react-lite'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowLeft, Trophy, Dumbbell, Scale, Flame, ClipboardList, Sparkles, CreditCard, Banknote, AlertTriangle, RefreshCcw, XCircle } from 'lucide-react'
import { queryKeys, fetchTrainerMembers, fetchMemberProgress, fetchPaymentHistory } from '@/api/queries'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import { UserStatusBadge, SubscriptionStatusBadge } from '@/lib/statusBadges'
import { cn } from '@/lib/utils'
import type { PaymentEvent } from '@fitpulse/shared'

const PAYMENT_EVENT_ICON: Record<PaymentEvent['type'], typeof CreditCard> = {
  checkout_completed: CreditCard,
  subscription_renewed: RefreshCcw,
  subscription_cancelled: XCircle,
  payment_failed: AlertTriangle,
  marked_paid: Banknote,
}
const PAYMENT_EVENT_LABEL: Record<PaymentEvent['type'], string> = {
  checkout_completed: 'Checkout completed',
  subscription_renewed: 'Subscription renewed',
  subscription_cancelled: 'Subscription cancelled',
  payment_failed: 'Payment failed',
  marked_paid: 'Marked as paid (cash)',
}

export const MemberDetailPage = observer(function MemberDetailPage() {
  const { memberId } = useParams<{ memberId: string }>()

  const membersQuery = useQuery({ queryKey: queryKeys.trainer.members, queryFn: fetchTrainerMembers })
  const progressQuery = useQuery({
    queryKey: queryKeys.admin.memberProgress(memberId ?? ''),
    queryFn: () => fetchMemberProgress(memberId!),
    enabled: !!memberId,
  })
  const paymentHistoryQuery = useQuery({
    queryKey: queryKeys.admin.paymentHistory(memberId ?? ''),
    queryFn: () => fetchPaymentHistory(memberId!),
    enabled: !!memberId,
  })

  const member = membersQuery.data?.find((m) => m.id === memberId)

  const sortedMetrics = [...(progressQuery.data?.metrics ?? [])].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
  )
  const chartData = sortedMetrics.filter((m) => m.weightKg != null).map((m) => ({ date: m.recordedAt, weightKg: m.weightKg }))
  const latestWeight = chartData.at(-1)?.weightKg

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" className="w-fit" asChild>
        <Link to="/admin/members">
          <ArrowLeft className="size-4" />
          Back to members
        </Link>
      </Button>

      {membersQuery.isPending ? (
        <Skeleton className="h-64 w-full max-w-3xl" />
      ) : membersQuery.isError ? (
        <ErrorState message="Couldn't load member." />
      ) : !member ? (
        <ErrorState message="Member not found." />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">
                {member.firstName} {member.lastName}
              </h1>
              <p className="mt-1 text-muted-foreground">
                {member.email}
                {member.phone ? ` · ${member.phone}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <UserStatusBadge status={member.status} />
              <SubscriptionStatusBadge status={member.subscriptionStatus} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">Current weight</p>
                <p className="flex items-center gap-1.5 text-lg font-semibold">
                  <Scale className="size-4 text-primary" />
                  {latestWeight != null ? `${latestWeight} kg` : '—'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">Personal records</p>
                <p className="flex items-center gap-1.5 text-lg font-semibold">
                  <Trophy className="size-4 text-warning" />
                  {progressQuery.data?.prs.length ?? 0}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">Sessions logged</p>
                <p className="flex items-center gap-1.5 text-lg font-semibold">
                  <Dumbbell className="size-4 text-primary" />
                  {progressQuery.data?.sessions.length ?? 0}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">Streak</p>
                <p className="flex items-center gap-1.5 text-lg font-semibold">
                  <Flame className="size-4 text-warning" />
                  {member.streak} days
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Weight progress</CardTitle>
              <CardDescription>From logged body metrics.</CardDescription>
            </CardHeader>
            <CardContent>
              {progressQuery.isPending ? (
                <Skeleton className="h-56 w-full" />
              ) : progressQuery.isError ? (
                <ErrorState message="Couldn't load progress data." />
              ) : chartData.length === 0 ? (
                <EmptyState icon={<Scale className="size-5" />} title="No weight logged yet" description="Weight progress will appear here once the member logs a body metric." />
              ) : (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid vertical={false} stroke="var(--border)" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => format(new Date(value), 'MMM d')}
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                        axisLine={{ stroke: 'var(--border)' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        width={40}
                        domain={['dataMin - 2', 'dataMax + 2']}
                      />
                      <Tooltip
                        labelFormatter={(label) => format(new Date(label), 'EEEE, MMM d')}
                        formatter={(value: number) => [`${value} kg`, '']}
                        contentStyle={{ background: 'var(--popover)', borderColor: 'var(--border)', borderRadius: 8 }}
                        labelStyle={{ color: 'var(--muted-foreground)', fontSize: 12, marginBottom: 4 }}
                        itemStyle={{ color: 'var(--popover-foreground)', fontWeight: 600 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="weightKg"
                        name="Weight"
                        stroke="var(--primary)"
                        strokeWidth={2}
                        dot={{ r: 4, fill: 'var(--primary)', stroke: 'var(--card)', strokeWidth: 2 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workout plans</CardTitle>
              <CardDescription>Trainer-assigned and AI-generated plans this member has.</CardDescription>
            </CardHeader>
            <CardContent>
              {progressQuery.isPending ? (
                <Skeleton className="h-24 w-full" />
              ) : (progressQuery.data?.plans.length ?? 0) === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No workout plans yet.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-border">
                  {progressQuery.data!.plans.map((plan) => (
                    <li key={plan.id} className="flex items-center justify-between py-2.5 text-sm">
                      <div className="flex items-center gap-2">
                        {plan.generatedBy === 'ai' && <Sparkles className="size-4 text-primary" />}
                        <span className="font-medium">{plan.name}</span>
                        <Badge variant="outline" className="capitalize">
                          {plan.goal.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <ClipboardList className="size-3.5" />
                        {plan.days.length} day{plan.days.length === 1 ? '' : 's'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment history</CardTitle>
              <CardDescription>Real events recorded from Stripe webhooks and manual mark-as-paid actions.</CardDescription>
            </CardHeader>
            <CardContent>
              {paymentHistoryQuery.isPending ? (
                <Skeleton className="h-24 w-full" />
              ) : paymentHistoryQuery.isError ? (
                <ErrorState message="Couldn't load payment history." />
              ) : paymentHistoryQuery.data.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No payment events yet.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-border">
                  {paymentHistoryQuery.data.map((event) => {
                    const Icon = PAYMENT_EVENT_ICON[event.type]
                    return (
                      <li key={event.id} className="flex items-center justify-between py-2.5 text-sm">
                        <div className="flex items-center gap-2">
                          <Icon className={cn('size-4', event.type === 'payment_failed' ? 'text-destructive' : 'text-primary')} />
                          <span>{PAYMENT_EVENT_LABEL[event.type]}</span>
                          {event.planName && <span className="text-muted-foreground">· {event.planName}</span>}
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground">
                          {event.amountCents != null && (
                            <span className="font-medium text-foreground">
                              ${(event.amountCents / 100).toFixed(2)} {event.currency?.toUpperCase()}
                            </span>
                          )}
                          <span>{format(new Date(event.occurredAt), 'MMM d, yyyy')}</span>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Personal records</CardTitle>
              </CardHeader>
              <CardContent>
                {progressQuery.isPending ? (
                  <Skeleton className="h-32 w-full" />
                ) : (progressQuery.data?.prs.length ?? 0) === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No PRs yet.</p>
                ) : (
                  <ul className="flex flex-col divide-y divide-border">
                    {progressQuery.data!.prs.map((pr) => (
                      <li key={pr.id} className="flex items-center justify-between py-2.5 text-sm">
                        <span>{pr.exercise?.name ?? pr.exerciseId}</span>
                        <span className="font-medium">
                          {pr.value} {pr.unit}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent sessions</CardTitle>
              </CardHeader>
              <CardContent>
                {progressQuery.isPending ? (
                  <Skeleton className="h-32 w-full" />
                ) : (progressQuery.data?.sessions.length ?? 0) === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No sessions logged yet.</p>
                ) : (
                  <ul className="flex flex-col divide-y divide-border">
                    {progressQuery.data!.sessions.slice(0, 8).map((s) => (
                      <li key={s.id} className="flex items-center justify-between py-2.5 text-sm">
                        <span>{format(new Date(s.date), 'MMM d, yyyy')}</span>
                        <span className="text-muted-foreground">
                          {s.durationMins}m · {s.sets.length} sets
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
})
