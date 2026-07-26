import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CheckCircle2, XCircle } from 'lucide-react'
import type { NotificationPreferences } from '@fitpulse/shared'
import {
  updateMyInfo,
  changeMyPassword,
  queryKeys,
  fetchMyNotificationPreferences,
  updateMyNotificationPreferences,
  fetchPaymentGatewayStatus,
} from '@/api/queries'
import { authStore } from '@/store/authStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { ROLE_LABELS } from '@/lib/roleLabels'

const NOTIFICATION_LABELS: Record<keyof NotificationPreferences, string> = {
  workoutReminders: 'Workout reminders',
  workoutReminderTime: 'Workout reminder time',
  streakAlerts: 'Streak alerts',
  aiTips: 'AI coaching tips',
  checkInConfirmations: 'Check-in confirmations',
  weeklyReport: 'Weekly report',
  personalRecords: 'Personal record celebrations',
  trainerMessages: 'Trainer messages',
}
const NOTIFICATION_TOGGLE_KEYS = Object.keys(NOTIFICATION_LABELS).filter((k) => k !== 'workoutReminderTime') as Array<
  keyof NotificationPreferences
>

export const SettingsPage = observer(function SettingsPage() {
  const user = authStore.user
  const queryClient = useQueryClient()

  const notificationPrefsQuery = useQuery({
    queryKey: queryKeys.myNotificationPreferences,
    queryFn: fetchMyNotificationPreferences,
  })
  const notificationMutation = useMutation({
    mutationFn: (updates: Partial<NotificationPreferences>) => updateMyNotificationPreferences(updates),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.myNotificationPreferences, updated)
      toast.success('Notification settings saved')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const gatewayStatusQuery = useQuery({
    queryKey: queryKeys.admin.paymentGatewayStatus,
    queryFn: fetchPaymentGatewayStatus,
  })

  const infoMutation = useMutation({
    mutationFn: (updates: { firstName?: string; lastName?: string; phone?: string }) => updateMyInfo(updates),
    onSuccess: (updated) => {
      authStore.setUser(updated)
      toast.success('Profile updated')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const [passwordFields, setPasswordFields] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' })
  const passwordMutation = useMutation({
    mutationFn: () => changeMyPassword(passwordFields),
    onSuccess: () => {
      toast.success('Password updated')
      setPasswordFields({ currentPassword: '', newPassword: '', confirmNewPassword: '' })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your admin account.</p>
      </div>

      <form
        className="max-w-xl"
        onSubmit={(e) => {
          e.preventDefault()
          const formData = new FormData(e.currentTarget)
          infoMutation.mutate({
            firstName: String(formData.get('firstName') ?? ''),
            lastName: String(formData.get('lastName') ?? ''),
            phone: String(formData.get('phone') ?? '') || undefined,
          })
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              {user ? `${ROLE_LABELS[user.role]} · ${user.email}` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" name="firstName" defaultValue={user?.firstName} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" name="lastName" defaultValue={user?.lastName} required />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone number</Label>
              <Input id="phone" name="phone" type="tel" defaultValue={user?.phone} placeholder="+1 555 123 4567" />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={infoMutation.isPending}>
              {infoMutation.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </CardFooter>
        </Card>
      </form>

      <form
        className="max-w-xl"
        onSubmit={(e) => {
          e.preventDefault()
          if (passwordFields.newPassword !== passwordFields.confirmNewPassword) {
            toast.error('Passwords do not match')
            return
          }
          passwordMutation.mutate()
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Change your password.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordFields.currentPassword}
                onChange={(e) => setPasswordFields((f) => ({ ...f, currentPassword: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordFields.newPassword}
                  onChange={(e) => setPasswordFields((f) => ({ ...f, newPassword: e.target.value }))}
                  minLength={8}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirmNewPassword">Confirm new password</Label>
                <Input
                  id="confirmNewPassword"
                  type="password"
                  value={passwordFields.confirmNewPassword}
                  onChange={(e) => setPasswordFields((f) => ({ ...f, confirmNewPassword: e.target.value }))}
                  minLength={8}
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={passwordMutation.isPending}>
              {passwordMutation.isPending ? 'Updating…' : 'Update password'}
            </Button>
          </CardFooter>
        </Card>
      </form>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Notification settings</CardTitle>
          <CardDescription>Which notifications you personally receive.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {notificationPrefsQuery.isPending ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-9" />
              <Skeleton className="h-9" />
              <Skeleton className="h-9" />
            </div>
          ) : (
            NOTIFICATION_TOGGLE_KEYS.map((key) => (
              <div key={key} className="flex items-center justify-between rounded-md px-2 py-2.5">
                <Label htmlFor={key} className="font-normal">
                  {NOTIFICATION_LABELS[key]}
                </Label>
                <Switch
                  id={key}
                  checked={Boolean(notificationPrefsQuery.data?.[key])}
                  disabled={notificationMutation.isPending}
                  onCheckedChange={(checked) => notificationMutation.mutate({ [key]: checked })}
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Payment gateway</CardTitle>
          <CardDescription>Stripe keys are configured via server environment variables, never through this UI.</CardDescription>
        </CardHeader>
        <CardContent>
          {gatewayStatusQuery.isPending ? (
            <Skeleton className="h-9 w-40" />
          ) : gatewayStatusQuery.data?.stripeConfigured ? (
            <Badge variant="success" className="gap-1.5 text-sm">
              <CheckCircle2 className="size-3.5" />
              Stripe is configured
            </Badge>
          ) : (
            <div className="flex flex-col gap-2">
              <Badge variant="destructive" className="w-fit gap-1.5 text-sm">
                <XCircle className="size-3.5" />
                Stripe is not configured
              </Badge>
              <p className="text-sm text-muted-foreground">
                Set <code className="rounded bg-muted px-1 py-0.5">STRIPE_SECRET_KEY</code> and{' '}
                <code className="rounded bg-muted px-1 py-0.5">STRIPE_WEBHOOK_SECRET</code> in the server's environment to enable real
                checkout sessions. Membership plans and manual "mark as paid" still work without it.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
})
