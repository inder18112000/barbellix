# BarBellix — Client Requirements & Implementation Status

Consolidates everything the client has specified so far (the PRD shared 2026-07-26, plus the
AI workout-plan reference screenshots shared the same day) into one place, each requirement
marked against what's actually built today. This is a living document — update it as scope is
confirmed or built.

**Status key:** ✅ Done and verified · ⚠️ Partially built / different shape than spec · ❌ Not built

**Update (2026-07-26, later same day):** a large batch of the gaps below were closed in response
to "implement all the required functionality" — everything marked ✅ in this pass was verified
against a real backend + real MongoDB (curl round-trips), including a full grace-period
block → auto-restore-after-payment cycle. Two decisions that were genuinely blocked on missing
specification got resolved directly with the client: **"Sponsorship"** means gym/brand sponsorship
deals (not a referral program), and **QR-code login** means device-pairing/first-login activation
(scan once to sign in on a new device, like WhatsApp Web) rather than replacing email/password as
the primary login method. With those unblocked, only the **Articles feed** (§1.4) remains
genuinely unbuilt — it needs either a real content API or client-authored editorial copy, neither
of which exists yet.

---

## 1. Mobile App — Home Screen

> Source: client PRD message, 2026-07-26 14:31. **Note: this message was cut off mid-sentence
> ("Fo…") — there may be more requirements not captured here. Get the rest of the message.**

| # | Requirement | Status | Notes |
|---|---|---|---|
| 1.1 | User authenticates by **scanning a QR Code** linked to the Admin Portal | ✅ | Built as **device-pairing / first-login activation**, per the client's own clarification — not a replacement for email/password, which remains the default login path. Flow: admin generates a one-time QR (`POST /trainer/members/:memberId/login-pairing`, 10-min TTL, single-use, only its SHA-256 hash ever stored) from the roster; the member scans it in the app's new "Scan to sign in" screen (`POST /auth/pair`), which establishes a real session through the same `establishSession()` code path as a normal login. Verified: generate → redeem → session established, then redeeming the same token again correctly fails (401, "invalid or expired"). |
| 1.2 | **Profile Card** in top 20–30% of Home screen: Profile Photo, Full Name, Editable Bio | ✅ | Profile card at the top of `HomeScreen`, with name and inline-editable bio (tap the pencil, saves via `PUT /me/profile`). **Real photo upload is now built**: tapping the avatar opens the device photo library (`expo-image-picker`), the chosen image is resized to 400px and compressed client-side (`expo-image-manipulator`) before being base64-encoded into the existing `avatarUrl` field — no new storage service needed, and the payload stays well under the server's body-size limit. |
| 1.3 | Five **Quick Access Icons**: Workout, Diet, Weight Tracker, Progress Report, Sponsorship | ✅ | All five now present: Workout, Diet, Weight Tracker, Progress Report, and the new **Sponsors** icon, which opens the new Sponsorship screen (see below). |
| 1.4 | **Health & Fitness Articles Feed** — auto-populated: fitness news, scientific research, nutrition updates, supplement awareness, fake-supplement exposure, industry news, health tips | ❌ | **Still deliberately excluded** — the only remaining gap in this section. Needs either a real content source/API (requires picking one + likely an API key) or client-authored editorial content (the "fake supplement exposure" angle in particular implies real editorial judgment, not generated filler) — neither exists yet. |

**New, not originally in the PRD but built alongside it: Sponsorship screen.** Per the client's
clarification that "Sponsorship" means gym/brand sponsorship deals, a `Sponsor` model + admin CRUD
(`/admin/sponsors`) and a public read endpoint (`/sponsors`, active-only) now exist, with a bold
gradient-card mobile screen listing each sponsor's name, description, and website link, and a
matching admin management page on the web dashboard.

---

## 2. Admin Portal (Web Dashboard)

> Source: same PRD message, "Admin Portal – Product Requirement Document".

### 2.1 Dashboard

| Requirement | Status | Notes |
|---|---|---|
| Total Clients | ✅ | Now a genuinely distinct stat from Active Clients (previously these conflated into one number) |
| Active Clients | ✅ | Real `status === 'active'` count, split out from Total via `countClientsBreakdown()` — verified both numbers return correctly from a seeded tenant |
| Expired Subscriptions | ✅ | Real count of memberships with status `expired`/`cancelled` |
| New Enrollments | ✅ | Real count of members created since the start of the current month |
| Pending Payments | ✅ | Real count of memberships with `paymentStatus: 'due'` |
| Online Payments / Offline Payments (as separate dashboard stats) | ✅ | Real counts by the explicit `paymentMethod` field (see §2.6) |

### 2.2 Client Progress Report

