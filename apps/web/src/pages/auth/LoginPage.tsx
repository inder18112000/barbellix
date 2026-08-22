import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google'
import { loginSchema, type LoginInput, type User } from '@barbellix/shared'
import { login as loginRequest, loginWithGoogle } from '@/api/auth'
import { authStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { TriangleAlert } from 'lucide-react'
import { BrandMark } from '@/components/common/BrandMark'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

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

  // Shared by password login and Google login - both end with the exact same
  // "is this actually a staff account" gate and redirect, just reached via a different credential.
  const handleAuthSuccess = ({ user, accessToken, refreshToken }: { user: User; accessToken: string; refreshToken: string }) => {
    if (user.role === 'member') {
      setNotStaffError(true)
      return
    }
    setNotStaffError(false)
    authStore.login(user, accessToken, refreshToken)
    navigate(user.role === 'trainer' ? '/trainer' : '/admin', { replace: true })
  }

  const {
    mutate: doLogin,
    isPending,
    isError,
  } = useMutation({
    mutationFn: (data: LoginInput) => loginRequest(data),
    onSuccess: handleAuthSuccess,
  })

  const { mutate: doGoogleLogin, isError: isGoogleError } = useMutation({
    mutationFn: (idToken: string) => loginWithGoogle(idToken),
    onSuccess: handleAuthSuccess,
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <BrandMark variant="full" className="h-28 w-auto" />
          <h1 className="text-lg font-semibold uppercase tracking-wide text-muted-foreground">Management Dashboard</h1>
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
              {(isError || isGoogleError || notStaffError) && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                  <span>
                    {notStaffError
                      ? 'This dashboard is for gym owner and trainer accounts only.'
                      : isGoogleError
                        ? 'Google sign-in failed.'
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

            {GOOGLE_CLIENT_ID && (
              <>
                <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="h-px flex-1 bg-border" />
                  or
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={(credential: CredentialResponse) => {
                      if (credential.credential) doGoogleLogin(credential.credential)
                    }}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
