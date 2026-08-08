import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Dumbbell, UtensilsCrossed, Plus, Trash2, Pencil, Search, Video, Upload } from 'lucide-react'
import type { Exercise, Meal, MuscleGroup, Equipment, MealType } from '@barbellix/shared'
import { MUSCLE_GROUPS, EQUIPMENT as EQUIPMENT_OPTIONS } from '@barbellix/shared'
import {
  queryKeys,
  fetchExercises,
  createExercise,
  updateExercise,
  deleteExercise,
  uploadExerciseVideo,
  type ExerciseInput,
  fetchMeals,
  createMeal,
  updateMeal,
  deleteMeal,
  type MealInput,
} from '@/api/queries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

function ToggleBadgeGroup<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T[]; onChange: (v: T[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const selected = value.includes(opt)
        return (
          <Badge
            key={opt}
            variant={selected ? 'default' : 'outline'}
            className="cursor-pointer capitalize select-none"
            onClick={() => onChange(selected ? value.filter((v) => v !== opt) : [...value, opt])}
          >
            {opt.replace(/_/g, ' ')}
          </Badge>
        )
      })}
    </div>
  )
}

export function ExerciseLibraryPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Exercise &amp; Meal Library</h1>
        <p className="mt-1 text-muted-foreground">
          Custom exercises and meals you add here are scoped to your gym and appear alongside the global catalog for every plan you build.
        </p>
      </div>

      <Tabs defaultValue="exercises">
        <TabsList>
          <TabsTrigger value="exercises">
            <Dumbbell className="size-4" />
            Exercises
          </TabsTrigger>
          <TabsTrigger value="meals">
            <UtensilsCrossed className="size-4" />
            Meals
          </TabsTrigger>
        </TabsList>
        <TabsContent value="exercises">
          <ExercisesTab />
        </TabsContent>
        <TabsContent value="meals">
          <MealsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Exercises ──────────────────────────────────────────────────────────────────

