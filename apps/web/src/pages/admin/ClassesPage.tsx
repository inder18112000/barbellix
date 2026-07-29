import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, CalendarDays, Pencil } from 'lucide-react'
import type { ClassTemplate, ClassTemplateOccurrence } from '@barbellix/shared'
import {
  queryKeys,
  fetchClassTemplates,
  fetchTrainersList,
  fetchBranch,
  createClassTemplate,
  updateClassTemplate,
  type CreateClassTemplateInput,
} from '@/api/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { cn } from '@/lib/utils'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function daysSummary(occurrences: ClassTemplateOccurrence[]) {
  if (occurrences.length === 0) return '—'
  const days = occurrences.map((o) => DAY_LABELS[o.dayOfWeek]).join('/')
  return `${days} at ${occurrences[0].startTime}`
}

export const ClassesPage = observer(function ClassesPage() {
  const [dialogState, setDialogState] = useState<{ mode: 'create' } | { mode: 'edit'; template: ClassTemplate } | null>(null)

  const { data, isPending, isError } = useQuery({ queryKey: queryKeys.admin.classTemplates, queryFn: fetchClassTemplates })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Group classes</h1>
          <p className="mt-1 text-muted-foreground">Recurring class templates - sessions are generated automatically as members browse the schedule.</p>
        </div>
        <Button onClick={() => setDialogState({ mode: 'create' })}>
          <Plus className="size-4" />
          New class
        </Button>
      </div>

      {isPending ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      ) : isError ? (
        <ErrorState message="Couldn't load class templates." />
      ) : data.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="size-5" />}
          title="No classes yet"
          description="Create a recurring class template to start filling the schedule."
          action={
            <Button size="sm" onClick={() => setDialogState({ mode: 'create' })}>
              <Plus className="size-4" />
              New class
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((template) => (
            <Card key={template.id}>
              <CardHeader className="flex-row items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {template.name}
                    <Badge variant={template.active ? 'success' : 'secondary'}>{template.active ? 'Active' : 'Inactive'}</Badge>
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">with {template.trainerName ?? 'Unassigned'}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setDialogState({ mode: 'edit', template })}>
                  <Pencil className="size-4" />
                </Button>
              </CardHeader>
              <CardContent className="flex flex-col gap-1 text-sm">
                <p>{daysSummary(template.occurrences)}</p>
                <p className="text-muted-foreground">{template.occurrences[0]?.durationMins ?? 0} min · capacity {template.capacity}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TemplateDialog state={dialogState} onClose={() => setDialogState(null)} />
    </div>
  )
})

function TemplateDialog({
  state,
  onClose,
}: {
  state: { mode: 'create' } | { mode: 'edit'; template: ClassTemplate } | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const editing = state?.mode === 'edit' ? state.template : null
  const [selectedDays, setSelectedDays] = useState<number[]>(editing?.occurrences.map((o) => o.dayOfWeek) ?? [])

  const branchQuery = useQuery({ queryKey: queryKeys.admin.branch, queryFn: fetchBranch, enabled: !!state })
  const trainersQuery = useQuery({ queryKey: queryKeys.admin.trainers, queryFn: fetchTrainersList, enabled: !!state })

  const createMutation = useMutation({
    mutationFn: (input: CreateClassTemplateInput) => createClassTemplate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.classTemplates })
      toast.success('Class created')
      handleClose()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<CreateClassTemplateInput> & { active?: boolean }) => {
      if (!editing) throw new Error('No class selected')
      return updateClassTemplate(editing.id, updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.classTemplates })
      toast.success('Class updated')
      handleClose()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  const toggleDay = (day: number) => {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()))
  }

  const handleClose = () => {
    setSelectedDays(editing?.occurrences.map((o) => o.dayOfWeek) ?? [])
    onClose()
  }

  return (
    <Dialog open={!!state} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit class' : 'New class'}</DialogTitle>
          <DialogDescription>Sessions on these days/time are generated automatically as members browse the schedule.</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            const name = String(formData.get('name') ?? '').trim()
            const trainerId = String(formData.get('trainerId') ?? '')
            const startTime = String(formData.get('startTime') ?? '')
            const durationMins = Number(formData.get('durationMins'))
            const capacity = Number(formData.get('capacity'))
            const active = formData.get('active') === 'on'

            if (!name || !trainerId || selectedDays.length === 0 || !startTime || !durationMins || !capacity) {
              toast.error('Fill in every field and pick at least one day.')
              return
            }

            const occurrences: ClassTemplateOccurrence[] = selectedDays.map((dayOfWeek) => ({ dayOfWeek, startTime, durationMins }))

            if (editing) {
              updateMutation.mutate({ name, trainerId, occurrences, capacity, active })
            } else {
              if (!branchQuery.data) {
                toast.error('Branch not loaded yet - try again in a moment.')
                return
              }
              createMutation.mutate({ branchId: branchQuery.data.id, name, trainerId, occurrences, capacity })
            }
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" placeholder="Sunrise Yoga" required defaultValue={editing?.name} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="trainerId">Trainer</Label>
            <Select name="trainerId" defaultValue={editing?.trainerId}>
              <SelectTrigger className="w-full" id="trainerId">
                <SelectValue placeholder={trainersQuery.isPending ? 'Loading…' : 'Select a trainer'} />
              </SelectTrigger>
              <SelectContent>
                {(trainersQuery.data ?? []).map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Days</Label>
            <div className="flex flex-wrap gap-1.5">
              {DAY_LABELS.map((label, day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    selectedDays.includes(day) ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-transparent',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="startTime">Start time</Label>
              <Input id="startTime" name="startTime" type="time" required defaultValue={editing?.occurrences[0]?.startTime} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="durationMins">Duration (min)</Label>
              <Input id="durationMins" name="durationMins" type="number" min="1" required defaultValue={editing?.occurrences[0]?.durationMins ?? 45} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="capacity">Capacity</Label>
              <Input id="capacity" name="capacity" type="number" min="1" required defaultValue={editing?.capacity ?? 12} />
            </div>
          </div>

          {editing && (
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <Label htmlFor="active">Active</Label>
              <Switch id="active" name="active" defaultChecked={editing.active} />
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : editing ? 'Save changes' : 'Create class'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
