import { observer } from 'mobx-react-lite'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { queryKeys, createWorkoutPlan } from '@/api/queries'
import { Button } from '@/components/ui/button'
import { WorkoutPlanEditor } from '@/components/common/WorkoutPlanEditor'

export const CreateWorkoutPlanPage = observer(function CreateWorkoutPlanPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: (input: Parameters<typeof createWorkoutPlan>[0]) => createWorkoutPlan(input),
    onSuccess: (plan) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trainer.workoutPlans })
      toast.success(`"${plan.name}" created`, { description: 'You can now assign it to a member from their profile.' })
      navigate('/admin/members')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" className="w-fit" asChild>
        <Link to="/admin/members">
          <ArrowLeft className="size-4" />
          Back
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold">Create a workout plan</h1>
        <p className="mt-1 text-muted-foreground">Build a reusable template you can assign to any member.</p>
      </div>

      <WorkoutPlanEditor
        submitLabel="Create plan"
        isPending={createMutation.isPending}
        onSubmit={(input) => createMutation.mutate({ name: input.name, goal: input.goal, days: input.days })}
      />
    </div>
  )
})