function ExercisesTab() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [editTarget, setEditTarget] = useState<Exercise | 'new' | null>(null)

  const exercisesQuery = useQuery({ queryKey: queryKeys.exercises(search), queryFn: () => fetchExercises(search) })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteExercise(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] })
      toast.success('Exercise deleted')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const columns: DataTableColumn<Exercise>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (ex) => (
        <div className="flex flex-col">
          <span className="font-medium">{ex.name}</span>
          {!ex.tenantId && <span className="text-xs text-muted-foreground">Global catalog</span>}
        </div>
      ),
    },
    {
      key: 'muscles',
      header: 'Muscle groups',
      render: (ex) => (
        <div className="flex flex-wrap gap-1">
          {ex.muscleGroups.map((m) => (
            <Badge key={m} variant="outline" className="capitalize">{m.replace(/_/g, ' ')}</Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'equipment',
      header: 'Equipment',
      className: 'text-sm text-muted-foreground capitalize',
      render: (ex) => ex.equipment.map((e) => e.replace(/_/g, ' ')).join(', ') || '—',
    },
    {
      key: 'actions',
      header: '',
      className: 'w-20',
      render: (ex) =>
        ex.tenantId ? (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setEditTarget(ex)}>
              <Pencil className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(ex.id)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        ) : null,
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search exercises…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button onClick={() => setEditTarget('new')}>
          <Plus className="size-4" />
          New exercise
        </Button>
      </div>

      {exercisesQuery.isPending ? (
        <Skeleton className="h-32 w-full" />
      ) : exercisesQuery.isError ? (
        <ErrorState message="Couldn't load exercises." />
      ) : exercisesQuery.data.length === 0 ? (
        <EmptyState icon={<Dumbbell className="size-5" />} title="No exercises found" description="Add a custom exercise to get started." />
      ) : (
        <div className="rounded-xl border">
          <DataTable columns={columns} data={exercisesQuery.data} getRowKey={(ex) => ex.id} />
        </div>
      )}

      <ExerciseFormDialog target={editTarget} onClose={() => setEditTarget(null)} />
    </div>
  )
}

function ExerciseFormDialog({ target, onClose }: { target: Exercise | 'new' | null; onClose: () => void }) {
  const queryClient = useQueryClient()
  const isNew = target === 'new'
  const existing = target && target !== 'new' ? target : undefined

  const [name, setName] = useState(existing?.name ?? '')
  const [instructions, setInstructions] = useState(existing?.instructions ?? '')
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>(existing?.muscleGroups ?? [])
  const [equipment, setEquipment] = useState<Equipment[]>(existing?.equipment ?? [])

  const resetFields = (ex?: Exercise) => {
    setName(ex?.name ?? '')
    setInstructions(ex?.instructions ?? '')
    setMuscleGroups(ex?.muscleGroups ?? [])
    setEquipment(ex?.equipment ?? [])
  }

  const mutation = useMutation({
    mutationFn: (input: ExerciseInput) => (existing ? updateExercise(existing.id, input) : createExercise(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] })
      toast.success(existing ? 'Exercise updated' : 'Exercise created')
      handleClose(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const videoMutation = useMutation({
    mutationFn: (file: File) => {
      if (!existing) throw new Error('Save the exercise before adding a video')
      return uploadExerciseVideo(existing.id, file)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] })
      toast.success('Video uploaded')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleClose = (open: boolean) => {
    if (open) return
    resetFields()
    mutation.reset()
    onClose()
  }

  return (
    <Dialog
      open={!!target}
      onOpenChange={(open) => {
        if (open && existing) resetFields(existing)
        handleClose(open)
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isNew ? 'New exercise' : `Edit ${existing?.name}`}</DialogTitle>
          <DialogDescription>Added to your gym's own library - it never touches the shared global catalog.</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            mutation.mutate({ name, instructions, muscleGroups, equipment })
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ex-name">Name</Label>
            <Input id="ex-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Muscle groups</Label>
            <ToggleBadgeGroup options={MUSCLE_GROUPS} value={muscleGroups} onChange={setMuscleGroups} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Equipment</Label>
            <ToggleBadgeGroup options={EQUIPMENT_OPTIONS} value={equipment} onChange={setEquipment} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ex-instructions">Instructions</Label>
            <textarea
              id="ex-instructions"
              className="min-h-24 rounded-md border bg-transparent px-3 py-2 text-sm"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              required
            />
          </div>
          {existing && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ex-video">Demo video</Label>
              <div className="flex items-center gap-2">
                {existing.mediaType === 'video' ? (
                  <a
                    href={existing.mediaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <Video className="size-4" />
                    View current video
                  </a>
                ) : (
                  <span className="text-sm text-muted-foreground">No video yet</span>
                )}
                <label className="ml-auto">
                  <input
                    id="ex-video"
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) videoMutation.mutate(file)
                      e.target.value = ''
                    }}
                  />
                  <Button type="button" variant="outline" size="sm" disabled={videoMutation.isPending} asChild>
                    <span>
                      <Upload className="size-3.5" />
                      {videoMutation.isPending ? 'Uploading…' : existing.mediaType === 'video' ? 'Replace video' : 'Upload video'}
                    </span>
                  </Button>
                </label>
              </div>
              <p className="text-xs text-muted-foreground">MP4, MOV, or WebM, up to 100MB.</p>
            </div>
          )}
          <DialogFooter>
            <Button type="submit" disabled={!name.trim() || !instructions.trim() || mutation.isPending}>
              {mutation.isPending ? 'Saving…' : isNew ? 'Create exercise' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Meals ──────────────────────────────────────────────────────────────────────

function MealsTab() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [editTarget, setEditTarget] = useState<Meal | 'new' | null>(null)

  const mealsQuery = useQuery({ queryKey: queryKeys.meals(search), queryFn: () => fetchMeals(search) })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMeal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] })
      toast.success('Meal deleted')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const columns: DataTableColumn<Meal>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (meal) => (
        <div className="flex flex-col">
          <span className="font-medium">{meal.name}</span>
          {!meal.tenantId && <span className="text-xs text-muted-foreground">Global catalog</span>}
        </div>
      ),
    },
    { key: 'type', header: 'Type', render: (meal) => <Badge variant="outline" className="capitalize">{meal.mealType}</Badge> },
    {
      key: 'macros',
      header: 'Macros',
      className: 'text-sm text-muted-foreground',
      render: (meal) => `${meal.calories} kcal · ${meal.proteinG ?? 0}p / ${meal.carbsG ?? 0}c / ${meal.fatG ?? 0}f`,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-20',
      render: (meal) =>
        meal.tenantId ? (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setEditTarget(meal)}>
              <Pencil className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(meal.id)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        ) : null,
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search meals…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button onClick={() => setEditTarget('new')}>
          <Plus className="size-4" />
          New meal
        </Button>
      </div>

      {mealsQuery.isPending ? (
        <Skeleton className="h-32 w-full" />
      ) : mealsQuery.isError ? (
        <ErrorState message="Couldn't load meals." />
      ) : mealsQuery.data.length === 0 ? (
        <EmptyState icon={<UtensilsCrossed className="size-5" />} title="No meals found" description="Add a custom meal to get started." />
      ) : (
        <div className="rounded-xl border">
          <DataTable columns={columns} data={mealsQuery.data} getRowKey={(meal) => meal.id} />
        </div>
      )}

      <MealFormDialog target={editTarget} onClose={() => setEditTarget(null)} />
    </div>
  )
}

