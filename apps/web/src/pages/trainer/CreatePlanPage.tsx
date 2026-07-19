import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Trash2, Search } from 'lucide-react'
import type { FitnessGoal } from '@fitpulse/shared'
import { queryKeys, fetchExercises, createWorkoutPlan } from '@/api/queries'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

const GOALS: { value: FitnessGoal; label: string }[] = [
  { value: 'lose_weight', label: 'Lose weight' },
  { value: 'build_muscle', label: 'Build muscle' },
  { value: 'improve_endurance', label: 'Improve endurance' },
  { value: 'increase_strength', label: 'Increase strength' },
  { value: 'general_fitness', label: 'General fitness' },
  { value: 'sport_performance', label: 'Sport performance' },
]

interface ExerciseRow {
  key: string
  exerciseId: string
  name: string
  sets: number
  reps: string
  restSecs: number
}

interface DayState {
  key: string
  dayLabel: string
  exercises: ExerciseRow[]
}

let localKeyCounter = 0
const nextKey = () => `k${++localKeyCounter}`

export const CreatePlanPage = observer(function CreatePlanPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [goal, setGoal] = useState<FitnessGoal>('general_fitness')
  const [days, setDays] = useState<DayState[]>([{ key: nextKey(), dayLabel: 'Day 1', exercises: [] }])

  const createMutation = useMutation({
    mutationFn: () =>
      createWorkoutPlan({
        name,
        goal,
        days: days.map((d) => ({
          dayLabel: d.dayLabel,
          exercises: d.exercises.map((e) => ({ exerciseId: e.exerciseId, sets: e.sets, reps: e.reps, restSecs: e.restSecs })),
        })),
      }),
    onSuccess: (plan) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trainer.workoutPlans })
      toast.success(`"${plan.name}" created`, { description: 'You can now assign it to a member from their profile.' })
      navigate('/trainer')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const addDay = () => setDays((prev) => [...prev, { key: nextKey(), dayLabel: `Day ${prev.length + 1}`, exercises: [] }])
  const removeDay = (dayKey: string) => setDays((prev) => prev.filter((d) => d.key !== dayKey))
  const updateDayLabel = (dayKey: string, dayLabel: string) =>
    setDays((prev) => prev.map((d) => (d.key === dayKey ? { ...d, dayLabel } : d)))

  const addExercise = (dayKey: string, exerciseId: string, exerciseName: string) =>
    setDays((prev) =>
      prev.map((d) =>
        d.key === dayKey
          ? { ...d, exercises: [...d.exercises, { key: nextKey(), exerciseId, name: exerciseName, sets: 3, reps: '8-12', restSecs: 60 }] }
          : d,
      ),
    )

  const removeExercise = (dayKey: string, exerciseKey: string) =>
    setDays((prev) => prev.map((d) => (d.key === dayKey ? { ...d, exercises: d.exercises.filter((e) => e.key !== exerciseKey) } : d)))

  const updateExercise = (dayKey: string, exerciseKey: string, updates: Partial<ExerciseRow>) =>
    setDays((prev) =>
      prev.map((d) =>
        d.key === dayKey
          ? { ...d, exercises: d.exercises.map((e) => (e.key === exerciseKey ? { ...e, ...updates } : e)) }
          : d,
      ),
    )

  const canSubmit = name.trim().length > 0 && days.length > 0 && days.every((d) => d.dayLabel.trim().length > 0 && d.exercises.length > 0)

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" className="w-fit" asChild>
        <Link to="/trainer">
          <ArrowLeft className="size-4" />
          Back
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold">Create a workout plan</h1>
        <p className="mt-1 text-muted-foreground">Build a reusable template you can assign to any member.</p>
      </div>

      <div className="flex max-w-2xl flex-col gap-4">
        <Card>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="planName">Plan name</Label>
              <Input id="planName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Push Pull Legs" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="planGoal">Goal</Label>
              <Select value={goal} onValueChange={(v) => setGoal(v as FitnessGoal)}>
                <SelectTrigger className="w-full" id="planGoal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOALS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {days.map((day, idx) => (
          <Card key={day.key}>
            <CardHeader className="flex-row items-center justify-between">
              <Input
                value={day.dayLabel}
                onChange={(e) => updateDayLabel(day.key, e.target.value)}
                className="max-w-56 font-medium"
              />
              {days.length > 1 && (
                <Button variant="ghost" size="icon" onClick={() => removeDay(day.key)}>
                  <Trash2 className="size-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {day.exercises.map((ex) => (
                <div key={ex.key} className="flex items-center gap-2 rounded-md border px-3 py-2">
                  <span className="flex-1 truncate text-sm font-medium">{ex.name}</span>
                  <Input
                    type="number"
                    min="1"
                    className="w-16"
                    value={ex.sets}
                    onChange={(e) => updateExercise(day.key, ex.key, { sets: Number(e.target.value) || 1 })}
                    aria-label="Sets"
                  />
                  <span className="text-xs text-muted-foreground">sets</span>
                  <Input
                    className="w-20"
                    value={ex.reps}
                    onChange={(e) => updateExercise(day.key, ex.key, { reps: e.target.value })}
                    aria-label="Reps"
                  />
                  <span className="text-xs text-muted-foreground">reps</span>
                  <Input
                    type="number"
                    min="0"
                    className="w-20"
                    value={ex.restSecs}
                    onChange={(e) => updateExercise(day.key, ex.key, { restSecs: Number(e.target.value) || 0 })}
                    aria-label="Rest seconds"
                  />
                  <span className="text-xs text-muted-foreground">s rest</span>
                  <Button variant="ghost" size="icon" onClick={() => removeExercise(day.key, ex.key)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}

              <ExercisePicker onPick={(id, exerciseName) => addExercise(day.key, id, exerciseName)} />
            </CardContent>
            {idx === days.length - 1 && (
              <CardFooter>
                <Button variant="outline" size="sm" onClick={addDay}>
                  <Plus className="size-4" />
                  Add another day
                </Button>
              </CardFooter>
            )}
          </Card>
        ))}

        <Button className="w-fit" disabled={!canSubmit || createMutation.isPending} onClick={() => createMutation.mutate()}>
          {createMutation.isPending ? 'Creating…' : 'Create plan'}
        </Button>
      </div>
    </div>
  )
})

function ExercisePicker({ onPick }: { onPick: (exerciseId: string, name: string) => void }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const debouncedQuery = useDebouncedValue(query, 250)

  const { data, isFetching } = useQuery({
    queryKey: queryKeys.exercises(debouncedQuery),
    queryFn: () => fetchExercises(debouncedQuery),
    enabled: debouncedQuery.trim().length >= 2,
  })

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder="Search exercises to add…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
      </div>
      {open && debouncedQuery.trim().length >= 2 && (
        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-popover shadow-md">
          {isFetching ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">Searching…</p>
          ) : !data || data.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">No exercises match "{debouncedQuery}".</p>
          ) : (
            data.map((exercise) => (
              <button
                key={exercise.id}
                type="button"
                className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-accent"
                onMouseDown={(e) => {
                  e.preventDefault()
                  onPick(exercise.id, exercise.name)
                  setQuery('')
                  setOpen(false)
                }}
              >
                <span className="font-medium">{exercise.name}</span>
                <span className="text-xs text-muted-foreground capitalize">{exercise.muscleGroups.join(', ').replace(/_/g, ' ')}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
