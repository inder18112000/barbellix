# Part 6 — Exercise & Meal Libraries, Progress Tracking & Wearables

> **Document set:** this is Part 6 of a 13-part architecture-level PRD for the *AI-Powered Fitness
> Ecosystem*. It specifies the content libraries members and trainers touch every day —
> `Exercise` and `Meal` — plus the progress-tracking and wearable-integration surfaces that feed
> the AI Recommendation Engine (Part 5) its input signal every interval cycle. Every entity and
> field name below is drawn verbatim from Part 1's canonical data model (§3.4, §3.5); this part
> adds workflow, lifecycle, and provider-integration requirements on top of that vocabulary — it
> does not invent a parallel one. See [`README.md`](./README.md) for the full part list and
> reading order.

---

## 1. Exercise Library

The `Exercise` entity (Part 1 §3.4) is the atomic, reusable unit that every `WorkoutDay` and
`WorkoutTemplate` references by `exerciseId`. It is authored once and read everywhere; a plan
never copies an exercise's definition, only its `id`.

### 1.1 Field-by-field requirements

| Field | Requirement |
|---|---|
| `id` | ULID, immutable, the only thing a `WorkoutDay.exercises[]` entry actually stores about the exercise |
| `tenantId?` | `null` = global library, visible to every tenant; non-null = tenant-private (a boutique gym's signature movement, a rehab clinic's proprietary protocol). A plan builder query (Part 4) always resolves against `tenantId = :self OR tenantId IS NULL`, never tenant-only, so every tenant inherits the global catalog by default |
| `name` | Required, unique within its scope (global, or per-tenant). Indexed for autocomplete in the plan builder and the member-facing library browser |
| `bodyPart` | Required. Coarse facet: `chest, back, legs, shoulders, arms, core, full_body`. First-level filter in every browse UI |
| `equipment[]` | Required, may be empty (bodyweight). Drives two things: library filtering, and AI substitution — when a member's `GymPreference.equipmentAvailable[]` doesn't cover an exercise's `equipment[]`, the recommendation engine (Part 5) swaps in an equivalent-`bodyPart`/`primaryMuscle` exercise whose equipment the member actually has |
| `difficulty` | Required, `beginner\|intermediate\|advanced`. Cross-referenced against `MemberProfile.experienceLevel` for the same substitution logic — an `advanced` exercise is never auto-placed into a `beginner` member's plan without a trainer's explicit override |
| `category` | Required. Movement-pattern classification (`compound`, `isolation`, `push`, `pull`, `hinge`, `carry`, etc.) — used by the plan generator to keep a `WorkoutDay` balanced rather than accidentally all-isolation or all-compound |
| `primaryMuscle` | Required, single value. Drives the "target muscle" filter and the balanced-day-generation logic above |
| `secondaryMuscle[]` | Optional, may be empty. Supports "what else does this work" display and de-duplication logic (don't stack five exercises hitting the same secondary muscle on one day) |
| `instructions` | Required, rich text. Step-by-step execution cues, rendered on the exercise detail screen (Part 2) |
| `commonMistakes` | Optional but strongly recommended, rich text, rendered as a distinct collapsible callout from `instructions` — this is deliberately a separate field, not a subsection of instructions, so the mobile UI can surface it independently (e.g., a "watch out for" card shown mid-set) |
| `safetyNotes` | Required for any exercise tagged `rehabilitation`, optional otherwise. This field is what the AI Recommendation Engine's contraindication check (Part 5 §4) reads against a member's `MedicalProfile.injuries[]` before ever placing the exercise in a generated plan |
| `media{images[],videos[],gifs[]}` | Required: at least one of the three. These are object-storage references (asset IDs / CDN keys), not inline binary data — the storage backend, upload pipeline, and CDN delivery path are specified in Part 8/11 and are not redefined here |
| `tags[fat_loss\|muscle_gain\|mobility\|rehabilitation]` | Required, at least one. Matches `MemberProfile.goals[]` values directly and is the primary goal-based library filter members see |
| `createdBy` | Required, the authoring `userId`. Drives moderation-queue ownership (§1.3) and attribution in the library UI |

### 1.2 Why sets/reps/tempo/rest are not Exercise fields

`sets`, `reps`, `tempo`, `restSec`, and `notes` live on `WorkoutDay.exercises[]` (Part 1 §3.4), one
level up from `Exercise` itself, and this is a deliberate architectural boundary, not an
oversight. An `Exercise` is a **definition** — "Barbell Back Squat," how to perform it, what it
targets, what to watch for — and it is shared: the same `Exercise.id` is referenced by thousands
of `WorkoutDay` rows across thousands of members' plans, by every `WorkoutTemplate` that includes
a squat, and by every trainer authoring a new plan from scratch. `sets`/`reps`/`tempo`/`restSec`
are a **prescription** — this trainer's or the AI's specific application of that definition to
this specific member on this specific day of this specific plan version. If the AI increases a
member's squat volume from 3×8 to 4×8 during an interval adjustment (Part 5 §5), it must write a
new `WorkoutDay.exercises[]` entry with `sets: 4`; it must never touch the shared `Exercise`
record, or every other member doing squats would silently see their prescription change too.
Keeping the two separate is what makes `Exercise` reusable across the entire platform instead of
duplicated per member.

### 1.3 CRUD and moderation workflow

A trainer's authoring capability is scoped **Own tenant library** (Part 1 §2.2): a trainer may
create or edit `Exercise` rows with `tenantId` set to their own tenant, never `null` and never
another tenant's. The workflow:

1. **Create/edit.** A trainer submits the fields above; `tenantId` is forced server-side to the
   trainer's own tenant, `createdBy` to their `userId`.
2. **Tenant review policy.** Each tenant has a configurable moderation setting (the same
   tenant-override pattern used by `IntervalRule` in Part 1 §3.6) that decides whether new/edited
   `Exercise` entries require Admin sign-off before they appear in the shared tenant library. This
   part extends Part 1's `Exercise` entity with the `status[draft|pending_approval|approved|
   rejected]` field that §2.2's prose already implies ("...enters `pending_approval`") but does
   not enumerate in the field list — consistent with Part 1's own instruction that a later part
   needing an unlisted field should extend the spine rather than invent a parallel name.
3. **Gated tenants:** the entry is created with `status: pending_approval` and is visible only to
   its author (a "my submissions" view) until reviewed — it never appears in the plan builder's
   library query or the member-facing browser in this state.
4. **Ungated tenants:** the entry is created with `status: approved` and is immediately live.
5. **Admin review.** The Admin "Exercise Approval" module (Part 3) lists every `pending_approval`
   row tenant-wide with approve/reject actions and a rejection reason (mirroring `ModerationFlag`'s
   `reason` shape). Approval flips `status: approved`; rejection flips `status: rejected` and
   returns the reason to the author for edit-and-resubmit, which resets `status` to
   `pending_approval` again. Every transition writes an `AuditLogEntry`.
6. **Global library curation.** `tenantId: null` rows are the platform's shared seed catalog,
   curated by Super Admin as an extension of the "Manage global CMS" pattern (Part 1 §2.4). A
   second, optional path exists for high-quality tenant content: an Admin may nominate an
   `approved` tenant `Exercise` for promotion, and Super Admin can re-parent it to `tenantId: null`
   (retaining `createdBy` for attribution) so every tenant benefits from it.

The plan builder (Part 4) and every member-facing library browser query strictly on
`status: approved` — `pending_approval` and `rejected` rows are structurally invisible outside the
author's own submissions view and the Admin approval queue.

## 2. Meal Library

`Meal` (Part 1 §3.4) is `Exercise`'s dietary counterpart: referenced by `id` from `DietPlan.meals[]`,
authored once, consumed everywhere.

### 2.1 Field-by-field requirements

| Field | Requirement |
|---|---|
| `id` / `tenantId?` | Same global-vs-tenant scoping rule as `Exercise` — `null` tenant is the shared seed catalog |
| `name` | Required, unique within scope |
| `mealType[breakfast\|lunch\|dinner\|snack\|pre_workout\|post_workout]` | Required. Drives the diet-plan generator's slot-filling logic (Part 5) — a `pre_workout` meal is never auto-placed into a `dinner` slot |
| `ingredients[]` | Required, non-empty. Each entry is a line item — `{name, quantity, unit}` — sufficient for recipe scaling and the shopping-list generation feature (Part 7) |
| `calories`, `proteinG`, `carbsG`, `fatG`, `fiberG` | Required. These roll up into `DietPlan.dailyTargets` when a meal is placed into a plan, and are what the AI diet engine (Part 5 §3) optimizes against a member's macro targets |
| `costEstimate` | Required, approximate per-serving cost in the tenant's local currency. Powers a budget filter for cost-sensitive members and gyms serving lower-income demographics |
| `prepTimeMin` | Required. Powers a quick-filter (e.g., "under 15 minutes") that matters most for `pre_workout`/`post_workout` slots |
| `recipeText` | Required, rich text, same authoring pattern as `Exercise.instructions` |
| `media{images[],videos[]}` | At least one image required. Object-storage references only — see Part 8/11, not redefined here |
| `cuisine` | Required, single value. See §2.2 |
| `createdBy` | Required, drives moderation-queue ownership |

### 2.2 Cuisine tagging and food preference

`cuisine` is a regional/culinary classification, independent of dietary restriction. Concrete
examples the library must support out of the box: **Indian** (e.g., dal, paneer tikka, idli),
**Mediterranean** (e.g., grilled chicken with tzatziki, chickpea salad), **East Asian** (e.g.,
teriyaki salmon, tofu stir-fry), **Latin American** (e.g., black bean bowls, grilled fajitas), and
**Continental** (e.g., oatmeal, grilled protein-and-vegetable plates) as a fifth baseline.

`cuisine` and `LifestyleProfile.foodPreference[vegetarian|vegan|non_vegetarian]` (Part 1 §3.2) are
**orthogonal facets, not alternatives**, and both the library browser and the AI diet engine must
filter on their intersection, never treat one as implying the other. A member with
`foodPreference: vegetarian` and a stated preference for Indian food should see Indian
*vegetarian* meals (dal, paneer, chana), not be shown non-vegetarian Indian meals with the cuisine
filter alone, and not be silently switched to a different cuisine because the library assumes
"vegetarian" means "Mediterranean." Every cuisine in the baseline set above must have adequate
`vegetarian` and `vegan` coverage before launch — a cuisine with only `non_vegetarian` entries is
an incomplete library, not a valid one.

### 2.3 CRUD and moderation workflow

Identical mechanics to §1.3: **Own tenant library** authoring scope, the same tenant-configurable
`status[draft|pending_approval|approved|rejected]` gate, the same Admin approval queue (the
Content Library Approval workflow — Part 3's "Exercise Approval" module generalized to cover both
content types, since the queue and the reviewing role are shared), and the same global-promotion
path. One addition specific to `Meal`: before a submission reaches `pending_approval`, a
lightweight automatic sanity check reconciles `calories` against `proteinG*4 + carbsG*4 + fatG*9`
(within a tolerance band) — a validation rule that catches obviously wrong nutrition data before
it ever reaches a human reviewer, not a moderation decision itself.

## 3. Progress Tracking

### 3.1 ProgressCheckIn lifecycle

`ProgressCheckIn` (Part 1 §3.5) is the platform's scheduled, cadence-driven progress checkpoint,
and its lifecycle is the trigger for the AI Recommendation Engine's interval adjustment (Part 5
§5):

1. **Scheduling.** `dueAt` is computed from the applicable `IntervalRule` — the member's tenant
   override if one exists, else the platform default of `cadenceDays: 7` (Part 0 §2) — added to
   the previous check-in's `submittedAt` (or the plan's start date for `intervalNumber: 1`).
   `IntervalRule.fieldsCollected[]` determines which fields are mandatory for this cycle; not
   every check-in requires the full field set (a tenant may configure a lighter mid-cycle check-in
   that collects only `weightKg` and `photos[]`, reserving the full measurement set for every
   other cycle).
2. **Reminder.** As `dueAt` approaches, a `Notification` (Part 7) is scheduled; this part does not
   redefine the notification-channel mechanics.
3. **Submission.** The member fills in the `fieldsCollected[]` subset for this cycle —
   `weightKg, bodyFatPct, waistCm, chestCm, armCm, thighCm, hipCm, photos[], energyLevel[1-5],
   recoveryScore[1-5], sleepQuality[1-5]` — and `submittedAt` is written.
4. **Trigger.** A submitted `ProgressCheckIn` is the event the AI engine diffs against the prior
   `ProgressCheckIn` to propose the next plan version (Part 5 §5); `intervalNumber` increments.
5. **Overdue handling.** If `dueAt` passes with no submission, a tenant-configurable grace period
   (default 3 days) elapses before the engine proceeds anyway, using whatever ad-hoc `BodyMetric`
   entries fall in the window as a fallback signal, and marks that plan version's rationale as
   "generated with partial progress data" (an explicit provenance note, per Part 0's explainability
   principle). The member's trainer (Assigned scope) is notified either way, and a materially
   overdue member is a visible adherence signal in the trainer's roster view (Part 4).

### 3.2 Photo timeline

`ProgressCheckIn.photos[]` entries are tagged with their `intervalNumber` and `submittedAt` and
rendered as a chronological, side-by-side comparison timeline in the member app (Part 2) — this is
a progress artifact, structurally and purposefully distinct from a member's one-off account
avatar (a single, replaceable display picture with no historical record, out of scope for this
part). Every photo in the timeline is an object-storage reference; storage and access-control
mechanics are Part 8/11's concern, not redefined here, though it's worth noting progress photos
carry stricter access scoping than most media (Own + Assigned only, never Tenant-wide).

### 3.3 Measurement trend charts

Trend reporting (weight, body-fat %, waist, chest, arm, thigh, hip over time) draws from **both**
`ProgressCheckIn` and `BodyMetric`, unified into one time series per metric per member:
`ProgressCheckIn` rows are the canonical anchor points (deliberate, cadence-aligned, always visible
to the assigned trainer), and ad-hoc `BodyMetric` rows fill the density between anchors for members
who log more often than the interval cadence. Where both exist for the same calendar date, the
`ProgressCheckIn` value is the one plotted as the anchor and the `BodyMetric` entry is treated as a
same-day duplicate rather than a second point — the chart shows one trend line, not two competing
ones.

### 3.4 BodyMetric: the ad-hoc path, and why both entities exist

Part 1 §3.5 states it plainly: *"a `ProgressCheckIn` is a special `BodyMetric` with cadence."*
`BodyMetric` is the base, unscheduled logging primitive — `recordedAt`, `weightKg`, `bodyFatPct`,
`measurements{...}` — with no `dueAt`, no `intervalNumber`, no subjective scores, and no
obligation to notify a trainer. It exists for two reasons this spec treats as load-bearing rather
than incidental:

- **Engagement without churn.** A highly engaged member (the Ritika persona, Part 0 §4, who checks
  her Apple Watch daily) needs somewhere to log a same-day weigh-in without that act itself
  triggering a plan regeneration or a trainer review cycle. If every logged data point could
  trigger the AI engine, trainers would drown in review-queue noise (violating the Part 0 §2
  objective of sub-60-second common-case review) and plans would churn faster than a member could
  execute them. `ProgressCheckIn` is therefore the *only* trigger for interval adjustment;
  `BodyMetric` is purely observational.
- **The wearable ingestion target.** Passive, high-frequency data pushed by a `WearableConnection`
  (§4) has no subjective component (no `energyLevel`, no `recoveryScore` — a device cannot infer
  how a member feels) and no natural cadence boundary, so it is not a fit for `ProgressCheckIn`'s
  shape at all. Auto-synced weight and body-composition samples land as `BodyMetric` rows (or, for
  non-body-composition metrics, `WearableSample` rows — §4.3), keeping the deliberate,
  trainer-visible checkpoint (`ProgressCheckIn`) reserved for what it actually is: a member's
  intentional, periodic self-assessment.

## 4. Wearable Integration

### 4.1 Provider notes

`WearableConnection.provider` (Part 1 §3.5) enumerates five values. Each is a materially
different integration:

| Provider | Connection mechanism | Metrics synced (`WearableSample.metric`) | Notes |
|---|---|---|---|
| `apple_health` | On-device HealthKit authorization (iOS only) — the member grants read-only scopes locally in the mobile app; there is no server-side OAuth token, Apple does not permit one | `steps, heart_rate, calories_burned, sleep, workout, weight` | Background HealthKit access on iOS is bounded by app refresh windows, not a server cron — the mobile client batches locally and pushes to the ingestion API on foreground open and periodic background refresh |
| `google_health_connect` | On-device Health Connect authorization (Android only), same local-consent model as HealthKit | `steps, heart_rate, calories_burned, sleep, workout, weight` | Health Connect is Android's system-level data aggregator, so a member's Fitbit or Garmin data may already be visible here via the OS itself — the ingestion pipeline must dedupe by `(metric, recordedAt window, provider)` to avoid double-counting steps synced through two paths at once |
| `fitbit` | Server-side OAuth 2.0 against the Fitbit Web API; refresh token stored encrypted on `WearableConnection` | `steps, heart_rate, calories_burned, sleep, workout, weight` | Supports Fitbit's subscription/webhook API — near-real-time push, reducing reliance on polling |
| `garmin` | Server-side OAuth against the Garmin Connect Health API | `steps, heart_rate, calories_burned, sleep, workout, weight` | Garmin's Health API is push-based — Garmin calls a registered webhook when new data is available — so the integration is a webhook receiver, not a polling job |
| `samsung_health` | Samsung Health data SDK; on-device partner authorization for most tenants, with a server-OAuth tier available under Samsung's partner program | `steps, heart_rate, calories_burned, sleep, workout, weight` | Samsung's partner API access is invitation-gated by Samsung itself; roll this provider out behind a `FeatureFlag` per tenant until partner approval is confirmed, rather than assuming day-one availability |

### 4.2 Sync architecture

**Connection flow.** A member connects a provider from the mobile app (or web for
server-OAuth providers where applicable); on successful provider consent, a `WearableConnection`
row is created with `status: connected`, `scopes[]` recording exactly which data categories were
granted, and `lastSyncAt` initialized. `scopes[]` is what the consent screen must render back to
the member at connection time (§4.4) — it is not just an internal bookkeeping field.

**Background sync job cadence.** For server-side OAuth providers (`fitbit`, `garmin`, and
`samsung_health` where on the partner-server tier), a background worker polls on a fixed cadence
(15–30 minutes) as a fallback, supplemented by webhook push where the provider supports it
(`fitbit`, `garmin`) for near-real-time freshness. For on-device providers (`apple_health`,
`google_health_connect`, and `samsung_health` on its on-device tier), sync is client-push: the
mobile app hits an ingestion endpoint on foreground open and background refresh, and that endpoint
writes `WearableSample` rows through the identical code path a server-side poll would use — the
storage and downstream consumption (trend charts §3.3, AI engine Part 5) never need to know
whether a sample arrived via webhook, poll, or client push.

**Failure and revocation.** If a token is rejected by the provider or the member revokes access at
the provider's side, the next sync attempt fails and `WearableConnection.status` flips to `error`
or `revoked`; the member is notified (`Notification`, Part 7), and the AI engine and trend charts
fall back to manually-logged `BodyMetric`/`ProgressCheckIn` data only until reconnected.

### 4.3 Conflict resolution

When a manually-logged `BodyMetric` and a synced `WearableSample` disagree on the same day — the
canonical case being a member typing in `82.0kg` the same day their Fitbit-synced smart scale
reports `82.6kg` — this spec resolves in favor of the **manual entry** for weight and
body-composition data. The member's deliberate self-report reflects context a device cannot: which
scale, what time of day, fasted versus fed, post-workout water weight. A manual log is the member
actively asserting "this is my number," and overriding it silently with a device reading would
contradict the platform's explainability principle (Part 0 §2) by making a member's own data
disappear without explanation. For metrics that have no manual-entry equivalent in the data model
— `steps, heart_rate, calories_burned, sleep, workout` — the synced `WearableSample` is
authoritative by default, since there is no competing member assertion to weigh it against.
Whichever source wins for a given trend point, the AI engine's plan-change rationale (Part 5)
records the source it used, so a trainer reviewing a proposed change can always see whether a
number came from a device or a member's own hand.

### 4.4 Consent and disclosure

Before any `WearableConnection` is created, the platform must present the member with the exact
set of metrics to be requested — the `WearableSample.metric` list from §4.1's table for the
provider being connected — and obtain explicit, affirmative consent before the connection is
established; `scopes[]` on the resulting row must match what was disclosed, not a superset. The
full legal and compliance treatment of health data — retention limits, right-to-revoke and
associated data deletion, regional health-data regulation (e.g., HIPAA-adjacent handling in the
US), and breach-disclosure obligations — is specified in Part 10 and is not redefined here; this
part's requirement is narrower and purely product-facing: the consent screen must be accurate and
specific about what is being read, for every one of the five providers, every time.

---

**Previous:** [Part 5 — The AI Recommendation Engine](./05-ai-recommendation-engine.md)
**Next:** [Part 7 — Payments, Notifications, Gamification & Analytics](./07-payments-notifications-gamification-analytics.md)
