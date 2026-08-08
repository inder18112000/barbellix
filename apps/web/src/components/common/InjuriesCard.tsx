import { useQuery } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { INJURY_CONDITION_LABELS, type InjurySeverity } from '@barbellix/shared'
import { queryKeys, fetchMemberInjuries } from '@/api/queries'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

const SEVERITY_VARIANT: Record<InjurySeverity, 'success' | 'warning' | 'destructive'> = {
  mild: 'success',
  moderate: 'warning',
  severe: 'destructive',
}

/** Shared by the trainer and admin member-detail pages - same query, same read-only card either
 * way, so it's one component rather than two near-identical copies. Injuries are member-owned and
 * self-reported; staff can see them here but never edit them from this card. */
export function InjuriesCard({ memberId }: { memberId: string }) {
  const { data, isPending, isError } = useQuery({
    queryKey: queryKeys.trainer.injuries(memberId),
    queryFn: () => fetchMemberInjuries(memberId),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-warning" />
          Injuries
        </CardTitle>
        <CardDescription>Self-reported by the member - the AI plan generator avoids exercises that load these areas.</CardDescription>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <Skeleton className="h-12 w-full" />
        ) : isError ? (
          <p className="text-sm text-muted-foreground">Couldn't load injuries.</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No injuries logged.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {data.map((injury) => (
              <li key={injury.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="flex flex-col">
                  <span className="font-medium">
                    {injury.condition ? INJURY_CONDITION_LABELS[injury.condition] : <span className="capitalize">{injury.bodyPart.replace(/_/g, ' ')}</span>}
                  </span>
                  {injury.condition && <span className="text-xs text-muted-foreground capitalize">{injury.bodyPart.replace(/_/g, ' ')}</span>}
                  {injury.note && <span className="text-xs text-muted-foreground">{injury.note}</span>}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={SEVERITY_VARIANT[injury.severity]} className="capitalize">
                    {injury.severity}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{new Date(injury.loggedAt).toLocaleDateString()}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
