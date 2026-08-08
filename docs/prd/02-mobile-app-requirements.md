# Part 2 — Mobile App Requirements

> **Document set:** this is Part 2 of a 13-part architecture-level PRD for the *AI-Powered Fitness
> Ecosystem*. It specifies the Member-facing mobile app (iOS & Android) — the primary surface for
> the "Ritika" persona from Part 0 — built against the roles, scopes, and canonical entities defined
> in [Part 1](./01-rbac-and-data-model.md). See [`README.md`](./README.md) for the full 13-part list,
> reading order, and how this vision relates to the BarBellix codebase that exists today.

---

## 1. Purpose, Scope & Client Positioning

The mobile app is the Member's only required surface — everything a member can do in this
document set, they can do from a phone. It is a single cross-platform codebase (e.g., Flutter or
React Native; the final stack decision is Part 11's job) targeting iOS and Android, holding **no
direct database access and no tenant-bypassing logic**. Every screen below is a thin presentation
layer over the API Gateway specified in Part 9: every request carries the member's access token
and every response is already scoped server-side through Part 1 §5's authenticate →
authorize-by-role → authorize-by-scope pipeline before the app renders it. Where a screen reads or
writes an entity, the enforcement authority lives in Part 9's service contracts, not here — this
part specifies *what the member sees and does*, not how the server enforces it.

Two roles never appear in this app: `trainer` and `admin`/`superadmin` sign in to the surfaces in
Part 3 (Website Portals) and Part 4 (Trainer & AI-Review Workflow). A person who is also a trainer
elsewhere holds a separate `User` record (Part 1 §1) and uses this app only as a member.

## 2. Information Architecture

The app is organized as ten modules reachable from a bottom tab bar (Home, Workout, Nutrition,
Progress, AI Coach) plus screens reached from Home or a hamburger/profile menu (Trainer/Booking,
Gamification, Wearables, Settings/Notifications). Auth and Onboarding are pre-tab-bar flows.

| Module | Screen | Purpose | Reads | Writes |
|---|---|---|---|---|
| Auth | Splash / Session Check | Silent-restore a session or route to Login | `User` (session) | — |
| Auth | Register | Create an account | — | `User` |
| Auth | Login | Email + password authentication | `User` | — |
| Auth | QR Device Pairing | Secondary first-login activation (§4.1) | `User` | `User` (device/session, Part 9) |
| Auth | Forgot / Reset Password | Recover account access | `User` | `User` |
| Onboarding | Wizard, 9 screens | Fitness assessment (§3) | — | `MemberProfile`, `MedicalProfile`, `LifestyleProfile`, `GymPreference` |
| Home | Home Dashboard | Today's workout, check-in reminder, XP/streak widget, AI shortcut | `WorkoutPlan`, `DietPlan`, `GamificationState`, `ProgressCheckIn` (next `dueAt`), `Notification` | — |
| Workout | Plan Overview | Current plan, week structure, version badge | `WorkoutPlan`, `WorkoutDay` | — |
| Workout | Day Detail | Exercises for a training day | `WorkoutDay.exercises[]`, `Exercise` | — |
| Workout | Exercise Detail / Video | Form cues, media, safety notes | `Exercise.media`, `Exercise.safetyNotes` | — |
| Workout | Log Session | Mark sets/reps completed for the day | `WorkoutDay` | Session/adherence log (schema in Part 6) |
| Nutrition | Diet Plan Overview | Daily macro targets, meal list | `DietPlan.dailyTargets`, `DietPlan.meals[]` | — |
| Nutrition | Meal Detail | Recipe, macros, prep time | `Meal` | — |
| Nutrition | Log Meal Compliance | Mark a meal eaten / swapped | `Meal` | Meal-compliance log (schema in Part 6) |
| Progress | Progress Dashboard | Weight/measurement trend charts | `BodyMetric`, `ProgressCheckIn` (history) | — |
| Progress | Weekly Check-In | Interval-driven progress submission (§5) | `IntervalRule.fieldsCollected[]` | `ProgressCheckIn` |
| Progress | Progress Photos | Gallery of check-in photos | `ProgressCheckIn.photos[]` | `ProgressCheckIn.photos[]` |
| Progress | Record Measurements | Ad-hoc body metrics outside a check-in | — | `BodyMetric` |
| Progress | Plan Version Diff | Compare this version to the last | `WorkoutPlan`/`DietPlan` (`version`, `previousVersionId`) | — |
| AI Coach | Conversation List | Past chats with the AI Coach | `ChatConversation` | — |
| AI Coach | Chat Thread | Ask questions, get guidance | `ChatMessage` | `ChatMessage` |
| AI Coach | Escalation Banner | Surface a hand-off to the assigned trainer | `TrainerAssignment` | `ChatMessage.escalatedToTrainer` |
| Trainer/Booking | My Trainer | Assigned trainer's profile and contact | `TrainerAssignment` | — |
| Trainer/Booking | Request Trainer / Change | Ask Admin to (re)assign a trainer | — | `TrainerAssignment` (`status=change_requested`) |
| Trainer/Booking | Book a Session | Reserve a 1:1 or class slot | Session/booking entity (Part 4) | Session/booking entity (Part 4) |
| Trainer/Booking | Request Plan Revision | Ask for a specific change to a plan | `WorkoutPlan`/`DietPlan` | `PlanRevisionRequest` |
| Gamification | Gamification Hub | XP, level, streak, badge shelf | `GamificationState` | — |
| Gamification | Badges | Earned and lockable badges | `Badge`, `GamificationState.badgeIds[]` | — |
| Gamification | Challenges | Active/available challenges | `Challenge` | Challenge enrollment (Part 7) |
| Gamification | Leaderboard | Branch/tenant-scoped ranking | `GamificationState` (aggregated, Part 7) | — |
| Gamification | Referral | Invite friends, track rewards | `ReferralCode` | `ReferralCode` |
| Wearables | Connect Wearable | Link Apple Health / Health Connect / Fitbit / Garmin / Samsung Health | — | `WearableConnection` |
| Wearables | Wearable Detail | Sync status, recent samples | `WearableConnection`, `WearableSample` | `WearableConnection` (revoke) |
| Settings | Notification Center | Unread/read notification feed | `Notification` | `Notification.readAt` |
| Settings | Notification Preferences | Channel opt-in/out | `Notification` (config) | `Notification` (config) |
| Settings | Subscription & Billing | Current tier, upgrade/downgrade, invoices | `Membership`/`MembershipPlan`/`PaymentEvent` (Part 7 §1) | `Membership`/`PaymentEvent` |
| Settings | Profile & Account | Edit core info | `User`, `MemberProfile` | `User`, `MemberProfile` |
| Settings | Medical / Lifestyle / Gym Preference | Revisit onboarding answers | `MedicalProfile`, `LifestyleProfile`, `GymPreference` | `MedicalProfile`, `LifestyleProfile`, `GymPreference` |
| Settings | Devices & Sessions | Manage paired devices, sign out remotely | `User` sessions (Part 9) | `User` sessions (Part 9) |
| Settings | Legal & Disclaimers | Medical disclaimer, ToS, privacy | `ContentArticle` (static) | — |

## 3. Onboarding Wizard (Fitness Assessment)

The wizard is the mobile app's implementation of Part 1 §4's field-to-entity map. It runs once at
signup and is re-enterable per-section from Settings. Each screen writes to exactly one profile
entity so partial completion never corrupts an unrelated one.

| # | Screen | Fields collected | Entity written | UX notes |
|---|---|---|---|---|
| 1 | Welcome & Consent | Data-use consent, medical disclaimer acknowledgment | — (gate, no entity) | Must be acknowledged before any profile field is collected; links to Legal & Disclaimers |
| 2 | Personal Info | Age (dob), Gender, Height, Weight, Target Weight, Body Fat %, Muscle Mass, Activity Level, Occupation | `MemberProfile.{dob,gender,heightCm,currentWeightKg,targetWeightKg,bodyFatPct,muscleMassKg,activityLevel,occupation}` | Body Fat % and Muscle Mass are optional with a "skip, I don't know" affordance — not every member owns a scale that reports them |
| 3 | Goals | Multi-select from the fixed ten-value enum | `MemberProfile.goals[]` | Rendered as selectable chips, not free text, so the value set exactly matches Part 1 §3.2's ten goals (`weight_loss, weight_gain, lean_body, athletic, muscular, body_recomposition, strength, endurance, powerlifting, general_fitness`) |
| 4 | Medical Info | Injuries, Surgeries, Chronic Diseases, Allergies, Medications | `MedicalProfile.{injuries[],surgeries[],chronicConditions[],allergies[],medications[]}` | Each is a tag-input list, not a single text box, so downstream AI prompts (Part 5) and the AI Coach's escalation logic (§7.6) can pattern-match on discrete entries |
| 5 | Lifestyle | Sleep target, Water intake target, Food preference | `LifestyleProfile.{sleepHoursTarget,waterIntakeTargetMl,foodPreference}` | Food preference is single-select (`vegetarian`/`vegan`/`non_vegetarian`) and immediately filters the `Meal` catalog surfaced later in Nutrition |
| 6 | Gym Preference | Gym availability, Home-workout-only toggle, Equipment available | `GymPreference.{gymAvailability,homeWorkoutOnly,equipmentAvailable[]}` | Toggling "home workout only" on hides the gym-availability sub-field rather than disabling it, since the two are mutually informative, not mutually exclusive in the data model |
| 7 | Workout Preference | PPL / Bro Split / Upper-Lower / Full Body / Custom | `MemberProfile.workoutSplitPreference` | A one-line description accompanies each option; "Custom" leaves the field set but signals Part 5's generator to weight trainer input more heavily if one is later assigned |
| 8 | Experience | Beginner / Intermediate / Advanced | `MemberProfile.experienceLevel` | Presented with a self-assessment rubric (e.g., "Beginner: new to structured training in the last 6 months") rather than bare labels, since this field directly gates exercise `difficulty` selection in Part 5 |
| 9 | Weekly Availability | Days available, session duration | `MemberProfile.weeklyAvailability.{days[],sessionDurationMin}` | A day-of-week picker plus a duration slider; the wizard cross-checks this against `daysPerWeek` implied by the chosen `workoutSplitPreference` and flags a mismatch (e.g., PPL selected with 2 available days) before submit rather than after |
| 10 | Review & Submit | Read-only summary of screens 2–9 | Reads all four profile entities | On submit, the app requests initial `WorkoutPlan`/`DietPlan` generation and routes to Home in a "Building your first plan" state |

Onboarding is resumable: if the member backgrounds the app mid-wizard, each screen's writes are
already persisted (per-screen submit, not one giant final POST), so re-entry resumes at the first
incomplete screen rather than screen 1.

## 4. Core Member Permissions

Each capability below is drawn directly from Part 1 §2.1's permission matrix (scope: **Own** in
every case). Requirement is the product intent; Acceptance Criteria are the specific,
verifiable behaviors the mobile client must implement.

