import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, CreditCard, Pencil } from 'lucide-react'
import type { MembershipPlan } from '@barbellix/shared'
import { queryKeys, fetchMembershipPlans, createMembershipPlan, updateMembershipPlan, type CreatePlanInput } from '@/api/queries'
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

export const MembershipPlansPage = observer(function MembershipPlansPage() {
  const [dialogState, setDialogState] = useState<{ mode: 'create' } | { mode: 'edit'; plan: MembershipPlan } | null>(null)

  const { data, isPending, isError } = useQuery({ queryKey: queryKeys.admin.membershipPlans, queryFn: fetchMembershipPlans })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Membership plans</h1>
          <p className="mt-1 text-muted-foreground">Plans members can be checked out against via Stripe.</p>
        </div>
        <Button onClick={() => setDialogState({ mode: 'create' })}>
          <Plus className="size-4" />
          New plan
        </Button>
      </div>

      {isPending ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : isError ? (
        <ErrorState message="Couldn't load membership plans." />
      ) : data.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="size-5" />}
          title="No membership plans yet"
          description="Create your first plan to start charging members through Stripe."
          action={
            <Button size="sm" onClick={() => setDialogState({ mode: 'create' })}>
              <Plus className="size-4" />
              New plan
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((plan) => (
            <Card key={plan.id} className="glass-card">
              <CardHeader className="flex-row items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {plan.name}
                    <Badge variant={plan.active ? 'success' : 'secondary'}>{plan.active ? 'Active' : 'Inactive'}</Badge>
                  </CardTitle>
                  {plan.description && <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>}
                </div>
                <Button variant="ghost" size="icon" onClick={() => setDialogState({ mode: 'edit', plan })}>
                  <Pencil className="size-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tracking-tight">
                  ${(plan.priceCents / 100).toFixed(2)}
                  <span className="text-sm font-normal text-muted-foreground">/{plan.billingInterval}</span>
                </p>
                {!plan.stripePriceId && (
                  <p className="mt-2 text-xs text-warning">Stripe not configured yet - checkout links won't work for this plan.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PlanDialog state={dialogState} onClose={() => setDialogState(null)} />
    </div>
  )
})

function PlanDialog({
  state,
  onClose,
}: {
  state: { mode: 'create' } | { mode: 'edit'; plan: MembershipPlan } | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const editingPlan = state?.mode === 'edit' ? state.plan : null

  const createMutation = useMutation({
    mutationFn: (input: CreatePlanInput) => createMembershipPlan(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.membershipPlans })
      toast.success('Plan created')
      onClose()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<CreatePlanInput> & { active?: boolean }) => {
      if (!editingPlan) throw new Error('No plan selected')
      return updateMembershipPlan(editingPlan.id, updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.membershipPlans })
      toast.success('Plan updated')
      onClose()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={!!state} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingPlan ? 'Edit plan' : 'New membership plan'}</DialogTitle>
          <DialogDescription>
            {editingPlan
              ? 'Changing the price creates a new Stripe price and archives the old one.'
              : 'This creates a matching product and price in Stripe automatically.'}
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            const name = String(formData.get('name') ?? '').trim()
            const description = String(formData.get('description') ?? '').trim()
            const priceDollars = Number(formData.get('price'))
            const billingInterval = String(formData.get('billingInterval')) as 'month' | 'year'
            const active = formData.get('active') === 'on'

            if (!name || Number.isNaN(priceDollars) || priceDollars < 0) {
              toast.error('Enter a valid name and price.')
              return
            }

            const priceCents = Math.round(priceDollars * 100)

            if (editingPlan) {
              updateMutation.mutate({ name, description: description || undefined, priceCents, billingInterval, active })
            } else {
              createMutation.mutate({ name, description: description || undefined, priceCents, billingInterval })
            }
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" placeholder="Monthly Membership" required defaultValue={editingPlan?.name} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description (optional)</Label>
            <Input id="description" name="description" placeholder="Full gym access, all classes" defaultValue={editingPlan?.description} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="price">Price (USD)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                required
                defaultValue={editingPlan ? (editingPlan.priceCents / 100).toFixed(2) : undefined}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="billingInterval">Billing interval</Label>
              <Select name="billingInterval" defaultValue={editingPlan?.billingInterval ?? 'month'}>
                <SelectTrigger className="w-full" id="billingInterval">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Monthly</SelectItem>
                  <SelectItem value="year">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {editingPlan && (
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <Label htmlFor="active">Active</Label>
              <Switch id="active" name="active" defaultChecked={editingPlan.active} />
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : editingPlan ? 'Save changes' : 'Create plan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
