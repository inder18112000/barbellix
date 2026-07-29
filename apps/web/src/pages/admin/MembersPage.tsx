import { useMemo, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Search, MoreHorizontal, Users, Copy, Check, ArrowUpDown, QrCode } from 'lucide-react'
import type { TrainerMemberSummary, SubscriptionStatus } from '@barbellix/shared'
import {
  queryKeys,
  fetchTrainerMembers,
  updateMemberStatus,
  updateMemberInfo,
  fetchMembershipPlans,
  createCheckoutSession,
  markMemberPaid,
  updateMembershipDates,
  generateLoginPairingToken,
} from '@/api/queries'
import { QRCodeImage } from '@/components/common/QRCodeImage'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { UserStatusBadge, PaymentStatusBadge, SubscriptionStatusBadge } from '@/lib/statusBadges'
import { authStore } from '@/store/authStore'

type SortKey = 'name' | 'joined' | 'subscription'

export const MembersPage = observer(function MembersPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [subscriptionFilter, setSubscriptionFilter] = useState<SubscriptionStatus | 'all'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [checkoutTarget, setCheckoutTarget] = useState<TrainerMemberSummary | null>(null)
  const [markPaidTarget, setMarkPaidTarget] = useState<TrainerMemberSummary | null>(null)
  const [datesTarget, setDatesTarget] = useState<TrainerMemberSummary | null>(null)
  const [infoTarget, setInfoTarget] = useState<TrainerMemberSummary | null>(null)
  const [pairingTarget, setPairingTarget] = useState<TrainerMemberSummary | null>(null)

  const isAdmin = authStore.user?.role === 'admin'

  const membersQuery = useQuery({ queryKey: queryKeys.trainer.members, queryFn: fetchTrainerMembers })

  const filtered = useMemo(() => {
    let rows = membersQuery.data ?? []
    const q = search.trim().toLowerCase()
    if (q) rows = rows.filter((m) => `${m.firstName} ${m.lastName} ${m.email} ${m.phone ?? ''}`.toLowerCase().includes(q))
    if (subscriptionFilter !== 'all') rows = rows.filter((m) => (m.subscriptionStatus ?? 'expired') === subscriptionFilter)

    const sorted = [...rows]
    if (sortKey === 'name') sorted.sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`))
    else if (sortKey === 'joined') sorted.sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime())
    else sorted.sort((a, b) => (a.subscriptionStatus ?? 'expired').localeCompare(b.subscriptionStatus ?? 'expired'))
    return sorted
  }, [membersQuery.data, search, subscriptionFilter, sortKey])

  const statusMutation = useMutation({
    mutationFn: ({ memberId, status }: { memberId: string; status: 'active' | 'suspended' }) =>
      updateMemberStatus(memberId, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trainer.members })
      toast.success(status === 'suspended' ? 'Member suspended' : 'Member reactivated')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const markPaidMutation = useMutation({
    mutationFn: ({ memberId, planName }: { memberId: string; planName: string }) => markMemberPaid(memberId, planName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trainer.members })
      toast.success('Marked as paid')
      setMarkPaidTarget(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const columns: DataTableColumn<TrainerMemberSummary>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (member) => (
        <Link to={`/admin/members/${member.id}`} className="flex flex-col hover:text-primary">
          <span className="font-medium">{member.firstName} {member.lastName}</span>
          <span className="text-xs text-muted-foreground">{member.email}</span>
          {member.phone && <span className="text-xs text-muted-foreground">{member.phone}</span>}
        </Link>
      ),
    },
    { key: 'status', header: 'Status', render: (member) => <UserStatusBadge status={member.status} /> },
    {
      key: 'subscription',
      header: 'Subscription',
      render: (member) => (
        <div className="flex flex-col gap-1">
          <SubscriptionStatusBadge status={member.subscriptionStatus} />
          {member.membershipPlan && <span className="text-xs text-muted-foreground">{member.membershipPlan}</span>}
        </div>
      ),
    },
    {
      key: 'payment',
      header: 'Payment',
      render: (member) => (
        <div className="flex flex-col gap-1">
          <PaymentStatusBadge status={member.paymentStatus} />
          {member.paymentMethod && <span className="text-xs text-muted-foreground capitalize">{member.paymentMethod}</span>}
        </div>
      ),
    },
    {
      key: 'expiry',
      header: 'Expiry',
      className: 'text-sm text-muted-foreground',
      render: (member) => (member.membershipEndDate ? new Date(member.membershipEndDate).toLocaleDateString() : '—'),
    },
    {
      key: 'joined',
      header: 'Joined',
      className: 'text-sm text-muted-foreground',
      render: (member) => new Date(member.joinDate).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-10',
      render: (member) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Membership</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setCheckoutTarget(member)}>Send checkout link</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setMarkPaidTarget(member)}>Mark as paid</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDatesTarget(member)}>Edit membership dates</DropdownMenuItem>
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setInfoTarget(member)}>Edit name / phone</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPairingTarget(member)}>
                  <QrCode className="size-4" />
                  Generate sign-in QR
                </DropdownMenuItem>
                {member.status === 'suspended' ? (
                  <DropdownMenuItem onClick={() => statusMutation.mutate({ memberId: member.id, status: 'active' })}>
                    Reactivate member
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => statusMutation.mutate({ memberId: member.id, status: 'suspended' })}
                  >
                    Suspend member
                  </DropdownMenuItem>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Members</h1>
          <p className="mt-1 text-muted-foreground">Your gym's full member roster.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={subscriptionFilter} onValueChange={(v) => setSubscriptionFilter(v as SubscriptionStatus | 'all')}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
            <SelectTrigger className="w-40">
              <ArrowUpDown className="size-3.5" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sort: Name</SelectItem>
              <SelectItem value="joined">Sort: Joined date</SelectItem>
              <SelectItem value="subscription">Sort: Subscription</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative w-64">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search members…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {membersQuery.isPending ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : membersQuery.isError ? (
        <ErrorState message="Couldn't load members." />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Users className="size-5" />} title="No members found" description={search ? 'Try a different search.' : 'No members match this filter.'} />
      ) : (
        <div className="rounded-xl border">
          <DataTable columns={columns} data={filtered} getRowKey={(member) => member.id} />
        </div>
      )}

      <SendCheckoutLinkDialog member={checkoutTarget} onClose={() => setCheckoutTarget(null)} />
      <EditMembershipDatesDialog member={datesTarget} onClose={() => setDatesTarget(null)} />
      <EditMemberInfoDialog member={infoTarget} onClose={() => setInfoTarget(null)} />
      <LoginPairingDialog member={pairingTarget} onClose={() => setPairingTarget(null)} />

      <Dialog open={!!markPaidTarget} onOpenChange={(open) => !open && setMarkPaidTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as paid</DialogTitle>
            <DialogDescription>
              Records {markPaidTarget?.firstName} {markPaidTarget?.lastName} as paid outside of Stripe (cash, bank transfer, etc.) - no
              Stripe call is made.
            </DialogDescription>
          </DialogHeader>
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const planName = String(formData.get('planName') ?? '').trim()
              if (!markPaidTarget || !planName) return
              markPaidMutation.mutate({ memberId: markPaidTarget.id, planName })
            }}
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="planName">Plan name</Label>
              <Input id="planName" name="planName" placeholder="e.g. Monthly Membership" required defaultValue={markPaidTarget?.membershipPlan ?? ''} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={markPaidMutation.isPending}>
                {markPaidMutation.isPending ? 'Saving…' : 'Mark as paid'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
})

function EditMembershipDatesDialog({ member, onClose }: { member: TrainerMemberSummary | null; onClose: () => void }) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (dates: { startDate?: string; endDate?: string }) => {
      if (!member) throw new Error('No member selected')
      return updateMembershipDates(member.id, dates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trainer.members })
      toast.success('Membership dates updated')
      onClose()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <Dialog open={!!member} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit membership dates</DialogTitle>
          <DialogDescription>
            Set the membership start and expiry dates for {member?.firstName} {member?.lastName}. Requires an existing membership
            (send a checkout link or mark as paid first).
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            const startDate = String(formData.get('startDate') ?? '')
            const endDate = String(formData.get('endDate') ?? '')
            mutation.mutate({ startDate: startDate || undefined, endDate: endDate || undefined })
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="startDate">Start date</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                defaultValue={member?.membershipStartDate ? member.membershipStartDate.slice(0, 10) : ''}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="endDate">Expiry date</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                defaultValue={member?.membershipEndDate ? member.membershipEndDate.slice(0, 10) : ''}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save dates'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditMemberInfoDialog({ member, onClose }: { member: TrainerMemberSummary | null; onClose: () => void }) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (updates: { firstName?: string; lastName?: string; phone?: string }) => {
      if (!member) throw new Error('No member selected')
      return updateMemberInfo(member.id, updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trainer.members })
      toast.success('Member info updated')
      onClose()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <Dialog open={!!member} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit member info</DialogTitle>
          <DialogDescription>Update {member?.firstName} {member?.lastName}'s name and phone number.</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            mutation.mutate({
              firstName: String(formData.get('firstName') ?? ''),
              lastName: String(formData.get('lastName') ?? ''),
              phone: String(formData.get('phone') ?? '') || undefined,
            })
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" name="firstName" defaultValue={member?.firstName} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" name="lastName" defaultValue={member?.lastName} required />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Phone number</Label>
            <Input id="phone" name="phone" type="tel" defaultValue={member?.phone} placeholder="+1 555 123 4567" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function LoginPairingDialog({ member, onClose }: { member: TrainerMemberSummary | null; onClose: () => void }) {
  const mutation = useMutation({
    mutationFn: () => {
      if (!member) throw new Error('No member selected')
      return generateLoginPairingToken(member.id)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleClose = (open: boolean) => {
    if (open) return
    mutation.reset()
    onClose()
  }

  return (
    <Dialog open={!!member} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign-in QR code</DialogTitle>
          <DialogDescription>
            {member?.firstName} scans this once in the mobile app to sign in instantly - no password needed. Expires in 10 minutes and
            works only once.
          </DialogDescription>
        </DialogHeader>

        {mutation.data ? (
          <div className="flex flex-col items-center gap-3 py-2">
            <QRCodeImage value={mutation.data.token} />
            <p className="text-xs text-muted-foreground">
              Expires at {new Date(mutation.data.expiresAt).toLocaleTimeString()}
            </p>
          </div>
        ) : (
          <Button className="w-fit" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? 'Generating…' : 'Generate QR code'}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}

function SendCheckoutLinkDialog({ member, onClose }: { member: TrainerMemberSummary | null; onClose: () => void }) {
  const [planId, setPlanId] = useState<string>('')
  const [copied, setCopied] = useState(false)

  const plansQuery = useQuery({
    queryKey: queryKeys.admin.membershipPlans,
    queryFn: fetchMembershipPlans,
    enabled: !!member,
  })
  const activePlans = (plansQuery.data ?? []).filter((p) => p.active)

  const checkoutMutation = useMutation({
    mutationFn: () => {
      if (!member || !planId) throw new Error('Pick a plan first')
      return createCheckoutSession(member.id, planId)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleClose = (open: boolean) => {
    if (open) return
    setPlanId('')
    setCopied(false)
    checkoutMutation.reset()
    onClose()
  }

  return (
    <Dialog open={!!member} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send checkout link</DialogTitle>
          <DialogDescription>
            Creates a real Stripe Checkout session for {member?.firstName} {member?.lastName}. Share the link with them to collect payment.
          </DialogDescription>
        </DialogHeader>

        {checkoutMutation.data ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
              <span className="flex-1 truncate text-sm">{checkoutMutation.data.checkoutUrl}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(checkoutMutation.data!.checkoutUrl)
                  setCopied(true)
                  toast.success('Link copied')
                }}
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
            <Button asChild>
              <a href={checkoutMutation.data.checkoutUrl} target="_blank" rel="noreferrer">
                Open checkout page
              </a>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Membership plan</Label>
              <Select value={planId} onValueChange={setPlanId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={plansQuery.isPending ? 'Loading plans…' : 'Select a plan'} />
                </SelectTrigger>
                <SelectContent>
                  {activePlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} — ${(plan.priceCents / 100).toFixed(2)}/{plan.billingInterval}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!plansQuery.isPending && activePlans.length === 0 && (
                <p className="text-xs text-muted-foreground">No active membership plans yet - create one first.</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" disabled={!planId || checkoutMutation.isPending} onClick={() => checkoutMutation.mutate()}>
                {checkoutMutation.isPending ? 'Creating…' : 'Create checkout link'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
