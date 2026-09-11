import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { resetPasswordSchema, type ResetPasswordInput } from '@barbellix/shared'
import { resetPassword } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, CircleCheck, TriangleAlert } from 'lucide-react'
import { BrandMark } from '@/components/common/BrandMark'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [done, setDone] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, newPassword: '', confirmNewPassword: '' },
  })

  const {
    mutate: doReset,
    isPending,
    error,
  } = useMutation({
    mutationFn: (data: ResetPasswordInput) => resetPassword(data),
    onSuccess: () => setDone(true),
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <BrandMark variant="full" className="h-28 w-auto" />
          <h1 className="text-lg font-semibold uppercase tracking-wide text-muted-foreground">Management Dashboard</h1>
        </div>

        <Card className="glass-card">
          <CardContent>
            {!token ? (
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <TriangleAlert className="size-10 text-destructive" />
                <h2 className="text-base font-semibold">This link is missing its token</h2>
                <p className="text-sm text-muted-foreground">
                  Open the reset link from your email again, or request a new one.
                </p>
                <Link to="/forgot-password" className="mt-2 text-sm text-primary hover:underline">
                  Request a new link
                </Link>
              </div>
            ) : done ? (
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <CircleCheck className="size-10 text-primary" />
                <h2 className="text-base font-semibold">Password reset</h2>
                <p className="text-sm text-muted-foreground">
                  Your password has been changed. Sign in with your new password to continue.
                </p>
                <Button className="mt-2 w-full" onClick={() => navigate('/login', { replace: true })}>
                  Go to login
                </Button>
              </div>
            ) : (
              <form className="flex flex-col gap-4" onSubmit={handleSubmit((data) => doReset(data))}>
                <div>
                  <h2 className="text-base font-semibold">Set a new password</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Choose a new password for your account.</p>
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                    <span>{error instanceof Error ? error.message : 'Something went wrong. Please try again.'}</span>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="newPassword">New password</Label>
                  <Controller
                    control={control}
                    name="newPassword"
                    render={({ field }) => (
                      <Input
                        id="newPassword"
                        type="password"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        aria-invalid={!!errors.newPassword}
                        {...field}
                      />
                    )}
                  />
                  {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword.message}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="confirmNewPassword">Confirm new password</Label>
                  <Controller
                    control={control}
                    name="confirmNewPassword"
                    render={({ field }) => (
                      <Input
                        id="confirmNewPassword"
                        type="password"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        aria-invalid={!!errors.confirmNewPassword}
                        {...field}
                      />
                    )}
                  />
                  {errors.confirmNewPassword && (
                    <p className="text-xs text-destructive">{errors.confirmNewPassword.message}</p>
                  )}
                </div>

                <Button type="submit" className="mt-2" disabled={isPending}>
                  {isPending ? 'Resetting…' : 'Reset password'}
                </Button>

                <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="size-4" />
                  Back to login
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
