# Deployment checklist

This is the concrete list of steps needed to run BarBellix's web dashboard + API in production.
Mobile app-store submission (Apple/Google) is a separate, later phase — not covered here.

Every env var below is read by `apps/server/src/config/env.ts` (server) or the corresponding
`.env.example` in `apps/web`/`apps/mobile` — if this doc and one of those ever disagree, the code
is the source of truth.

## 1. Required — the server will not boot without these

Set these in the server's hosting environment (e.g. Vercel project → Settings → Environment
Variables for `apps/server`):

| Variable | Notes |
|---|---|
| `MONGODB_URI` | Real MongoDB connection string (Atlas or self-hosted). |
| `JWT_ACCESS_SECRET` | Random string, 16+ characters. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. |
| `JWT_REFRESH_SECRET` | Same as above — use a **different** random value, not the same one. |

## 2. Must be set before real use, even though the app boots without them

These have defaults that are only correct for local development. Leaving them unset doesn't crash
anything, but the app will misbehave in ways that matter:

| Variable | Default | Why it matters |
|---|---|---|
| `CORS_ORIGIN` | `*` (any origin) | **Set this to your real web-dashboard origin** (e.g. `https://your-app.vercel.app`) before going live. Left at `*`, the API accepts requests from any website indefinitely — a real exposure for an app handling health data and payments, not just a config nicety. |
| `STORAGE_BACKEND` | `local` | **Must be `gcs` in production.** `local` writes uploaded avatars/exercise videos to `apps/server/uploads/` on disk — Vercel's serverless functions have an ephemeral filesystem, so anything written this way is lost, possibly on the very next request. Set `STORAGE_BACKEND=gcs` plus `GCS_BUCKET_NAME` and `GCS_CREDENTIALS_JSON` (a Google Cloud service-account key JSON, inline) once you have a GCP project and bucket. |
| `PUBLIC_URL` | `http://localhost:${PORT}` | Set to the server's real public origin — used to build URLs for locally-stored uploads. Only matters if `STORAGE_BACKEND=local` is ever used in production (not recommended, see above); GCS-backed uploads build their own `storage.googleapis.com` URLs and ignore this. |
| `CASHFREE_RETURN_URL` | `http://localhost:5173/billing/return` | The URL Cashfree redirects a member to after checkout completes (web flow only - mobile passes its own `barbellix://payment-return` deep link per-request instead). Set to your real web app's origin + `/billing/return`. |
| `WEB_APP_BASE_URL` | `http://localhost:5173` | **Set to your real web app's origin.** Cashfree's hosted checkout has no plain-URL redirect - it requires loading their client-side JS SDK from a real webpage (confirmed against Cashfree's own docs during testing). This server hands back a checkout URL pointing at `${WEB_APP_BASE_URL}/billing/checkout` (a page that loads the SDK), not at Cashfree directly - both admin-web and mobile open that URL. Verified working end-to-end against a real Cashfree sandbox account: order creation, the correct ₹ amount, and the real hosted payment UI (UPI/cards/net banking/wallets) all render correctly. |

## 3. Bootstrapping the first admin account

Every account-creation path in the product needs an *existing* admin to work — admin creates
trainers/members via the web dashboard, and member self-registration always creates a `member`
role, never staff. **There is no in-product way to create the very first admin account.**

Run this once, directly against your production database, right after deploying:

```bash
cd apps/server
npx tsx src/db/bootstrap-admin.ts <email> <password> <firstName> <lastName>
```

This creates one admin account in the default tenant. Log in with it on the web dashboard, then
use the "New trainer" / "New member" buttons to onboard everyone else — those accounts get a QR
sign-in code instead of a password.

## 4. Payment and SMS gateways — later gate, not required to deploy

Both are fully coded and fail with a clear error when unset — nothing crashes without them, but
online checkout and cash-payment OTP confirmation won't work until real accounts exist:

| Variable | Needed for |
|---|---|
| `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY` | Real Cashfree checkout sessions. Get these from the Cashfree merchant dashboard once that account exists. Set `CASHFREE_ENV=production` (default is `sandbox`) once you're ready to accept real payments, not before. |
| `CASHFREE_WEBHOOK_SECRET` | Verifying that a webhook delivery genuinely came from Cashfree — set once you configure the webhook URL in the Cashfree dashboard. |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` | SMS delivery for the cash-payment OTP flow. `TWILIO_FROM_NUMBER` must be a real number you've purchased/verified in Twilio, in E.164 format. |

**Cashfree order creation is verified against a real sandbox account** — order creation, the
₹ amount conversion, and the real hosted payment UI (UPI/cards/net banking/wallets) all confirmed
working end-to-end in a browser. **Not yet verified**: an actual completed payment and the
resulting webhook delivery (`CASHFREE_WEBHOOK_SECRET`) — that needs the server to be reachable
from the public internet (a real deployment, or a tunnel like ngrok pointed at localhost), which
wasn't set up during this test. **Twilio SMS is still completely untested** — no real code has
been sent. Test both further, and Twilio from scratch, before flipping to production.

## 5. Optional, genuinely optional — safe to leave unset indefinitely

None of these block anything if left blank; each just disables one specific feature with a clear
error, exactly like the two integrations above:

| Variable | Disables (if unset) |
|---|---|
| `SENTRY_DSN` | Error monitoring — `Sentry.init()` is simply skipped. |
| `GROQ_API_KEY` / `GEMINI_API_KEY` / `OPENROUTER_API_KEY` / `ANTHROPIC_API_KEY` | AI Coach features — at least one of these four should be set for AI plan generation to work at all; which one doesn't matter, the server tries them in a fallback chain. |
| `GOOGLE_CLIENT_ID` | "Sign in with Google" — the button/endpoint just isn't offered. |

## 6. Web app (`apps/web`) — Vercel environment variables

| Variable | Notes |
|---|---|
| `VITE_API_BASE_URL` | The server's real production URL. |
| `VITE_SENTRY_DSN` | Optional, same as the server's. |
| `VITE_GOOGLE_CLIENT_ID` | Optional — must match the server's `GOOGLE_CLIENT_ID` exactly if set (same Google Cloud OAuth client). |

## 7. Mobile app (`apps/mobile`) — dev/internal builds only for now

App-store submission is deferred, but if you build an internal/preview binary via EAS in the
meantime:

- `apps/mobile/eas.json` only configures Android build profiles today — there is no `ios` key at
  all. An iOS build submitted as-is would fall back to `http://localhost:4000` for its API base
  URL (silently non-functional). Add an `ios` block mirroring the existing `android` ones with the
  same `EXPO_PUBLIC_API_BASE_URL` override before building for iOS, even for internal testing.
- `EXPO_PUBLIC_WEB_BASE_URL` should point at the real web app's origin (used only to link out to
  the Terms/Privacy pages from the registration screen) — set it in the EAS build profile the same
  way `EXPO_PUBLIC_API_BASE_URL` already is.

## Post-deploy smoke test

1. `curl https://<your-server>/admin/payment-gateway-status` (with a real admin JWT) →
   `{"cashfreeConfigured": false}` until Cashfree keys are set — confirms the server booted and
   env vars parsed correctly, without needing real payment credentials yet.
2. Log in on the web dashboard with the bootstrapped admin account (§3).
3. Create a test trainer and member via "New trainer"/"New member", confirm the QR pairing flow
   completes login on a real device.
4. Visit `/privacy` and `/terms` on the deployed web app, confirm they render (these need real
   legal-entity details filled in — see the `[PLACEHOLDER: ...]` markers in
   `apps/web/src/pages/legal/` — before this is shared publicly or submitted to an app store).
