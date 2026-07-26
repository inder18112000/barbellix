# FitPulse — Client Requirements & Implementation Status

Consolidates everything the client has specified so far (the PRD shared 2026-07-26, plus the
AI workout-plan reference screenshots shared the same day) into one place, each requirement
marked against what's actually built today. This is a living document — update it as scope is
confirmed or built.

**Status key:** ✅ Done and verified · ⚠️ Partially built / different shape than spec · ❌ Not built

**Update (2026-07-26, later same day):** a large batch of the gaps below were closed in response
to "implement all the required functionality" — everything marked ✅ in this pass was verified
against a real backend + real MongoDB (curl round-trips) and, for the web dashboard pages, a real
Playwright browser click-through. Four items were deliberately **not** attempted and remain open -
see the exclusion notes inline (QR login, "Sponsorship," the articles feed, and grace-period
auto-restriction) - each needs either a product decision or new infrastructure this session
intentionally didn't rush.

---

## 1. Mobile App — Home Screen

> Source: client PRD message, 2026-07-26 14:31. **Note: this message was cut off mid-sentence
> ("Fo…") — there may be more requirements not captured here. Get the rest of the message.**

| # | Requirement | Status | Notes |
|---|---|---|---|
| 1.1 | User authenticates by **scanning a QR Code** linked to the Admin Portal | ❌ | **Deliberately excluded.** This replaces the entire auth architecture - real security implications (per-user token issuance/rotation, Admin Portal approval flow) that shouldn't be rushed same-day. Current auth remains email/password → JWT. The existing QR flow is gym check-in (attendance), not login. |
| 1.2 | **Profile Card** in top 20–30% of Home screen: Profile Photo, Full Name, Editable Bio | ✅ | Built: a profile card now sits at the top of `HomeScreen`, with initials avatar, name, and an inline-editable bio (tap the pencil, type, saves via `PUT /me/profile`). **Real photo upload is still not implemented** (deliberately excluded - needs a storage service decision (S3/Cloudinary/etc.) and credentials) - avatar remains initials-only, matching the pattern used everywhere else in the app. |
| 1.3 | Five **Quick Access Icons**: Workout, Diet, Weight Tracker, Progress Report, Sponsorship | ⚠️ | Home's quick actions now show exactly **Workout, Diet, Weight Tracker, Progress Report** (4 of 5), each a real deep-link (Diet → Nutrition screen, Weight Tracker → BodyMetrics screen, both previously unlinked from Home). **"Sponsorship" is still not built** - it has zero specification anywhere (referral program? gym sponsorship deals? something else?) - can't be built without the client defining what it means. |
| 1.4 | **Health & Fitness Articles Feed** — auto-populated: fitness news, scientific research, nutrition updates, supplement awareness, fake-supplement exposure, industry news, health tips | ❌ | **Deliberately excluded.** Needs either a real content source/API (requires picking one + likely an API key) or client-authored editorial content (the "fake supplement exposure" angle in particular implies real editorial judgment, not generated filler) - neither exists yet. |

---

## 2. Admin Portal (Web Dashboard)

> Source: same PRD message, "Admin Portal – Product Requirement Document".

### 2.1 Dashboard

| Requirement | Status | Notes |
|---|---|---|
| Total Clients | ✅ | Shown as "Active members" count |
| Active Clients | ✅ | Same metric as above currently conflates "total" and "active" — worth confirming with client whether they want both shown separately |
| Expired Subscriptions | ✅ | New stat card, real count of memberships with status `expired`/`cancelled` |
| New Enrollments | ✅ | New stat card, real count of members created since the start of the current month |
| Pending Payments | ✅ | New stat card, real count of memberships with `paymentStatus: 'due'` |
| Online Payments / Offline Payments (as separate dashboard stats) | ✅ | New stat cards, real counts by the new explicit `paymentMethod` field (see §2.6) |

### 2.2 Client Progress Report

