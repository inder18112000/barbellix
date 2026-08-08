import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Users2, ShieldCheck } from 'lucide-react'
import type { TrainerSummary } from '@barbellix/shared'
import { queryKeys, fetchAvailableTrainers, setTrainerPermissions, setTrainerReportsTo } from '@/api/queries'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { authStore } from '@/store/authStore'

/** Admin sees and edits only their own tenant's admin-reporting trainers (server-enforced too, not
 * just hidden here); superadmin sees every trainer platform-wide and is the only role that can
 * change reportsToRole - see trainer/service.ts's setTrainerPermissions() and
 * superadmin/service.ts's setTrainerReportsTo() for the actual authorization. */
export function TrainersPage() {
  const queryClient = useQueryClient()
  const isSuperadmin = authStore.user?.role === 'superadmin'

  const trainersQuery = useQuery({ queryKey: queryKeys.admin.availableTrainers, queryFn: fetchAvailableTrainers })

  const permissionsMutation = useMutation({
    mutationFn: ({ trainerId, updates }: { trainerId: string; updates: { canManageExerciseLibrary?: boolean; canManageMealLibrary?: boolean } }) =>
      setTrainerPermissions(trainerId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.availableTrainers })
      toast.success('Trainer permissions updated')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const reportsToMutation = useMutation({
    mutationFn: ({ trainerId, reportsToRole }: { trainerId: string; reportsToRole: 'admin' | 'superadmin' }) =>
      setTrainerReportsTo(trainerId, reportsToRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.availableTrainers })
      toast.success('Reporting updated')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const trainers = trainersQuery.data ?? []
  // Admin only manages trainers who report to them - superadmin-reporting trainers still show up
  // (so admin knows they exist) but their toggles are disabled.
  const canEdit = (trainer: TrainerSummary) => isSuperadmin || trainer.reportsToRole === 'admin'

  const columns: DataTableColumn<TrainerSummary>[] = [
    {
      key: 'name',
      header: 'Trainer',
      render: (t) => (
        <div className="flex flex-col">
          <span className="font-medium">{t.name}</span>
          <span className="text-xs text-muted-foreground">{t.email}</span>
        </div>
      ),
    },
    {
      key: 'reportsTo',
      header: 'Reports to',
      render: (t) =>
        isSuperadmin ? (
          <Select
            value={t.reportsToRole}
            onValueChange={(value) => reportsToMutation.mutate({ trainerId: t.id, reportsToRole: value as 'admin' | 'superadmin' })}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Gym admin</SelectItem>
              <SelectItem value="superadmin">Super admin</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Badge variant="outline" className="capitalize">
            {t.reportsToRole === 'superadmin' ? 'Super admin' : 'Gym admin'}
          </Badge>
        ),
    },
    {
      key: 'exerciseLibrary',
      header: 'Exercise library',
      render: (t) => (
        <Switch
          checked={t.trainerPermissions.canManageExerciseLibrary}
          disabled={!canEdit(t) || permissionsMutation.isPending}
          onCheckedChange={(checked) => permissionsMutation.mutate({ trainerId: t.id, updates: { canManageExerciseLibrary: checked } })}
        />
      ),
    },
    {
      key: 'mealLibrary',
      header: 'Meal library',
      render: (t) => (
        <Switch
          checked={t.trainerPermissions.canManageMealLibrary}
          disabled={!canEdit(t) || permissionsMutation.isPending}
          onCheckedChange={(checked) => permissionsMutation.mutate({ trainerId: t.id, updates: { canManageMealLibrary: checked } })}
        />
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Trainers</h1>
        <p className="mt-1 text-muted-foreground">
          Control whether each trainer can create, edit, or delete exercises and meals in your library.
          {isSuperadmin && ' As Super Admin, you can also reassign which trainers report to a gym admin vs. directly to you.'}
        </p>
      </div>

      {trainersQuery.isPending ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : trainersQuery.isError ? (
        <ErrorState message="Couldn't load trainers." />
      ) : trainers.length === 0 ? (
        <EmptyState icon={<Users2 className="size-5" />} title="No trainers yet" description="Approved trainer accounts will appear here." />
      ) : (
        <div className="rounded-xl border">
          <DataTable columns={columns} data={trainers} getRowKey={(t) => t.id} />
        </div>
      )}

      {!isSuperadmin && trainers.some((t) => t.reportsToRole === 'superadmin') && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" />
          Trainers marked "Super admin" report directly to the platform - only a Super Admin can change their access.
        </p>
      )}
    </div>
  )
}
