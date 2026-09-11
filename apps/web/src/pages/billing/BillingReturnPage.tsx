import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'

/**
 * Where Cashfree redirects the browser after checkout reaches a terminal state (success, failed,
 * or cancelled) - see CASHFREE_RETURN_URL / createCheckoutSessionForMember. This page is
 * deliberately just a confirmation screen, not a source of truth: the webhook
 * (handleCashfreeWebhook), not this redirect, is what actually records the payment - a member
 * could close the tab before this page even loads and the payment would still be credited once
 * Cashfree's webhook arrives. This matches the same philosophy the mobile checkout screen already
 * uses (poll GET /me/membership rather than trust the redirect).
 */
export function BillingReturnPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <div className="flex max-w-sm flex-col items-center gap-3 text-center">
        <CheckCircle2 className="size-10 text-primary" />
        <h1 className="text-lg font-semibold">Thanks!</h1>
        <p className="text-sm text-muted-foreground">
          If your payment went through, it'll be reflected on your account shortly. You can close this window.
        </p>
        <Link to="/login" className="text-sm text-primary hover:underline">
          Back to login
        </Link>
      </div>
    </div>
  )
}
