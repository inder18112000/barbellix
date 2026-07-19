import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, ClipboardList, Plus } from 'lucide-react'
import { queryKeys, fetchTrainerMembers, fetchWorkoutPlans, assignPlanToMember } from '@/api/queries'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import { cn } from '@/lib/utils'

export const AssignPlanPage = observer(function AssignPlanPage() {
  const { memberId } = useParams<{ memberId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)

  const membersQuery = useQuery({ queryKey: queryKeys.trainer.members, queryFn: fetchTrainerMembers })
  const plansQuery = useQuery({ queryKey: queryKeys.trainer.workoutPlans, queryFn: fetchWorkoutPlans })
  const member = membersQuery.data?.find((m) => m.id === memberId)

  const assignMutation = useMutation({
    mutationFn: () => {
      if (!memberId || !selectedPlanId) throw new Error('Pick a plan first')
      return assignPlanToMember(memberId, selectedPlanId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trainer.members })
      toast.success(`Plan assigned to ${member?.firstName ?? 'member'}`)
      navigate(`/trainer/members/${memberId}`)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" className="w-fit" asChild>
        <Link to={memberId ? `/trainer/members/${memberId}` : '/trainer/members'}>
          <ArrowLeft className="size-4" />
          Back
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold">Assign a plan{member ? ` to ${member.firstName} ${member.lastName}` : ''}</h1>
        <p className="mt-1 text-muted-foreground">Pick one of your workout plan templates to copy onto this member.</p>
      </div>

      {plansQuery.isPending ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : plansQuery.isError ? (
        <ErrorState message="Couldn't load your workout plans." />
      ) : plansQuery.data.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="size-5" />}
          title="No plan templates yet"
          description="Create a workout plan template first, then assign it to members."
          action={
            <Button size="sm" asChild>
              <Link to="/trainer/plans/new">
                <Plus className="size-4" />
                Create a plan
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {plansQuery.data.map((plan) => (
            <Card
              key={plan.id}
              className={cn(
                'cursor-pointer transition-colors',
                selectedPlanId === plan.id ? 'border-primary ring-1 ring-primary' : 'hover:border-primary/50',
              )}
              onClick={() => setSelectedPlanId(plan.id)}
            >
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{plan.name}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {plan.goal.replace(/_/g, ' ')} &middot; {plan.days.length} day{plan.days.length === 1 ? '' : 's'}
                  </p>
                </div>
                <div
                  className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded-full border-2',
                    selectedPlanId === plan.id ? 'border-primary bg-primary' : 'border-input',
                  )}
                >
                  {selectedPlanId === plan.id && <div className="size-2 rounded-full bg-primary-foreground" />}
                </div>
              </CardContent>
            </Card>
          ))}

          <Button className="mt-2 w-fit" disabled={!selectedPlanId || assignMutation.isPending} onClick={() => assignMutation.mutate()}>
            {assignMutation.isPending ? 'Assigning…' : 'Assign plan'}
          </Button>
        </div>
      )}
    </div>
  )
})
