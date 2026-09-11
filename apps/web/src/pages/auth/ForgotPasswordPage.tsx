import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { forgotPasswordSchema, type ForgotPasswordInput } from '@barbellix/shared'
import { forgotPassword } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, MailCheck } from 'lucide-react'
import { BrandMark } from '@/components/common/BrandMark'

export function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const { mutate: sendReset, isPending } = useMutation({
    mutationFn: (data: ForgotPasswordInput) => forgotPassword(data),
    // The server always responds with the same generic message regardless of whether the
    // account exists, to prevent user enumeration - so there's nothing to branch on here, only
    // network/validation failures reach isError, and even those don't need a different UI: the
    // reset flow is the same either way.
    onSuccess: () => setSentTo(getValues('email')),
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
            {sentTo ? (
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <MailCheck className="size-10 text-primary" />
                <h2 className="text-base font-semibold">Check your inbox</h2>
                <p className="text-sm text-muted-foreground">
                  If an account exists for <span className="text-foreground">{sentTo}</span>, we've sent a link to
                  reset your password. It expires in 1 hour.
                </p>
                <Link to="/login" className="mt-2 flex items-center gap-1.5 text-sm text-primary hover:underline">
                  <ArrowLeft className="size-4" />
                  Back to login
                </Link>
              </div>
            ) : (
              <form className="flex flex-col gap-4" onSubmit={handleSubmit((data) => sendReset(data))}>
                <div>
                  <h2 className="text-base font-semibold">Forgot password?</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Enter your email and we'll send you a link to reset it.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Controller
                    control={control}
                    name="email"
                    render={({ field }) => (
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@gym.com"
                        aria-invalid={!!errors.email}
                        {...field}
                      />
                    )}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>

                <Button type="submit" className="mt-2" disabled={isPending}>
                  {isPending ? 'Sending…' : 'Send reset link'}
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