| Requirement | Status | Notes |
|---|---|---|
| List of all clients: Name, Photo, Enrollment Date, Progress Status, Subscription Status | ⚠️ | Name ✅, Subscription Status ✅. **Photo still ❌ on the web roster** — the new profile-photo upload (§1.2) is mobile-side only so far; the web roster/detail pages don't yet render `avatarUrl`. Still one `joinDate` field, not a distinct enrollment date. |
| Drill-in: Progress Photos | ❌ | Still not built — a photo *timeline* feature is a separate thing from the profile avatar added in §1.2, and still needs a real storage/gallery design |
| Drill-in: Weight Progress | ✅ | Admin-only page (`/admin/members/:id`) with a real weight-over-time line chart from the member's actual logged `BodyMetric` data |
| Drill-in: Muscle Gain Progress | ✅ | Built on the **mobile** side: `BodyMetricsScreen` now includes a "Muscle Gain Tracker" card computing arm/chest circumference change since the member's first logged measurement (reuses the existing `BodyMetric.measurements` data, no new backend). Not yet surfaced on the admin web drill-in page — a reasonable follow-up. |
| Drill-in: Strength Progress | ✅ | Lists the member's real `PersonalRecord`s (exercise, value, unit) |
| Drill-in: AI Workout Plan | ✅ | AI-generated plans are real; the admin drill-in page now also lists the member's actual `WorkoutPlan`s (name, goal, source) via `listPlans()` |
| Drill-in: AI Diet Plan | ✅ | **New.** `POST /ai/coach/generate-diet-plan` generates a real diet plan (daily calorie/protein/carb/fat targets + 4 meals) using the same shared `generateStructuredPlan<T>()` core as the workout-plan generator, just a different Zod schema and prompt. Verified against the real Groq API: asked for "lose fat while keeping strength," got back a coherent 2500kcal/170g-protein plan with real breakfast/lunch/dinner/snack entries in ~2 seconds. Mobile UI mirrors the workout plan's "Generate with AI" bottom-sheet pattern. |

### 2.3 Client Management & Enrollment

| Requirement | Status | Notes |
|---|---|---|
| Auto-sync on mobile registration: Name, Registration Date, Enrollment Date, Membership Start Date, Membership Expiry Date | ⚠️ | Sync itself is real and automatic. Name + phone + `joinDate` sync automatically; there's still no *distinct* Enrollment Date field separate from account-creation date. |
| Admin can manually edit these fields | ✅ | Membership start/expiry dates are admin-editable (§2.4). **New:** admin can now also edit a member's own name/phone directly from the roster (`PATCH /trainer/members/:memberId/info`), not just their own account — reuses the same `updateInfo`/`toDomainUser` path as self-service profile edits, no duplicated update logic. |
| **Phone number** | ✅ | On the `User` model, surfaced in the roster and Settings |

### 2.4 Membership Duration

| Requirement | Status | Notes |
|---|---|---|
| Admin selects membership start date | ✅ | "Edit membership dates" dialog on the roster |
| Admin selects membership end date | ✅ | Same dialog |
| Admin can modify duration anytime | ✅ | Requires the member to already have a membership record (send a checkout link or mark-as-paid first) — by design |

### 2.5 Grace Period

| Requirement | Status | Notes |
|---|---|---|
| Configurable grace period after expiry (e.g. 1–2 days) before blocking access | ✅ | **Built.** `Branch.gracePeriodDays` (admin-editable in Branch Settings, default 2) feeds a pure `isAccessBlocked(membership, gracePeriodDays)` check that runs lazily at the moment of login/refresh — deliberately not a scheduled job, since the server has no job-scheduling infrastructure at all. This is a real architectural choice, not a shortfall: it's always correct at check-time (no cron-hasn't-run-yet staleness), and "access restored the instant payment goes through" falls out for free, verified below. |

### 2.6 Payment Status

| Requirement | Status | Notes |
|---|---|---|
| Payment Method shown per client: Online / Cash | ✅ | Explicit `paymentMethod: 'online' \| 'cash'` field, shown as a roster column |
| Subscription Status: Active (green) / Pending (orange) / Expired (red) | ✅ | Simplified 3-state `SubscriptionStatus`, derived server-side from the more granular `MembershipStatus`/`PaymentStatus` pair |

### 2.7 Payment Integration

| Requirement | Status | Notes |
|---|---|---|
| Connected to an online payment gateway | ✅ | Real Stripe integration |
| View successful / pending / failed payments | ✅ | Now backed by a real per-event log (see next row), not just current status |
| Payment history | ✅ | **New.** Every payment-relevant event (checkout completed, subscription renewed/cancelled, payment failed, manually marked paid) now writes a `PaymentEvent` row via `recordPaymentEvent()`, called from every webhook case and from manual mark-paid. Surfaced as a real history list on the admin member-detail page. Verified: marking a member paid produces exactly one new history entry with the correct type/plan/timestamp. |
| Auto-update subscription status / auto-extend expiry after renewal | ✅ | Real, webhook-driven |

### 2.8 Client List

