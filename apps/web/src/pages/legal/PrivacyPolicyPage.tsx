import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const LAST_UPDATED = '2026-09-05'

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <Link to="/login" className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to login
        </Link>

        <div>
          <h1 className="text-2xl font-semibold">Privacy Policy</h1>
          <p className="mt-1 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="flex flex-col gap-5 text-sm leading-relaxed text-foreground/90">
          <p>
            <strong>[PLACEHOLDER: legal entity name]</strong> ("BarBellix," "we," "us") operates the BarBellix gym
            management application (web dashboard and mobile app). This policy explains what information we collect,
            how we use it, and the choices you have.
          </p>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-semibold">Information we collect</h2>
            <ul className="ml-5 list-disc space-y-1">
              <li><strong>Account information</strong> — name, email, phone number, password (stored as a salted hash, never in plain text).</li>
              <li><strong>Health and fitness data</strong> — body metrics (weight, height, measurements), fitness goals, workout plans and session logs, personal records, and any injuries you choose to log.</li>
              <li><strong>Attendance data</strong> — gym check-in and check-out times, recorded via QR code, PIN, or admin entry.</li>
              <li><strong>Payment records</strong> — membership plan, payment status, and transaction history. Card and UPI details are handled directly by our payment processor (Cashfree) — we never receive or store your full card number or bank credentials.</li>
              <li><strong>Communications</strong> — messages between you and your trainer, and notification preferences.</li>
              <li><strong>Device information</strong> — push-notification tokens, used only to deliver notifications you've opted into.</li>
            </ul>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-semibold">How we use your information</h2>
            <p>We use the information above to: operate your account and membership; let your trainer and gym staff support your training safely (including avoiding exercises that could aggravate a logged injury); process payments; send the notifications you've enabled; and maintain the security of the service.</p>
            <p>We do not sell your personal information to third parties.</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-semibold">Who we share it with</h2>
            <ul className="ml-5 list-disc space-y-1">
              <li><strong>Cashfree Payments</strong> — processes online and in-person card/UPI payments on our behalf.</li>
              <li><strong>Twilio</strong> — delivers SMS one-time codes used to confirm cash payments at the front desk.</li>
              <li><strong>Your assigned trainer and your gym's administrators</strong> — see the training and attendance data needed to support you; a trainer only sees members assigned to them.</li>
            </ul>
            <p>We do not share your data with any other third party except where required by law.</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-semibold">Data retention and deletion</h2>
            <p>We retain your data for as long as your account is active, plus a reasonable period afterward for legal and accounting purposes (such as payment records). You can request deletion of your account and associated data by contacting us at the address below.</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-semibold">Your rights</h2>
            <p>Depending on your location, you may have the right to access, correct, export, or delete your personal information. To exercise any of these rights, contact us using the details below.</p>
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
            name, address, and contact email before this policy is used for an actual app-store submission or shared
            publicly as a final document.
          </p>
        </div>
      </div>
    </div>
  )
}
