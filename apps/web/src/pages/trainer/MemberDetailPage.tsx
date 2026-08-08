import { observer } from 'mobx-react-lite'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Flame, CalendarDays, Dumbbell, ClipboardList, MessageSquare } from 'lucide-react'
import { queryKeys, fetchTrainerMembers } from '@/api/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/common/ErrorState'
import { InjuriesCard } from '@/components/common/InjuriesCard'
import { UserStatusBadge, MembershipStatusBadge, PaymentStatusBadge } from '@/lib/statusBadges'

export const MemberDetailPage = observer(function MemberDetailPage() {
  const { memberId } = useParams<{ memberId: string }>()
  const { data, isPending, isError } = useQuery({ queryKey: queryKeys.trainer.members, queryFn: fetchTrainerMembers })
  const member = data?.find((m) => m.id === memberId)

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" className="w-fit" asChild>
        <Link to="/trainer/members">
          <ArrowLeft className="size-4" />
          Back to members
        </Link>
      </Button>

      {isPending ? (
        <Skeleton className="h-64 w-full max-w-2xl" />
      ) : isError ? (
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
              <p className="mt-1 text-muted-foreground">{member.email}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link to={`/trainer/members/${member.id}/assign-plan`}>
                  <ClipboardList className="size-4" />
                  Assign a plan
                </Link>
              </Button>
              <Button asChild>
                <Link to={`/trainer/messages/${member.id}`}>
                  <MessageSquare className="size-4" />
                  Message
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">Status</p>
                <UserStatusBadge status={member.status} />
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
            <Card>
              <CardContent className="flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">Sessions logged</p>
                <p className="flex items-center gap-1.5 text-lg font-semibold">
                  <Dumbbell className="size-4 text-primary" />
                  {member.sessionsCount}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Membership</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Current workout plan</span>
                <span className="font-medium">{member.plan}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Billing plan</span>
                <MembershipStatusBadge status={member.membershipStatus} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Payment status</span>
                <PaymentStatusBadge status={member.paymentStatus} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <CalendarDays className="size-3.5" />
                  Member since
                </span>
                <span className="font-medium">{new Date(member.joinDate).toLocaleDateString()}</span>
              </div>
              {member.lastSeenAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last checked in</span>
                  <span className="font-medium">{new Date(member.lastSeenAt).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <InjuriesCard memberId={member.id} />
        </>
      )}
    </div>
  )
})
