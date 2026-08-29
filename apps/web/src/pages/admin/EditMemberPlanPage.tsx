import { observer } from 'mobx-react-lite'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { queryKeys, fetchMemberProgress, fetchExercises, updateMemberPlan } from '@/api/queries'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/common/ErrorState'
import { WorkoutPlanEditor, type WorkoutPlanEditorInitialDay } from '@/components/common/WorkoutPlanEditor'

export const EditMemberPlanPage = observer(function EditMemberPlanPage() {
  const { memberId, planId } = useParams<{ memberId: string; planId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const progressQuery = useQuery({
    queryKey: queryKeys.admin.memberProgress(memberId ?? ''),
    queryFn: () => fetchMemberProgress(memberId!),
    enabled: !!memberId,
  })
  // Full catalog (no search term) - resolves exercise names for the plan's stored exerciseIds,
  // since GET /admin/members/:memberId/progress returns plans without populated exercise details.
  const exercisesQuery = useQuery({ queryKey: queryKeys.exercises(''), queryFn: () => fetchExercises('') })

  const plan = progressQuery.data?.plans.find((p) => p.id === planId)
  const exerciseNameById = new Map((exercisesQuery.data ?? []).map((e) => [e.id, e.name]))

  const updateMutation = useMutation({
    mutationFn: (input: Parameters<typeof updateMemberPlan>[2]) => updateMemberPlan(memberId!, planId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.memberProgress(memberId ?? '') })
      toast.success('Plan updated')
      navigate(`/admin/members/${memberId}`)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const isLoading = progressQuery.isPending || exercisesQuery.isPending

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" className="w-fit" asChild>
        <Link to={memberId ? `/admin/members/${memberId}` : '/admin/members'}>
          <ArrowLeft className="size-4" />
          Back
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold">Edit workout plan</h1>
        <p className="mt-1 text-muted-foreground">Saving creates a new version - the previous plan is kept for history.</p>
      </div>

      {isLoading ? (
        <div className="flex max-w-2xl flex-col gap-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : progressQuery.isError || exercisesQuery.isError ? (
        <ErrorState message="Couldn't load this plan." />
      ) : !plan ? (
        <ErrorState message="Plan not found." />
      ) : (
        <WorkoutPlanEditor
          initialName={plan.name}
          initialGoal={plan.goal}
          initialDays={plan.days.map(
            (d): WorkoutPlanEditorInitialDay => ({
              dayLabel: d.dayLabel,
              exercises: d.exercises.map((e) => ({
                exerciseId: e.exerciseId,
                name: exerciseNameById.get(e.exerciseId) ?? 'Unknown exercise',
                sets: e.sets,
                reps: String(e.reps),
                restSecs: e.restSecs,
              })),
            }),
          )}
          showChangeNote
          submitLabel="Save changes"
          isPending={updateMutation.isPending}
          onSubmit={(input) => updateMutation.mutate({ name: input.name, goal: input.goal, days: input.days, changeNote: input.changeNote })}
        />
      )}
    </div>
  )
})
