import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { updateMyInfo, changeMyPassword } from '@/api/queries'
import { authStore } from '@/store/authStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ROLE_LABELS } from '@/lib/roleLabels'

export const SettingsPage = observer(function SettingsPage() {
  const user = authStore.user

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
    </div>
  )
})
