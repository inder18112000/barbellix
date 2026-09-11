import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'

declare global {
  interface Window {
    Cashfree?: (config: { mode: 'sandbox' | 'production' }) => {
      checkout: (options: { paymentSessionId: string; redirectTarget: string }) => void
    }
  }
}

const CASHFREE_SDK_URL = 'https://sdk.cashfree.com/js/v3/cashfree.js'

function loadCashfreeSdk(): Promise<void> {
  if (window.Cashfree) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${CASHFREE_SDK_URL}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Failed to load Cashfree SDK')))
      return
    }
    const script = document.createElement('script')
    script.src = CASHFREE_SDK_URL
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Cashfree SDK'))
    document.body.appendChild(script)
  })
}

/**
 * Cashfree's hosted checkout has no plain-URL redirect - it requires their client-side JS SDK,
 * loaded from a real webpage, calling cashfree.checkout({paymentSessionId}) (confirmed against
 * Cashfree's own docs). This page IS that webpage: the server hands back a URL pointing here
 * (see billing/service.ts's createCheckoutSessionForMember) with the payment_session_id and
 * sandbox/production mode as query params, rather than a Cashfree URL directly. Both admin-web
 * (a plain link) and mobile (opened via the system browser) land here the same way.
 */
export function CheckoutRedirectPage() {
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  const sessionId = searchParams.get('session')
  const mode = searchParams.get('mode') === 'production' ? 'production' : 'sandbox'

  useEffect(() => {
    if (!sessionId) {
      setError('Missing payment session - this link is incomplete.')
      return
    }

    loadCashfreeSdk()
      .then(() => {
        if (!window.Cashfree) throw new Error('Cashfree SDK did not load correctly')
        const cashfree = window.Cashfree({ mode })
        cashfree.checkout({ paymentSessionId: sessionId, redirectTarget: '_self' })
      })
      .catch((err: Error) => setError(err.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      {error ? (
        <div className="flex max-w-sm flex-col items-center gap-3 text-center">
          <AlertCircle className="size-8 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Opening secure checkout…</p>
        </div>
      )}
    </div>
  )
}