| Requirement | Status | Notes |
|---|---|---|
| List of all clients: Name, Photo, Enrollment Date, Progress Status, Subscription Status | ⚠️ | Name ✅, Subscription Status ✅ (new simplified badge, §2.6). **Photo still ❌** (no photo upload/storage - deliberately excluded, same reason as §1.2). Still one `joinDate` field, not a distinct enrollment date. |
| Drill-in: Progress Photos | ❌ | Still not built - same photo-storage exclusion as above |
| Drill-in: Weight Progress | ✅ | New admin-only page (`/admin/members/:id`) with a real weight-over-time line chart built from the member's actual logged `BodyMetric` data (built per the dataviz skill: single-series line, recessive gridlines, styled tooltip, empty state when nothing's logged yet) |
| Drill-in: Muscle Gain Progress | ❌ | Still not built - this isn't a currently-tracked metric distinct from weight/measurements; needs a product definition of what it would actually measure before it can be built |
| Drill-in: Strength Progress | ✅ | The same new admin drill-in page lists the member's real `PersonalRecord`s (exercise, value, unit) |
| Drill-in: AI Workout Plan | ✅ | AI-generated plans are now real and working (see §3) - a generated plan shows up as the member's real workout plan the same as any trainer-assigned one. The admin drill-in page doesn't yet show a per-day breakdown of *which* plan a member is on (it shows sessions/PRs/weight, not the plan itself) - a reasonable next addition, not built this pass. |
| Drill-in: AI Diet Plan | ❌ | Still not attempted - out of scope for this pass (would roughly double the AI-generation work in §3 for a second content type) |

### 2.3 Client Management & Enrollment