| Capability | Requirement | Acceptance Criteria |
|---|---|---|
| **Register / Login** (incl. QR pairing) | Email+password is the only account-creation and primary-login path. QR device-pairing is a *secondary first-login activation* for a new device once a password login has already succeeded elsewhere — never a password replacement. | • Registering requires email + password + confirm-password, no QR path exists at signup.<br>• QR pairing is only offered *after* at least one successful password login on another device.<br>• Scanning a pairing QR without ever having password-authenticated on any device is rejected with a "log in with your password first" message.<br>• A paired device can be revoked from Devices & Sessions (§2 Settings) without invalidating the password itself. |
| **Create Profile** | Member can create and edit their `MemberProfile` outside the wizard. | • Profile edit screen pre-fills all `MemberProfile` fields from §3 screen 2.<br>• Saving with an invalid range (e.g., negative `heightCm`) is rejected client-side before the API call.<br>• Edits after onboarding do not silently reset `experienceLevel`-derived plan settings — a confirmation explains downstream effects. |
| **Complete Fitness Assessment** | The onboarding wizard (§3) is mandatory before the first plan is generated. | • Home Dashboard cannot show a `WorkoutPlan` until all four profile entities exist.<br>• Each wizard screen validates required fields before allowing "Next."<br>• Wizard completion is measurable as a single event the app can report to Part 7's analytics. |
| **Connect Wearables** | Member can link a supported provider and begin syncing samples. | • Supported providers match `WearableConnection.provider` exactly: `apple_health`, `google_health_connect`, `fitbit`, `garmin`, `samsung_health`.<br>• Free-tier members seeing this screen get an upsell (wearable sync is a Premium entitlement per Part 0 §3.2), not a broken connect button.<br>• A successful link creates `WearableConnection{status=connected}` and the UI reflects `lastSyncAt` after first sync. |
| **Track Progress** | Member can view trend history and submit both scheduled and ad-hoc data. | • Progress Dashboard renders `BodyMetric` and `ProgressCheckIn` history on one combined timeline, not two disconnected views.<br>• Ad-hoc entries (outside a check-in cadence) write `BodyMetric` only, never a synthetic `ProgressCheckIn`. |
| **Receive AI Recommendations** | Member sees their current active plan; the app never shows an AI-generated plan the member's tier disqualifies from trainer review. | • Only `WorkoutPlan`/`DietPlan` rows with `status=active` render on Workout/Nutrition tabs.<br>• If the member has no `TrainerAssignment`, the plan screen discloses "AI-generated, not trainer-reviewed" per Part 0 §3.2's Free-tier disclosure requirement.<br>• `generatedBy` and `source` are shown in an info affordance (not hidden) so the member always knows plan provenance. |
| **Chat with AI Coach** (escalation to trainer) | Member can converse with the AI Coach; messages implicating an injury or medical concern escalate to the assigned trainer when one exists. | See the full flow and disclaimer requirements in §7.6 (User Story 6). |
| **Book Personal Trainer** | Member can request a trainer assignment and, once assigned, book 1:1 sessions. | • "Request a Trainer" is available whenever no `active` `TrainerAssignment` exists; it writes `status=change_requested`, per Part 1 §3.3, for Admin to fulfill — the app never lets a member self-assign a trainer.<br>• Session booking is only reachable once a `TrainerAssignment` is `active`.<br>• A pending request shows a persistent "Request pending" state, never a dead end. |
| **Upload Progress Photos** | Member can attach photos to a `ProgressCheckIn`. | • Photos upload to `ProgressCheckIn.photos[]` tied to a specific `intervalNumber`, never as an untracked media blob.<br>• Camera and gallery import are both supported; client-side compression runs before upload.<br>• Photos are private by default — no leaderboard or feed ever surfaces them without explicit member action. |
| **Record Measurements** | Member can log body measurements on- or off-cadence. | • In-cadence measurements populate `ProgressCheckIn.{waistCm,chestCm,armCm,thighCm,hipCm}`.<br>• Off-cadence entries populate `BodyMetric.measurements{}` instead.<br>• Units are consistent (cm/kg) app-wide with no silent unit-conversion ambiguity. |
| **Follow Meal Plan** | Member can view and mark compliance against `DietPlan.meals[]`. | • Each `Meal` shows macros, prep time, and swap suggestions filtered by `LifestyleProfile.foodPreference`.<br>• Marking a meal "eaten," "skipped," or "swapped" is a one-tap action from the Diet Plan Overview.<br>• Compliance data feeds the adherence signal Part 5 uses for the next interval — the app does not need to compute anything itself. |
| **Watch Exercise Videos** | Member has read-only access to the Exercise Library's media for exercises in their active plan. | • Video/GIF playback works offline once cached for the current week's `WorkoutDay.exercises[]`.<br>• `safetyNotes` and `commonMistakes` are shown alongside video, not buried behind an extra tap.<br>• The library is read-only — no upload/edit affordance appears for the member role. |
| **Request Plan Revision** | Member can ask for a targeted change without waiting for the next interval. | See §7.7 (User Story 7) for the full flow and routing behavior. |
| **Subscribe to Premium** | Member can view tier comparison and upgrade/downgrade at any time. | See §7.8 (User Story 8) for the mid-cycle upgrade flow. |

