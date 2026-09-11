import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const LAST_UPDATED = '2026-09-05'

export function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <Link to="/login" className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to login
        </Link>

        <div>
          <h1 className="text-2xl font-semibold">Terms of Service</h1>
          <p className="mt-1 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="flex flex-col gap-5 text-sm leading-relaxed text-foreground/90">
          <p>
            These terms govern your use of the BarBellix gym management application (web dashboard and mobile app),
            operated by <strong>[PLACEHOLDER: legal entity name]</strong> ("BarBellix," "we," "us"). By creating an
            account or using the app, you agree to these terms.
          </p>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-semibold">Your account</h2>
            <p>You're responsible for keeping your login credentials secure. You must provide accurate information when you register, including your name and contact details. You must be old enough to enter into an agreement in your jurisdiction, or have a parent/guardian's consent.</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-semibold">Memberships and payments</h2>
            <ul className="ml-5 list-disc space-y-1">
              <li>Membership plans, pricing, and billing intervals are set by your gym and shown in the app before you pay.</li>
              <li>Online payments are processed by Cashfree; in-person cash payments are confirmed by a one-time SMS code sent to your registered phone number, which you must provide to gym staff to complete the payment.</li>
              <li>Refunds, cancellations, and membership pauses are handled according to your gym's own policy — contact your gym directly for these requests.</li>
              <li>Access to paid features may be suspended if a payment is overdue beyond your gym's configured grace period.</li>
            </ul>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-semibold">Health and fitness disclaimer</h2>
            <p>
              BarBellix provides workout plans, nutrition guidance, and AI-assisted recommendations for informational
              and fitness-tracking purposes only — it is not medical advice. Always consult a qualified healthcare
              professional before beginning a new exercise or nutrition program, especially if you have an injury,
              medical condition, or are pregnant. You are responsible for exercising safely and within your own
              physical limits; report any injury to your trainer so your plan can be adjusted accordingly.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-semibold">Acceptable use</h2>
            <p>Don't misuse the service: don't attempt to access accounts that aren't yours, interfere with the app's operation, or use it for any unlawful purpose. Your gym's staff may suspend accounts that violate this or the gym's own membership rules.</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-semibold">Changes to the service</h2>
            <p>We may update features, these terms, or our Privacy Policy from time to time. Continued use of the app after a change means you accept the updated terms.</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-semibold">Contact us</h2>
            <p>
              <strong>[PLACEHOLDER: legal entity name]</strong><br />
              [PLACEHOLDER: registered address]<br />
              Email: <strong>[PLACEHOLDER: support email]</strong>
            </p>
          </section>

          <p className="text-xs text-muted-foreground">
            This document contains placeholder fields marked in brackets. Replace them with your real legal entity
            name, address, and contact email before this document is used for an actual app-store submission or
            shared publicly as a final document.
          </p>
        </div>
      </div>
    </div>
  )
}
