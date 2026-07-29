import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { loginSchema, type LoginInput } from '@barbellix/shared'
import { login as loginRequest } from '@/api/auth'
import { authStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Zap, TriangleAlert } from 'lucide-react'

export function LoginPage() {
  const navigate = useNavigate()
  const [notStaffError, setNotStaffError] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const {
    mutate: doLogin,
    isPending,
    isError,
  } = useMutation({
    mutationFn: (data: LoginInput) => loginRequest(data),
    onSuccess: ({ user, accessToken, refreshToken }) => {
      // This dashboard is a staff-only tool - a member account authenticates fine against the
      // API (the credentials are real), but must not be handed a session here.
      if (user.role === 'member') {
        setNotStaffError(true)
        return
      }
      setNotStaffError(false)
      authStore.login(user, accessToken, refreshToken)
      navigate(user.role === 'trainer' ? '/trainer' : '/admin', { replace: true })
    },
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
            <Zap className="size-6" fill="currentColor" />
          </div>
          <h1 className="text-xl font-semibold">BarBellix Management</h1>
          <p className="text-sm text-muted-foreground">Sign in to your gym dashboard</p>
        </div>

        <Card className="glass-card">
          <CardContent>
            <form
              className="flex flex-col gap-4"
              onSubmit={handleSubmit((data) => {
                setNotStaffError(false)
                doLogin(data)
              })}
            >
              {(isError || notStaffError) && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                  <span>
                    {notStaffError
                      ? 'This dashboard is for gym owner and trainer accounts only.'
                      : 'Invalid email or password.'}
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Controller
                  control={control}
                  name="email"
                  render={({ field }) => (
                    <Input id="email" type="email" autoComplete="email" placeholder="you@gym.com" aria-invalid={!!errors.email} {...field} />
                  )}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Controller
                  control={control}
                  name="password"
                  render={({ field }) => (
                    <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••" aria-invalid={!!errors.password} {...field} />
                  )}
                />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>

              <Button type="submit" className="mt-2" disabled={isPending}>
                {isPending ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