### 4.1 QR device-pairing — the nuance, stated plainly

QR pairing exists to make adding a second device (a tablet at the gym, a new phone) fast, not to
make the app passwordless. The pairing QR is generated from an *already-authenticated* session
and scanned by the new device; it never appears at the registration or first-login screen, and a
device that has never seen a successful password login cannot originate or redeem one. This
distinction was raised directly by a client stakeholder during scoping and is preserved here
verbatim because it is easy to accidentally build backwards (QR-first, password-optional).

## 5. Weekly Check-In Flow

Check-in cadence is not hardcoded in the app — it is read from the effective `IntervalRule` for
the member (tenant override if set, platform default of 7 days otherwise, per Part 1 §3.6). The
member-facing flow is:

1. **Reminder surfaces at `dueAt`.** A non-blocking banner appears on the Home Dashboard the
   moment a `ProgressCheckIn` row's `dueAt` passes with `submittedAt` still null. If the member
   hasn't opened the check-in within 24 hours, a push `Notification` follows.
2. **The wizard asks only what the rule requires.** The Weekly Check-In screen renders fields
   dynamically from `IntervalRule.fieldsCollected[]` — a tenant that collects only `weightKg` and
   `energyLevel` shows a two-field form; one that collects the full set (`weightKg, bodyFatPct,
   waistCm, chestCm, armCm, thighCm, hipCm, photos[], energyLevel, recoveryScore, sleepQuality`)
   shows all of them. Photos are visually marked optional even when included, since not every
   cadence configuration treats them as required.
