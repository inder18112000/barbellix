import { useEffect, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { Send, MessageSquare } from 'lucide-react'
import { queryKeys, fetchTrainerMembers, fetchMessageThread, sendMessage, markMessageRead } from '@/api/queries'
import { authStore } from '@/store/authStore'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { cn } from '@/lib/utils'

export const MessagesPage = observer(function MessagesPage() {
  const { otherUserId } = useParams<{ otherUserId?: string }>()
  const navigate = useNavigate()
  const membersQuery = useQuery({ queryKey: queryKeys.trainer.members, queryFn: fetchTrainerMembers })

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Messages</h1>
        <p className="mt-1 text-muted-foreground">Direct messages with your members.</p>
      </div>

      <Card className="flex min-h-0 flex-1 flex-row overflow-hidden p-0">
        <aside className="flex w-64 shrink-0 flex-col overflow-y-auto border-r">
          {membersQuery.isPending ? (
            <div className="flex flex-col gap-2 p-3">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : membersQuery.isError ? (
            <div className="p-3">
              <ErrorState message="Couldn't load members." />
            </div>
          ) : (
            membersQuery.data.map((member) => (
              <button
                key={member.id}
                onClick={() => navigate(`/trainer/messages/${member.id}`)}
                className={cn(
                  'flex items-center gap-2.5 border-b px-4 py-3 text-left text-sm transition-colors hover:bg-accent',
                  otherUserId === member.id && 'bg-accent',
                )}
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {member.firstName[0]}
                  {member.lastName[0]}
                </div>
                <span className="truncate font-medium">
                  {member.firstName} {member.lastName}
                </span>
              </button>
            ))
          )}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {!otherUserId ? (
            <div className="flex flex-1 items-center justify-center">
              <EmptyState icon={<MessageSquare className="size-5" />} title="Select a member" description="Pick someone from the list to view your conversation." />
            </div>
          ) : (
            <Thread key={otherUserId} otherUserId={otherUserId} memberName={membersQuery.data?.find((m) => m.id === otherUserId)} />
          )}
        </div>
      </Card>
    </div>
  )
})

function Thread({ otherUserId, memberName }: { otherUserId: string; memberName?: { firstName: string; lastName: string } }) {
  const queryClient = useQueryClient()
  const myId = authStore.user?.id
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const threadQuery = useQuery({ queryKey: queryKeys.messages(otherUserId), queryFn: () => fetchMessageThread(otherUserId) })

  const sendMutation = useMutation({
    mutationFn: (text: string) => sendMessage(otherUserId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages(otherUserId) })
      setDraft('')
    },
  })

  const readMutation = useMutation({ mutationFn: (id: string) => markMessageRead(id) })

  useEffect(() => {
    if (!threadQuery.data) return
    const unread = threadQuery.data.filter((m) => !m.read && m.senderId === otherUserId)
    unread.forEach((m) => readMutation.mutate(m.id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadQuery.data, otherUserId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [threadQuery.data])

  return (
    <>
      <div className="border-b px-4 py-3">
        <p className="font-medium">{memberName ? `${memberName.firstName} ${memberName.lastName}` : 'Conversation'}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {threadQuery.isPending ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="ml-auto h-10 w-2/3" />
          </div>
        ) : threadQuery.isError ? (
          <ErrorState message="Couldn't load this conversation." />
        ) : threadQuery.data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No messages yet - say hello.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {threadQuery.data.map((message) => {
              const isMine = message.senderId === myId
              return (
                <div key={message.id} className={cn('flex flex-col', isMine ? 'items-end' : 'items-start')}>
                  <div
                    className={cn(
                      'max-w-[70%] rounded-2xl px-3.5 py-2 text-sm',
                      isMine ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
                    )}
                  >
                    {message.text}
                  </div>
                  <span className="mt-1 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                  </span>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <form
        className="flex gap-2 border-t p-3"
        onSubmit={(e) => {
          e.preventDefault()
          const text = draft.trim()
          if (!text) return
          sendMutation.mutate(text)
        }}
      >
        <Input placeholder="Write a message…" value={draft} onChange={(e) => setDraft(e.target.value)} />
        <Button type="submit" size="icon" disabled={!draft.trim() || sendMutation.isPending}>
          <Send className="size-4" />
        </Button>
      </form>
    </>
  )
}
