import { useQuery } from '@tanstack/react-query'
import { Building2, Users, UserCog, CreditCard } from 'lucide-react'
import { queryKeys, fetchPlatformTenants } from '@/api/queries'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { Badge } from '@/components/ui/badge'
import type { PlatformTenantSummary } from '@barbellix/shared'

const PLAN_TIER_LABELS: Record<PlatformTenantSummary['planTier'], string> = {
  free: 'Free',
  pro: 'Pro',
  gym_starter: 'Gym Starter',
  gym_business: 'Gym Business',
  enterprise: 'Enterprise',
}

export function PlatformOverviewPage() {
  const tenantsQuery = useQuery({ queryKey: queryKeys.superadmin.tenants, queryFn: fetchPlatformTenants })
  const tenants = tenantsQuery.data ?? []

  const totals = tenants.reduce(
    (acc, t) => ({
      tenants: acc.tenants + 1,
      members: acc.members + t.memberCount,
      trainers: acc.trainers + t.trainerCount,
      activeMemberships: acc.activeMemberships + t.activeMembershipCount,
    }),
    { tenants: 0, members: 0, trainers: 0, activeMemberships: 0 },
  )

  const columns: DataTableColumn<PlatformTenantSummary>[] = [
    {
      key: 'name',
      header: 'Gym',
      render: (t) => (
        <div className="flex flex-col">
          <span className="font-medium">{t.name}</span>
          <span className="text-xs text-muted-foreground">Since {new Date(t.createdAt).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      key: 'planTier',
      header: 'Plan',
      render: (t) => <Badge variant="outline">{PLAN_TIER_LABELS[t.planTier]}</Badge>,
    },
    { key: 'members', header: 'Members', className: 'text-sm', render: (t) => t.memberCount },
    { key: 'trainers', header: 'Trainers', className: 'text-sm', render: (t) => t.trainerCount },
    { key: 'active', header: 'Active memberships', className: 'text-sm', render: (t) => t.activeMembershipCount },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Platform Overview</h1>
        <p className="mt-1 text-muted-foreground">Every gym on BarBellix - visible only to Super Admin, never scoped to one tenant.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">Gyms</p>
            <p className="flex items-center gap-1.5 text-lg font-semibold">
              <Building2 className="size-4 text-primary" />
              {totals.tenants}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">Total members</p>
            <p className="flex items-center gap-1.5 text-lg font-semibold">
              <Users className="size-4 text-primary" />
              {totals.members}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">Total trainers</p>
            <p className="flex items-center gap-1.5 text-lg font-semibold">
              <UserCog className="size-4 text-primary" />
              {totals.trainers}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">Active memberships</p>
            <p className="flex items-center gap-1.5 text-lg font-semibold">
              <CreditCard className="size-4 text-primary" />
              {totals.activeMemberships}
            </p>
          </CardContent>
        </Card>
      </div>

      {tenantsQuery.isPending ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : tenantsQuery.isError ? (
        <ErrorState message="Couldn't load gyms." />
      ) : tenants.length === 0 ? (
        <EmptyState icon={<Building2 className="size-5" />} title="No gyms yet" description="Gyms will appear here as they sign up." />
      ) : (
        <div className="rounded-xl border">
          <DataTable columns={columns} data={tenants} getRowKey={(t) => t.id} />
        </div>
      )}
    </div>
  )
}