| Requirement | Status | Notes |
|---|---|---|
| Photo, Name, Phone Number, Enrollment Date, Membership Expiry, Payment Method, Subscription Status columns | ⚠️ | Name ✅, Phone ✅, Membership Expiry ✅, Payment Method ✅, Subscription Status ✅. **Photo still ❌ on the web roster** — see §2.2 note above. |
| Search | ✅ | By name/email/phone |
| Filter | ✅ | By simplified subscription status (All/Active/Pending/Expired) |
| Sort | ✅ | By name, joined date, or subscription status |
| Open full client details | ✅ | Admin's own `MemberDetailPage` (`/admin/members/:id`) |

### 2.9 Automatic Membership Renewal

Unchanged from before — all ✅, real, webhook-driven.

### 2.10 Automatic Account Restriction

| Requirement | Status | Notes |
|---|---|---|
| Auto-logout when membership + grace period expire with payment still pending | ✅ | Built as part of §2.5: a login/refresh attempt past the grace period is rejected with a clear "membership expired" error rather than silently succeeding. Verified with a real overdue membership dated 25 days past a 2-day grace period → blocked (403); the same account 1 day past that same grace period → still allowed. |
| Access to premium features blocked until payment | ⚠️ | Still all-or-nothing at the login gate (blocked members can't authenticate at all), not selective per-feature blocking within an active session |
| Access automatically restored after successful payment | ✅ | Verified: an overdue+blocked member, once marked paid again, can log in again immediately on the very next attempt — no cron/delay involved, this is the direct consequence of the lazy check-at-login design. |

### 2.11 Settings

| Requirement | Status | Notes |
|---|---|---|
| Admin Profile | ✅ | Edit own first/last name + phone, plus change-password (verifies current password server-side) |
| Gym Information | ✅ | `BranchSettingsPage`, now also including the grace-period field (§2.5) |
| Membership Plans | ✅ | `MembershipPlansPage` |
| Payment Gateway Settings | ✅ | **New.** Settings page now shows a real `stripeConfigured` boolean from `GET /admin/payment-gateway-status` — deliberately never exposes the actual key (server-side env-var-only by design, both in the route and the UI copy) |
| Notification Settings | ✅ | **New**, on the admin side — reuses the existing member-facing notification-preferences endpoints entirely rather than building a parallel admin-only version |
| Security Settings | ⚠️ | Change-password exists; no 2FA or session management beyond that |
| Logout | ✅ | Unchanged |

---

## 3. AI-Generated Plans — ✅ Built and verified (workout + diet)

> Source: reference screenshots shared 2026-07-26 (an app called "ApexFit").

**Both workout and diet plan generation are real**, sharing one core implementation
(`generateStructuredPlan<T>()` in `ai-coach/plan-generator.ts`) — a single strict-JSON-output
LLM call + Zod-schema validation + markdown-fence-stripping path, parameterized by prompt and
schema per plan type, so the two generators share every line of "call the LLM, parse the
response, validate it, handle errors" logic rather than duplicating it.

**Workout plans**: `POST /ai/coach/generate-plan` takes `{ goal, daysPerWeek }`, prompts the
configured LLM (Groq) with the *actual* list of exercises in the library, resolves every returned
exercise name back to a real `Exercise` document, and saves the result as a genuine `WorkoutPlan`
tagged `generatedBy: 'ai'`. Verified with a real Groq call: a 5-day "gain weight and build muscle"
plan came back with a real 5-day split, 6 exercises/day with real sets/reps/rest/notes, in ~3
seconds, and was confirmed actually persisted.

**Diet plans** (new this pass): `POST /ai/coach/generate-diet-plan` takes `{ goal }`, returns
daily calorie/protein/carb/fat targets plus 4 real meals (breakfast/lunch/dinner/snack), saved as
a `DietPlan`. Verified with a real Groq call as described in §2.2.

**Mobile UI**: both use the same "✨ Generate with AI" bottom-sheet pattern — `WorkoutHomeScreen`
(goal + days/week chip selector) and the new `DietPlanScreen` (goal only, since a diet plan is a
single daily template rather than a multi-day split), each rendering the result through a
purpose-built display (day-card viewer for workouts, macro-hero + meal-card list for diet).

**What wasn't attempted**: a chat-embedded plan card with an inline "Applied" button (reference
screenshot 1's exact interaction) — the bottom-sheet flow was judged to cover the same underlying
capability with less new code; can be added if the client specifically wants the chat-embedded
variant too.

---

## 4. What's still open, and why

Only one item from the original PRD gap analysis remains genuinely unbuilt:

- **Articles feed** (§1.4) — needs a real content source (API key or client-authored copy) that
  doesn't exist yet.

Lower-priority, smaller gaps also still open: a progress-photo *timeline* (distinct from the new
profile-photo upload, §2.2), the web roster/detail pages not yet rendering member profile photos
(§2.2/§2.8), per-feature (rather than all-or-nothing) access restriction (§2.10), and 2FA/session
management beyond change-password (§2.11).
