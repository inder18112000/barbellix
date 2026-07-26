import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Handshake, Pencil, ExternalLink } from 'lucide-react'
import type { Sponsor } from '@fitpulse/shared'
import { queryKeys, fetchAllSponsors, createSponsor, updateSponsor, type CreateSponsorInput } from '@/api/queries'
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
import { cn } from '@/lib/utils'

// A fixed, high-contrast gradient rotation for sponsor brand marks - deterministic per sponsor
// (by name) rather than random, so a given sponsor's color stays stable across reloads.
const GRADIENTS = [
  'from-primary to-fuchsia-500',
  'from-amber-500 to-primary',
  'from-emerald-500 to-primary',
  'from-rose-500 to-primary',
  'from-primary to-cyan-500',
]
function gradientFor(name: string) {
  const hash = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return GRADIENTS[hash % GRADIENTS.length]
}

export const SponsorsPage = observer(function SponsorsPage() {
  const [dialogState, setDialogState] = useState<{ mode: 'create' } | { mode: 'edit'; sponsor: Sponsor } | null>(null)

  const { data, isPending, isError } = useQuery({ queryKey: queryKeys.admin.sponsors, queryFn: fetchAllSponsors })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Sponsors &amp; brand deals</h1>
          <p className="mt-1 text-muted-foreground">Shown to members on the "Sponsorship" tab of the mobile app.</p>
        </div>
        <Button onClick={() => setDialogState({ mode: 'create' })}>
          <Plus className="size-4" />
          New sponsor
        </Button>
      </div>

      {isPending ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
      ) : isError ? (
        <ErrorState message="Couldn't load sponsors." />
      ) : data.length === 0 ? (
        <EmptyState
          icon={<Handshake className="size-5" />}
          title="No sponsors yet"
          description="Add a brand or partner deal to show members on the mobile app."
          action={
            <Button size="sm" onClick={() => setDialogState({ mode: 'create' })}>
              <Plus className="size-4" />
              New sponsor
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((sponsor) => (
            <Card key={sponsor.id} className="overflow-hidden py-0">
              <div className={cn('h-2 w-full bg-gradient-to-r', gradientFor(sponsor.name))} />
              <CardHeader className="flex-row items-start justify-between pt-5">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold text-white shadow-md',
                      gradientFor(sponsor.name),
                    )}
                  >
                    {sponsor.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">{sponsor.name}</CardTitle>
                    <Badge variant={sponsor.active ? 'success' : 'secondary'} className="mt-1">
                      {sponsor.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setDialogState({ mode: 'edit', sponsor })}>
                  <Pencil className="size-4" />
                </Button>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 pb-5">
                {sponsor.description && <p className="text-sm text-muted-foreground">{sponsor.description}</p>}
                {sponsor.websiteUrl && (
                  <a
                    href={sponsor.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    Visit website
                    <ExternalLink className="size-3.5" />
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SponsorDialog state={dialogState} onClose={() => setDialogState(null)} />
    </div>
  )
})

function SponsorDialog({
  state,
  onClose,
}: {
  state: { mode: 'create' } | { mode: 'edit'; sponsor: Sponsor } | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const editingSponsor = state?.mode === 'edit' ? state.sponsor : null

  const createMutation = useMutation({
    mutationFn: (input: CreateSponsorInput) => createSponsor(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.sponsors })
      toast.success('Sponsor added')
      onClose()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<CreateSponsorInput> & { active?: boolean }) => {
      if (!editingSponsor) throw new Error('No sponsor selected')
      return updateSponsor(editingSponsor.id, updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.sponsors })
      toast.success('Sponsor updated')
      onClose()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={!!state} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingSponsor ? 'Edit sponsor' : 'New sponsor'}</DialogTitle>
          <DialogDescription>Shown on the member app's Sponsorship tab when active.</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            const name = String(formData.get('name') ?? '').trim()
            const description = String(formData.get('description') ?? '').trim()
            const websiteUrl = String(formData.get('websiteUrl') ?? '').trim()
            const active = formData.get('active') === 'on'

            if (!name) {
              toast.error('Enter a sponsor name.')
              return
            }

            if (editingSponsor) {
              updateMutation.mutate({ name, description: description || undefined, websiteUrl: websiteUrl || undefined, active })
            } else {
              createMutation.mutate({ name, description: description || undefined, websiteUrl: websiteUrl || undefined })
            }
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" placeholder="IronForge Supplements" required defaultValue={editingSponsor?.name} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              name="description"
              placeholder="Official protein partner - members get 15% off"
              defaultValue={editingSponsor?.description}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="websiteUrl">Website (optional)</Label>
            <Input id="websiteUrl" name="websiteUrl" type="url" placeholder="https://…" defaultValue={editingSponsor?.websiteUrl} />
          </div>

          {editingSponsor && (
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <Label htmlFor="active">Active</Label>
              <Switch id="active" name="active" defaultChecked={editingSponsor.active} />
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : editingSponsor ? 'Save changes' : 'Add sponsor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
