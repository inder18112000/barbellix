import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Users2, ShieldCheck, Plus, QrCode } from 'lucide-react'
import type { TrainerSummary } from '@barbellix/shared'
import { queryKeys, fetchAvailableTrainers, setTrainerPermissions, setTrainerReportsTo, createTrainer, generateTrainerLoginPairingToken } from '@/api/queries'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { LoginPairingDialog } from '@/components/common/LoginPairingDialog'
import { authStore } from '@/store/authStore'

/** Admin sees and edits only their own tenant's admin-reporting trainers (server-enforced too, not
 * just hidden here); superadmin sees every trainer platform-wide and is the only role that can
 * change reportsToRole - see trainer/service.ts's setTrainerPermissions() and
 * superadmin/service.ts's setTrainerReportsTo() for the actual authorization. */
export function TrainersPage() {
  const queryClient = useQueryClient()
  const isSuperadmin = authStore.user?.role === 'superadmin'
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [pairingTarget, setPairingTarget] = useState<TrainerSummary | null>(null)

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
    {
      key: 'actions',
      header: '',
      className: 'w-10',
      render: (t) => (
        <Button variant="ghost" size="icon" onClick={() => setPairingTarget(t)}>
          <QrCode className="size-4" />
        </Button>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Trainers</h1>
          <p className="mt-1 text-muted-foreground">
            Control whether each trainer can create, edit, or delete exercises and meals in your library.
            {isSuperadmin && ' As Super Admin, you can also reassign which trainers report to a gym admin vs. directly to you.'}
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="size-4" />
          New trainer
        </Button>
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

      <CreateTrainerDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreated={(trainer) => setPairingTarget(trainer)}
      />
      <LoginPairingDialog
        target={pairingTarget ? { id: pairingTarget.id, name: pairingTarget.name } : null}
        onClose={() => setPairingTarget(null)}
        onGenerate={generateTrainerLoginPairingToken}
      />
    </div>
  )
}

function CreateTrainerDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (trainer: TrainerSummary) => void
}) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (input: { firstName: string; lastName: string; email: string; phone?: string }) => createTrainer(input),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.availableTrainers })
      toast.success(`${result.user.firstName} added as a trainer`)
      onClose()
      onCreated({
        id: result.user.id,
        name: `${result.user.firstName} ${result.user.lastName}`,
        email: result.user.email,
        trainerPermissions: { canManageExerciseLibrary: true, canManageMealLibrary: true },
        reportsToRole: 'admin',
      })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New trainer</DialogTitle>
          <DialogDescription>
            Creates a trainer account with no password - after creating, you'll get a QR code for their first sign-in.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            mutation.mutate({
              firstName: String(formData.get('firstName') ?? '').trim(),
              lastName: String(formData.get('lastName') ?? '').trim(),
              email: String(formData.get('email') ?? '').trim(),
              phone: String(formData.get('phone') ?? '').trim() || undefined,
            })
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="trainer-firstName">First name</Label>
              <Input id="trainer-firstName" name="firstName" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="trainer-lastName">Last name</Label>
              <Input id="trainer-lastName" name="lastName" required />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="trainer-email">Email</Label>
            <Input id="trainer-email" name="email" type="email" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="trainer-phone">Phone (optional)</Label>
            <Input id="trainer-phone" name="phone" type="tel" placeholder="+91 98765 43210" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating…' : 'Create trainer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
