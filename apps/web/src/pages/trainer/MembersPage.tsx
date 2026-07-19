import { useMemo, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search, Users, Flame } from 'lucide-react'
import { queryKeys, fetchTrainerMembers } from '@/api/queries'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { UserStatusBadge } from '@/lib/statusBadges'

export const MembersPage = observer(function MembersPage() {
  const [search, setSearch] = useState('')
  const membersQuery = useQuery({ queryKey: queryKeys.trainer.members, queryFn: fetchTrainerMembers })

  const filtered = useMemo(() => {
    const rows = membersQuery.data ?? []
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((m) => `${m.firstName} ${m.lastName} ${m.email}`.toLowerCase().includes(q))
  }, [membersQuery.data, search])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Members</h1>
          <p className="mt-1 text-muted-foreground">Your gym's member roster.</p>
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
                <TableHead>Streak</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((member) => (
                <TableRow key={member.id} className="cursor-pointer">
                  <TableCell>
                    <Link to={`/trainer/members/${member.id}`} className="flex flex-col hover:text-primary">
                      <span className="font-medium">
                        {member.firstName} {member.lastName}
                      </span>
                      <span className="text-xs text-muted-foreground">{member.email}</span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <UserStatusBadge status={member.status} />
                  </TableCell>
                  <TableCell className="text-sm">{member.plan || '—'}</TableCell>
                  <TableCell className="text-sm">
                    <span className="flex items-center gap-1">
                      <Flame className="size-3.5 text-warning" />
                      {member.streak}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{member.sessionsCount}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(member.joinDate).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
})