function MealFormDialog({ target, onClose }: { target: Meal | 'new' | null; onClose: () => void }) {
  const queryClient = useQueryClient()
  const isNew = target === 'new'
  const existing = target && target !== 'new' ? target : undefined

  const [name, setName] = useState(existing?.name ?? '')
  const [mealType, setMealType] = useState<MealType>(existing?.mealType ?? 'breakfast')
  const [calories, setCalories] = useState(existing?.calories?.toString() ?? '')
  const [proteinG, setProteinG] = useState(existing?.proteinG?.toString() ?? '')
  const [carbsG, setCarbsG] = useState(existing?.carbsG?.toString() ?? '')
  const [fatG, setFatG] = useState(existing?.fatG?.toString() ?? '')

  const resetFields = (meal?: Meal) => {
    setName(meal?.name ?? '')
    setMealType(meal?.mealType ?? 'breakfast')
    setCalories(meal?.calories?.toString() ?? '')
    setProteinG(meal?.proteinG?.toString() ?? '')
    setCarbsG(meal?.carbsG?.toString() ?? '')
    setFatG(meal?.fatG?.toString() ?? '')
  }

  const mutation = useMutation({
    mutationFn: (input: MealInput) => (existing ? updateMeal(existing.id, input) : createMeal(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] })
      toast.success(existing ? 'Meal updated' : 'Meal created')
      handleClose(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleClose = (open: boolean) => {
    if (open) return
    resetFields()
    mutation.reset()
    onClose()
  }

  return (
    <Dialog
      open={!!target}
      onOpenChange={(open) => {
        if (open && existing) resetFields(existing)
        handleClose(open)
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isNew ? 'New meal' : `Edit ${existing?.name}`}</DialogTitle>
          <DialogDescription>Added to your gym's own library, ready to reference from any diet plan.</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            mutation.mutate({
              name,
              mealType,
              calories: Number(calories),
              proteinG: proteinG ? Number(proteinG) : undefined,
              carbsG: carbsG ? Number(carbsG) : undefined,
              fatG: fatG ? Number(fatG) : undefined,
            })
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="meal-name">Name</Label>
            <Input id="meal-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Meal type</Label>
            <Select value={mealType} onValueChange={(v) => setMealType(v as MealType)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEAL_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="meal-calories">Calories</Label>
              <Input id="meal-calories" type="number" min={0} value={calories} onChange={(e) => setCalories(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="meal-protein">Protein (g)</Label>
              <Input id="meal-protein" type="number" min={0} value={proteinG} onChange={(e) => setProteinG(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="meal-carbs">Carbs (g)</Label>
              <Input id="meal-carbs" type="number" min={0} value={carbsG} onChange={(e) => setCarbsG(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="meal-fat">Fat (g)</Label>
              <Input id="meal-fat" type="number" min={0} value={fatG} onChange={(e) => setFatG(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!name.trim() || !calories || mutation.isPending}>
              {mutation.isPending ? 'Saving…' : isNew ? 'Create meal' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
