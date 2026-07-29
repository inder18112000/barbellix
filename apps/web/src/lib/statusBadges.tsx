import type { UserStatus, PaymentStatus, MembershipStatus, SubscriptionStatus } from '@barbellix/shared'
import { Badge } from '@/components/ui/badge'

export function UserStatusBadge({ status }: { status: UserStatus }) {
  const variant = status === 'active' ? 'success' : status === 'suspended' ? 'destructive' : 'secondary'
  return (
    <Badge variant={variant} className="capitalize">
      {status}
    </Badge>
  )
}

export function PaymentStatusBadge({ status }: { status?: PaymentStatus }) {
  if (!status) return <Badge variant="outline">Unset</Badge>
  const variant = status === 'paid' || status === 'comp' ? 'success' : status === 'due' ? 'warning' : 'destructive'
  return (
    <Badge variant={variant} className="capitalize">
      {status}
    </Badge>
  )
}

export function MembershipStatusBadge({ status }: { status?: MembershipStatus }) {
  if (!status) return <Badge variant="outline">None</Badge>
  const variant = status === 'active' ? 'success' : status === 'paused' || status === 'incomplete' ? 'warning' : 'secondary'
  return (
    <Badge variant={variant} className="capitalize">
      {status}
    </Badge>
  )
}

/** The client's requested simplified 3-state traffic light (Active/Pending/Expired), distinct
 * from the more granular MembershipStatus/PaymentStatus badges above - see
 * billing/service.ts's deriveSubscriptionStatus() for how this is computed server-side. */
export function SubscriptionStatusBadge({ status }: { status?: SubscriptionStatus }) {
  if (!status) return <Badge variant="outline">None</Badge>
  const variant = status === 'active' ? 'success' : status === 'pending' ? 'warning' : 'destructive'
  return (
    <Badge variant={variant} className="capitalize">
      {status}
    </Badge>
  )
}
