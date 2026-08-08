import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { CheckInMethod } from '@barbellix/shared'
import { queryKeys, fetchBranch, updateBranch } from '@/api/queries'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/common/ErrorState'
import { cn } from '@/lib/utils'

const CHECK_IN_METHODS: { value: CheckInMethod; label: string }[] = [
  { value: 'qr', label: 'QR code' },
  { value: 'nfc', label: 'NFC tap' },
  { value: 'pin', label: 'PIN entry' },
  { value: 'manual', label: 'Manual (front desk)' },
]

interface FormState {
  name: string
  location: string
  capacity: string
  checkInMethods: CheckInMethod[]
  checkInPin: string
  autoCheckoutEnabled: boolean
  autoCheckoutAfterMins: string
  guestPassEnabled: boolean
  gracePeriodDays: string
}

export const BranchSettingsPage = observer(function BranchSettingsPage() {
  const queryClient = useQueryClient()
  const { data, isPending, isError } = useQuery({ queryKey: queryKeys.admin.branch, queryFn: fetchBranch })
  const [form, setForm] = useState<FormState | null>(null)

  useEffect(() => {
    if (!data) return
    setForm({
      name: data.name,
      location: data.location,
      capacity: data.capacity != null ? String(data.capacity) : '',
      checkInMethods: data.checkInMethods,
      checkInPin: data.checkInPin,
      autoCheckoutEnabled: data.autoCheckoutEnabled,
      autoCheckoutAfterMins: String(data.autoCheckoutAfterMins),
      guestPassEnabled: data.guestPassEnabled,
      gracePeriodDays: String(data.gracePeriodDays),
    })
  }, [data])

  const mutation = useMutation({
    mutationFn: (updates: Parameters<typeof updateBranch>[0]) => updateBranch(updates),
    onSuccess: (branch) => {
      queryClient.setQueryData(queryKeys.admin.branch, branch)
      toast.success('Branch settings saved')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const toggleMethod = (method: CheckInMethod) => {
    setForm((prev) => {
      if (!prev) return prev
      const has = prev.checkInMethods.includes(method)
      const next = has ? prev.checkInMethods.filter((m) => m !== method) : [...prev.checkInMethods, method]
      return { ...prev, checkInMethods: next }
    })
  }

  if (isPending || !form) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full max-w-2xl" />
      </div>
    )
  }

  if (isError) return <ErrorState message="Couldn't load branch settings." />

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Branch settings</h1>
        <p className="mt-1 text-muted-foreground">Configure how members check in at your gym.</p>
      </div>

      <form
        className="max-w-2xl"
        onSubmit={(e) => {
          e.preventDefault()
          if (form.checkInMethods.length === 0) {
            toast.error('Enable at least one check-in method.')
            return
          }
          if (form.checkInMethods.includes('pin') && !/^\d{6}$/.test(form.checkInPin)) {
            toast.error('Check-in PIN must be exactly 6 digits.')
            return
          }
          mutation.mutate({
            name: form.name,
            location: form.location,
            capacity: form.capacity ? Number(form.capacity) : undefined,
            checkInMethods: form.checkInMethods,
            checkInPin: form.checkInPin,
            autoCheckoutEnabled: form.autoCheckoutEnabled,
            autoCheckoutAfterMins: Number(form.autoCheckoutAfterMins) || 60,
            guestPassEnabled: form.guestPassEnabled,
            gracePeriodDays: Number(form.gracePeriodDays) || 0,
          })
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>Your gym's name and location.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Branch name</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="location">Location</Label>
                <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="capacity">Capacity (optional)</Label>
              <Input
                id="capacity"
                type="number"
                min="0"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                placeholder="No limit"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Check-in methods</Label>
              <div className="flex flex-wrap gap-2">
                {CHECK_IN_METHODS.map((method) => {
                  const active = form.checkInMethods.includes(method.value)
                  return (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => toggleMethod(method.value)}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                        active
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                      )}
                    >
                      {method.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {form.checkInMethods.includes('pin') && (
              <div className="flex flex-col gap-1.5 pl-1">
                <Label htmlFor="checkInPin">Check-in PIN</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="checkInPin"
                    inputMode="numeric"
                    value={form.checkInPin}
                    onChange={(e) => setForm({ ...form, checkInPin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    className="max-w-32 font-mono tracking-widest"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setForm({ ...form, checkInPin: String(Math.floor(100000 + Math.random() * 900000)) })}
                  >
                    Regenerate
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Give this to members at the front desk if they can't scan the QR code.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between rounded-md border px-3 py-2.5">
              <div>
                <p className="text-sm font-medium">Auto checkout</p>
                <p className="text-xs text-muted-foreground">Automatically check members out after a set time.</p>
              </div>
              <Switch
                checked={form.autoCheckoutEnabled}
                onCheckedChange={(checked) => setForm({ ...form, autoCheckoutEnabled: checked })}
              />
            </div>
            {form.autoCheckoutEnabled && (
              <div className="flex flex-col gap-1.5 pl-1">
                <Label htmlFor="autoCheckoutAfterMins">Auto checkout after (minutes)</Label>
                <Input
                  id="autoCheckoutAfterMins"
                  type="number"
                  min="1"
                  className="max-w-40"
                  value={form.autoCheckoutAfterMins}
                  onChange={(e) => setForm({ ...form, autoCheckoutAfterMins: e.target.value })}
                />
              </div>
            )}

            <div className="flex items-center justify-between rounded-md border px-3 py-2.5">
              <div>
                <p className="text-sm font-medium">Guest passes</p>
                <p className="text-xs text-muted-foreground">Allow non-member guests to check in.</p>
              </div>
              <Switch
                checked={form.guestPassEnabled}
                onCheckedChange={(checked) => setForm({ ...form, guestPassEnabled: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Membership enforcement</CardTitle>
            <CardDescription>
              Grace period after a membership expires before access is blocked - checked the moment a member tries to log in, not by a
              background job. Restored automatically as soon as they pay.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="gracePeriodDays">Grace period (days)</Label>
              <Input
                id="gracePeriodDays"
                type="number"
                min="0"
                max="30"
                className="max-w-40"
                value={form.gracePeriodDays}
                onChange={(e) => setForm({ ...form, gracePeriodDays: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Set to 0 to block access immediately on expiry.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
})
