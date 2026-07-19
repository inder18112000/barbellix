import type { UserStatus, PaymentStatus, MembershipStatus } from '@fitpulse/shared'
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
