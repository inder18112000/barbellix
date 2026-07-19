import { useMemo, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Search, MoreHorizontal, Users, Copy, Check } from 'lucide-react'
import type { TrainerMemberSummary } from '@fitpulse/shared'
import {
  queryKeys,
  fetchTrainerMembers,
  updateMemberStatus,
  fetchMembershipPlans,
  createCheckoutSession,
  markMemberPaid,
} from '@/api/queries'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
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
import { UserStatusBadge, PaymentStatusBadge, MembershipStatusBadge } from '@/lib/statusBadges'
import { authStore } from '@/store/authStore'

export const MembersPage = observer(function MembersPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [checkoutTarget, setCheckoutTarget] = useState<TrainerMemberSummary | null>(null)
  const [markPaidTarget, setMarkPaidTarget] = useState<TrainerMemberSummary | null>(null)

  const isAdmin = authStore.user?.role === 'admin'

  const membersQuery = useQuery({ queryKey: queryKeys.trainer.members, queryFn: fetchTrainerMembers })

  const filtered = useMemo(() => {
    const rows = membersQuery.data ?? []
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((m) => `${m.firstName} ${m.lastName} ${m.email}`.toLowerCase().includes(q))
  }, [membersQuery.data, search])

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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Members</h1>
          <p className="mt-1 text-muted-foreground">Your gym's full member roster.</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search members…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
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
        <EmptyState icon={<Users className="size-5" />} title="No members found" description={search ? 'Try a different search.' : 'No members have joined yet.'} />
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Workout plan</TableHead>
                <TableHead>Membership</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {member.firstName} {member.lastName}
                      </span>
                      <span className="text-xs text-muted-foreground">{member.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <UserStatusBadge status={member.status} />
                  </TableCell>
                  <TableCell className="text-sm">{member.plan || '—'}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <MembershipStatusBadge status={member.membershipStatus} />
                      {member.membershipPlan && <span className="text-xs text-muted-foreground">{member.membershipPlan}</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <PaymentStatusBadge status={member.paymentStatus} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(member.joinDate).toLocaleDateString()}</TableCell>
                  <TableCell>
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
                        {isAdmin && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Account</DropdownMenuLabel>
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <SendCheckoutLinkDialog member={checkoutTarget} onClose={() => setCheckoutTarget(null)} />

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