3. **Submission is atomic.** The member can save a draft mid-form (app-local, not yet an API
   write), but tapping "Submit" is a single request that sets `ProgressCheckIn.submittedAt` and
   locks the entries for that `intervalNumber` against further edits.
4. **Post-submission UX is intentionally light.** The screen confirms receipt and sets
   expectations — "Your trainer will review this within 24 hours" if `TrainerAssignment` is
   active, or "Your next plan update will reflect this" if not — without describing the
   comparison/regeneration mechanics that live in Part 5 and Part 4; the app just sets the
   expectation and notifies the member once a result exists (§7.4).
5. **Missed check-ins are visible, not punitive.** A missed `dueAt` doesn't block app usage; it
   shows as a gap in the Progress Dashboard trend line, surfaced as "based on limited recent
   data" on the next recommendation rather than hidden.

## 6. Gamification UI

Gamification state (`GamificationState.{xp,level,streakDays,badgeIds[]}`) surfaces in three
places, deliberately layered from ambient to explicit:

- **Home screen widget (ambient).** A compact XP progress bar toward the next `level`, a flame
  icon with the current `streakDays`, and up to three recently-earned badge icons. Tapping it
  opens the Gamification Hub.
- **Gamification Hub tab (explicit).** A dedicated screen with four sections: **Badges** (earned
  vs. lockable, each showing `Badge.criteria` so members know what unlocks it), **Challenges**
  (active/available `Challenge` rows with `xpReward` and countdown to `endAt`), **Leaderboard**
  (branch/tenant-scoped ranking built from aggregated `GamificationState`, per Part 7 — opt-out
  available for members who don't want to appear), and **Referral** (`ReferralCode` sharing with
  `rewardDescription` shown up front).