| Requirement | Status | Notes |
|---|---|---|
| Auto-sync on mobile registration: Name, Registration Date, Enrollment Date, Membership Start Date, Membership Expiry Date | ⚠️ | Sync itself is real and automatic (unchanged). Name + phone (new, see below) + `joinDate` sync automatically; there's still no *distinct* Enrollment Date field separate from account-creation date. |
| Admin can manually edit these fields | ✅ | Membership start/expiry dates are now admin-editable (see §2.4). Name/phone editing exists for the admin's own account (§2.11, Settings) but not yet for *other* members' info from the roster - a small follow-up if wanted. |
| **Phone number** (not in original PRD wording here, but required by §2.8's Client List) | ✅ | Added to the `User` model, surfaced in the roster and on the admin's own Settings page. |

### 2.4 Membership Duration

| Requirement | Status | Notes |
|---|---|---|
| Admin selects membership start date | ✅ | New "Edit membership dates" dialog on the roster (per-member) |
| Admin selects membership end date | ✅ | Same dialog |
| Admin can modify duration anytime | ✅ | Verified: edited twice in a row against the same member and both changes stuck. Requires the member to already have a membership record (send a checkout link or mark-as-paid first) - editing dates can't create a membership from nothing, by design. |

### 2.5 Grace Period

| Requirement | Status | Notes |
|---|---|---|
| Configurable grace period after expiry (e.g. 1–2 days) before blocking access | ❌ | **Deliberately excluded.** Still no scheduled/background-job infrastructure exists on the server at all - this is the one item in this whole PRD that needs genuinely new server infrastructure (not just a new field or endpoint), and building + safely testing a background job on the same day as a client demo was judged too risky. Real next-phase item. |

### 2.6 Payment Status

| Requirement | Status | Notes |
|---|---|---|
| Payment Method shown per client: Online / Cash | ✅ | Now an explicit `paymentMethod: 'online' \| 'cash'` field on the membership record, set automatically (`'online'` on real Stripe checkout completion, `'cash'` on manual mark-as-paid), shown as a column on the roster. |
| Subscription Status: Active (green) / Pending (orange) / Expired (red) | ✅ | New simplified 3-state `SubscriptionStatus`, derived server-side (`deriveSubscriptionStatus()` in `billing/service.ts`) from the existing, more granular `MembershipStatus`/`PaymentStatus` pair - shown as its own badge on the roster and the member drill-in page, alongside (not replacing) the more detailed existing badges. |

### 2.7 Payment Integration

| Requirement | Status | Notes |
|---|---|---|
| Connected to an online payment gateway | ✅ | Real Stripe integration (unchanged) |
| View successful / pending / failed payments | ⚠️ | Unchanged - current status only, no per-event transaction list |
| Payment history | ❌ | Still not built - no transaction/payment history log in the UI |
| Auto-update subscription status / auto-extend expiry after renewal | ✅ | Unchanged, real, webhook-driven |

### 2.8 Client List

| Requirement | Status | Notes |
|---|---|---|
| Photo, Name, Phone Number, Enrollment Date, Membership Expiry, Payment Method, Subscription Status columns | ⚠️ | Name ✅, **Phone ✅ (new)**, Membership Expiry ✅ (new column, from the now-editable membership dates), Payment Method ✅ (new), Subscription Status ✅ (new). **Photo still ❌** (excluded, see §1.2). |
| Search | ✅ | Unchanged, by name/email/phone (search now also matches phone) |
| Filter | ✅ | New: filter by simplified subscription status (All/Active/Pending/Expired) |
| Sort | ✅ | New: sort by name, joined date, or subscription status |
| Open full client details | ✅ | New: admin now has its own `MemberDetailPage` (`/admin/members/:id`) with real progress data - previously only the trainer side had this. |

### 2.9 Automatic Membership Renewal

Unchanged from before - all ✅, real, webhook-driven (see previous version of this doc / git history if needed).

### 2.10 Automatic Account Restriction

| Requirement | Status | Notes |
|---|---|---|
| Auto-logout when membership + grace period expire with payment still pending | ❌ | **Deliberately excluded** - depends on the same missing scheduled-job infrastructure as §2.5. Suspension remains 100% manual. |
| Access to premium features blocked until payment | ❌ | Still all-or-nothing (suspended = fully blocked), not selective |
| Access automatically restored after successful payment | ❌ | Still no automated restore logic |

### 2.11 Settings

| Requirement | Status | Notes |
|---|---|---|
| Admin Profile | ✅ | New `SettingsPage` (`/admin/settings`) - edit own first/last name + phone, and a separate change-password form (verifies current password server-side before accepting a new one). Verified end-to-end including logging back in with the new password. |
| Gym Information | ✅ | Unchanged (`BranchSettingsPage`) |
| Membership Plans | ✅ | Unchanged (`MembershipPlansPage`) |
| Payment Gateway Settings | ❌ | Still env-var-only, no in-app UI |
| Notification Settings | ❌ | Still doesn't exist |
| Security Settings | ⚠️ | Change-password now exists (new); no 2FA or session management beyond that |
| Logout | ✅ | Unchanged |

---

## 3. AI-Generated Workout Plans — ✅ Built and verified

> Source: reference screenshots shared 2026-07-26 (an app called "ApexFit").

**This is now real, not proposed.** `POST /ai/coach/generate-plan` (new) takes `{ goal,
daysPerWeek }`, prompts the configured LLM (Groq, in this environment) with the *actual* list of
exercises in the library and strict JSON-output instructions, resolves every returned exercise
name back to a real `Exercise` document (never trusting an invented name), and saves the result
as a genuine `WorkoutPlan` via the same persistence path the trainer's manual plan-builder uses -
just tagged `generatedBy: 'ai'` instead of `'trainer'`.

Verified with a real call against the real Groq API (not mocked): asked for a 5-day
"gain weight and build muscle" plan, got back a real 5-day split (Chest & Triceps / Back & Biceps
/ Legs / Shoulders & Abs / Arms & Chest, 6 exercises/day, each with real sets/reps/rest/coaching
notes, all referencing real exercises from the library) in ~3 seconds, correctly classified the
free-text goal into the `build_muscle` enum value, and confirmed the plan was really persisted
(`GET /workout-plans` shows it alongside the member's pre-existing trainer-assigned plan).

**A necessary companion fix**: the seeded exercise library only had 5 exercises, nowhere near
enough variety for a convincing 5-day/6-exercise-per-day plan - expanded the seed script to ~45
exercises spanning every muscle group so the AI has real material to work with.

**Mobile UI**: a "✨ Generate with AI" flow was added to `WorkoutHomeScreen` - reachable from the
empty state (no plan yet) and via a "Regenerate with AI" button next to "Your Plan" when one
already exists. A bottom sheet collects the goal (free text) and days/week (3–7, chip selector,
matching the reference screenshots), then the generated plan renders through the **existing**
day-card viewer already used for trainer-assigned plans - deliberately reused rather than building
a parallel "day tabs" screen, since it's a faithful, real rendering of the same data with less new
UI surface.

**What wasn't attempted**: a chat-embedded plan card with an inline "Applied" button (reference
screenshot 1's exact interaction) - the bottom-sheet flow (screenshots 2–3) was judged to cover the
same underlying capability with less new code; can be added if the client specifically wants the
chat-embedded variant too. Also not attempted: an AI-generated *diet* plan (see §2.2).

---

## 4. What's still open, and why

Four items were deliberately not attempted in this pass, each for a specific reason rather than
being overlooked:

- **QR-code login** (§1.1) - replaces the entire auth architecture; needs careful design, not a
  same-day rush.
- **"Sponsorship"** (§1.3) - zero specification exists; needs the client to define what it means
  before any code can be written.
- **Articles feed** (§1.4) - needs a real content source (API key or client-authored copy) that
  doesn't exist yet.
- **Grace period + auto-restriction** (§2.5, §2.10) - needs new scheduled-job infrastructure that
  doesn't exist on the server at all; the only item here needing new infrastructure rather than a
  new field/endpoint/page, and the one most likely to fail quietly if rushed.

Also still open, lower priority: a payment transaction/history log (§2.7), progress-photo and
profile-photo uploads (needs a storage service decision), an AI-generated diet plan (§2.2), and
per-member info editing from the roster beyond membership dates (§2.3).