- **Push on unlock (event-driven).** Crossing a `level` threshold, completing a `Challenge`, or
  earning a `Badge` fires an immediate push `Notification` plus a celebratory in-app moment the
  next time the app is foregrounded — never silently absorbed into the next dashboard load.
  Streak-loss is deliberately *not* push-worthy — it appears only passively on the Home widget,
  since punitive streak-loss notifications are a known churn driver for this persona.

## 7. User Stories & Acceptance Criteria

### 7.1 Onboarding completion

**Given** a newly registered member with no `MemberProfile` yet
**When** they complete all nine wizard screens and tap "Finish" on Review & Submit
**Then** `MemberProfile`, `MedicalProfile`, `LifestyleProfile`, and `GymPreference` are created,
an initial `WorkoutPlan`/`DietPlan` generation is requested, and the member lands on Home in a
"Building your first plan" state.

- [ ] The wizard cannot be exited past screen 2 without a confirmation dialog if required fields
      are incomplete.
- [ ] `goals[]` is presented as fixed-enum chips, never free text.
- [ ] The "Building your first plan" state is non-blocking — the member can browse the Exercise
      Library while waiting.
- [ ] A generation failure shows a retry affordance, never a dead-end error screen.

### 7.2 Connecting a wearable

**Given** a Premium member on the Wearables screen
**When** they tap "Connect" for `apple_health`
**Then** the OS-level permission flow runs, `WearableConnection{provider:apple_health,
status:connected}` is created, and background sync of `WearableSample` rows begins.

- [ ] A Free-tier member tapping "Connect" sees an upgrade prompt instead of the OS permission
      flow.
- [ ] `WearableConnection.status` transitions (`connected → error → revoked`) are all
      distinguishable in the UI with a clear next action.
- [ ] `lastSyncAt` is visible on the connection card at all times.
- [ ] Revoking access at the OS level updates `status` to `revoked` the next time the app is
      foregrounded, without requiring a manual refresh.

### 7.3 Submitting a weekly check-in

**Given** a `ProgressCheckIn` with `dueAt` passed and `submittedAt` null
**When** the member opens Check-In from the Home reminder banner and fills in the fields listed
in `IntervalRule.fieldsCollected[]`
**Then** the submission sets `submittedAt` and the entry locks for that `intervalNumber`.

- [ ] Fields not in `fieldsCollected[]` never appear on the form for that member/tenant.
- [ ] A draft can be saved locally and resumed without duplicate submission.
- [ ] Post-submit copy sets expectations about trainer review or plan update without describing
      Part 4/Part 5 mechanics.
- [ ] A second submission attempt for the same `intervalNumber` is blocked with a clear message.

### 7.4 Notification that a new plan version is ready

**Given** `WorkoutPlan.version` increments with a new `previousVersionId` and the new row reaches
`status=active`
**When** that transition completes server-side (via Part 4's trainer approval or auto-approval
for unassigned members)
**Then** the app delivers a push `Notification{type:plan_updated}` and a badge appears on the
Workout tab.

- [ ] The notification deep-links directly into the Plan Version Diff screen, not the generic
      plan overview.
- [ ] The diff highlights specific field-level changes (e.g., "+1 set, Day 3 Squat"; "−20g
      carbs"), never a generic "your plan was updated."
- [ ] The prior version remains reachable from version history after acknowledgment.
- [ ] If the member has no active `TrainerAssignment`, the notification and diff screen disclose
      the plan is AI-generated without trainer review (Part 0 §3.2).

### 7.5 Requesting a trainer

**Given** a member with no `active` `TrainerAssignment`
**When** they tap "Request a Trainer" on the My Trainer screen and optionally add a note
**Then** a `TrainerAssignment` row is written with `status=change_requested` (Part 1 §3.3's
request state, used both for a first assignment and a reassignment) and `notes` populated from
the member's input, awaiting Admin fulfillment.

- [ ] The member cannot pick a specific trainer directly — fulfillment is Admin-only per Part 1
      §2.3.
- [ ] The My Trainer screen shows a persistent "Request pending" card, not a dead end, until
      resolved.
- [ ] Once Admin creates the `active` assignment, the member receives a `Notification` and My
      Trainer updates from empty-state to a trainer profile card.
- [ ] A second request cannot be submitted while one is already `change_requested`.

### 7.6 Chatting with the AI Coach about an injury

**Given** a member with `MedicalProfile.injuries[]` containing a prior injury, opening a Chat
Thread
**When** they send a message describing pain ("my knee hurts on squats")
**Then** the `ChatMessage{role:user}` is stored, the assistant's reply includes a mandatory
medical disclaimer, and — if an `active` `TrainerAssignment` exists — `ChatMessage.
escalatedToTrainer` is set true and the exchange routes into the trainer's queue (Part 4);
otherwise the reply deflects to "see a qualified professional" language without attempting
clinical guidance, consistent with Part 0 §2's non-goals.

- [ ] Any AI Coach reply touching pain/injury/medical content renders a visible, non-dismissible
      -until-acknowledged disclaimer element — never text buried mid-paragraph.
- [ ] When escalation fires, the chat thread shows a banner naming the trainer it was routed to.
- [ ] An unassigned member sees a "Find a Trainer" CTA alongside the deflection, linking directly
      to §7.5's flow.
- [ ] The AI Coach's copy never asserts a diagnosis, treatment plan, or medical certainty at any
      point in the thread.

### 7.7 Requesting a plan revision

**Given** an active `WorkoutPlan` the member wants changed before the next interval
**When** they tap "Request a Change," select or write a reason (e.g., "schedule conflict on
Thursdays"), and submit
**Then** a `PlanRevisionRequest{memberId, planId, planType:workout, reason, status:open,
routedTo}` is created, routed to the assigned trainer if `TrainerAssignment` is active, or
directly to the AI engine per Part 1 §2.1 if not.

- [ ] The member sees the actual routing target ("Sent to Arjun" vs. "Sent to AI Coach for an
      immediate revision"), not a generic confirmation.
- [ ] Only one `open` `PlanRevisionRequest` per plan is allowed; a duplicate attempt is blocked
      with an explanation.
- [ ] The plan screen shows a pending-revision indicator until `status` changes.
- [ ] Resolution (from Part 4/Part 5) triggers a `Notification` back to the member.

### 7.8 Upgrading to Premium mid-cycle

**Given** a Free-tier member partway through an interval cycle (`ProgressCheckIn.dueAt` not yet
reached)
**When** they tap "Upgrade" on the Subscription & Billing screen and complete payment (Stripe,
per Part 7/Part 9)
**Then** the tier flag updates immediately, a `PaymentEvent` is recorded, and previously gated
features (unlimited AI regeneration, wearable sync, full nutrition planning) unlock without
waiting for the next `IntervalRule` cycle or an app reinstall.

- [ ] Entitlement changes are reflected on the next API call, not just an optimistic local
      toggle.
- [ ] An immediate "Regenerate now" CTA appears post-upgrade — the member is never told to wait
      for the next scheduled interval to benefit from the upgrade they just paid for.
- [ ] The billing screen shows a prorated amount and next billing date sourced from
      `MembershipPlan`/`PaymentEvent`, not a client-side estimate.
- [ ] Downgrade/cancellation is discoverable from the same screen, not hidden behind support
      contact.

---

**Previous:** [Part 1 — Roles, Permissions & the Canonical Data Model](./01-rbac-and-data-model.md)
**Next:** [Part 3 — Website Portals](./03-website-portals.md)
