# Part 1 — Roles, Permissions & the Canonical Data Model

> This part is the **spine** of the whole document set. Every other part (2–10) references the
> entity names, enums, and role names defined here verbatim. If a later part needs a field that
> isn't listed below, that's a signal to extend this part, not to invent a parallel name for it.

---

## 1. Roles

Four roles, stored as a single `role` enum on `User`: `member`, `trainer`, `admin`, `superadmin`.
There is no fifth "guest" role — unauthenticated traffic can only hit the public marketing site,
the login/register endpoints, and the public `Sponsor`/`ContentArticle` read endpoints.

A user's role is fixed at the account level; a person who is both a trainer at one gym and a
member elsewhere holds two separate `User` records under two separate tenants — the Platform does
not model one identity with multiple roles inside a single tenant, because plan-review authority
and billing must never be ambiguous about which hat someone is wearing.

### 1.1 Scope model

Every permission below carries a **scope**, not just a yes/no:

- **Own** — a user acting on their own record only.
- **Assigned** — a trainer acting on members with an *active* `TrainerAssignment` row pointing at
  them (§3.6). This is the scope most often implemented wrong: it is enforced by joining through
  `TrainerAssignment`, never by "all members in my tenant."
- **Tenant** — an admin/superadmin acting on any record sharing their `tenantId`.
- **Global** — superadmin-only, crosses tenant boundaries, and is *always* written to
  `AuditLogEntry` (Part 9 §1).

## 2. Permission matrix

### 2.1 Member (the "User" role in the original brief)

| Capability | Scope | Notes |
|---|---|---|
| Register / log in | Own | Email+password primary; QR device-pairing as a secondary first-login activation (not a password replacement) |
| Create / edit profile | Own | |
| Complete fitness assessment | Own | Onboarding wizard, §4 |
| Connect wearables | Own | |
| Track progress, submit check-ins | Own | |
| Receive AI recommendations & plans | Own | Read-only against their own `WorkoutPlan`/`DietPlan` |
| Chat with AI Coach | Own | Rate-limited by tier |
| Request a trainer / request a trainer change | Own | Writes a request; only Admin can fulfill it (§2.3) |
| Book a session / class | Own | |
| Upload progress photos, record measurements | Own | |
| Follow meal plan, log meal compliance | Own | |
| Watch exercise videos | Own | Read-only against the Exercise Library |
| Request plan revision | Own | Creates a `PlanRevisionRequest` routed to their assigned trainer, or to the AI engine directly if unassigned |
| Subscribe / change subscription tier | Own | |
| Message their assigned trainer | Own ↔ Assigned | Two-sided: a member may only message the trainer currently assigned to them |

### 2.2 Gym Trainer

| Capability | Scope | Notes |
|---|---|---|
| View / review AI-generated workout & meal plans | Assigned | Never Tenant — this is the single most important scope rule in this document |
| Modify workout / meals, add notes | Assigned | Writes create a new plan version (Part 5 §5) |
| Add custom exercises, upload exercise videos | Own tenant library | Trainer-authored content is tagged `createdBy` and, if the tenant enables a review step, enters `pending_approval` (§2.3) |
| Create workout templates | Own tenant library | Templates are a distinct entity from assigned plans (§3.4) |
| Manage assigned users | Assigned | List/detail views join through `TrainerAssignment`; a trainer's roster query is *always* `WHERE trainerId = :self AND status = 'active'`, never `WHERE tenantId = :self.tenantId` |
| Chat with assigned users | Assigned | |
| Approve / reject / override AI recommendations | Assigned | The only path by which an AI-authored plan becomes visible to a member with an assigned trainer (Part 4) |
| Monitor adherence | Assigned | |
| Schedule training sessions | Assigned | 1:1, distinct from tenant-wide class scheduling |
| Assign challenges | Assigned | Drawn from the tenant's `Challenge` library |

A trainer has **zero** standing access to any member without an active `TrainerAssignment` row,
even inside their own tenant. Onboarding a new trainer therefore always includes an explicit
assignment step by Admin (§2.3) or a member-initiated request (§2.1) — there is no implicit "all
trainers see all members" default at any point in the system.

### 2.3 Admin

| Capability | Scope | Notes |
|---|---|---|
| Approve / suspend trainers | Tenant | Trainer accounts are created in a `pending_approval` status and cannot access any member data until approved |
| Manage users (create, edit, deactivate) | Tenant | |
| Create / modify `TrainerAssignment` | Tenant | Fulfills member-initiated trainer requests (§2.1) |
| Review reports, moderate uploaded content | Tenant | Acts on `ModerationFlag` records (§3.11) |
| Manage subscriptions & billing | Tenant | Create/edit/cancel/refund, view `PaymentEvent` history |
| Manage AI model configuration | Tenant | Selects which provider/model tier the tenant uses if the platform default is overridden; cannot edit prompt *content* — that's Super Admin only (§2.4) |
| View analytics | Tenant | |
| Monitor platform health (tenant-scoped) | Tenant | Attendance, adherence, revenue — not infrastructure metrics |
| Manage CMS content for their tenant | Tenant | Tenant-specific articles/announcements; the global editorial feed is Super Admin-managed |

### 2.4 Super Admin

| Capability | Scope | Notes |
|---|---|---|
| Manage Admins (any tenant) | Global | |
| Manage AI Prompt Library | Global | Versioned prompt templates (§3.9); rollback is a version pointer flip, not a redeploy |
| Manage Feature Flags | Global | Percentage/tenant-targeted rollout |
| Configure the Recommendation Engine | Global | Model/provider selection, fallback order, safety thresholds (Part 5 §7) |
| Configure Interval Rules | Global default, Tenant override | Default check-in cadence (7 days); a tenant or even an individual member can override within admin-set bounds |
| Manage Roles / RBAC | Global | The matrix in this section, expressed as data, not code — see §3.12 |
| Manage global CMS (editorial feed) | Global | The Health & Fitness Articles feed (Part 6 §5) |
| Configure notification templates & channels | Global | |
| Manage payments platform-wide | Global | Gateway configuration, dispute handling |
| View immutable audit logs | Global | Read-only even for Super Admin — audit entries are never editable or deletable by any role (Part 9 §1) |
| Trigger backup / restore | Global | Restore is a two-person-confirmed action (Part 9 §5) |

## 3. Canonical entities

This is not the physical schema (Part 8 covers indices, sharding-by-tenant, and Mongo-vs-relational
tradeoffs) — it's the **vocabulary**. Every entity below has an `id` (ULID) and, unless marked
"global," a `tenantId`.

### 3.1 Tenant / Branch

```
Tenant       { id, name, planTier[free|premium|trainer|gym_enterprise], brandingConfig, gracePeriodDays, createdAt }
Branch       { id, tenantId, name, address, timezone }
```

### 3.2 User & profile

```
User             { id, tenantId, branchId?, role[member|trainer|admin|superadmin], email, phone,
                   passwordHash, status[active|pending_approval|suspended], createdAt }
MemberProfile    { userId, dob, gender, heightCm, currentWeightKg, targetWeightKg, bodyFatPct,
                   muscleMassKg, activityLevel, occupation, goals[], experienceLevel[beginner|
                   intermediate|advanced], workoutSplitPreference[ppl|bro_split|upper_lower|
                   full_body|custom], weeklyAvailability{ days[], sessionDurationMin } }
MedicalProfile   { userId, injuries[], surgeries[], chronicConditions[], allergies[], medications[] }
LifestyleProfile { userId, sleepHoursTarget, waterIntakeTargetMl, foodPreference[vegetarian|
                   vegan|non_vegetarian] }
GymPreference    { userId, gymAvailability, homeWorkoutOnly, equipmentAvailable[] }
```

`goals[]` is an array over a fixed enum: `weight_loss, weight_gain, lean_body, athletic,
muscular, body_recomposition, strength, endurance, powerlifting, general_fitness` — ten values,
matching the original brief exactly (a common shortcut is collapsing these to 5–6 generic goals;
this spec treats the full ten as required because downstream plan-generation prompts, Part 5 §3,
branch on the specific goal, not a generic bucket).

### 3.3 Trainer assignment

```
TrainerAssignment { id, memberId, trainerId, assignedBy(userId), assignedAt, expiresAt,
                     membershipType, notes, status[active|expired|change_requested] }
```

Exactly one `active` assignment may exist per member at a time. A `change_requested` row is
created by the member (§2.1) and resolved by Admin, who ends the old assignment and creates a new
`active` one — this is an explicit, auditable transition, never a silent overwrite.

### 3.4 Plans, exercises, meals

```
WorkoutPlan   { id, memberId, tenantId, trainerId?, goal, daysPerWeek, days[], version,
                previousVersionId?, status[pending_review|approved|rejected|active|superseded],
                generatedBy[ai|trainer|user], source[initial|interval_adjustment|manual_request|
                trainer_authored], createdAt }
WorkoutDay    { dayLabel, exercises[]{ exerciseId, sets, reps, tempo, restSec, notes } }
WorkoutTemplate { id, tenantId, trainerId, name, days[] }   // reusable, not tied to a member
DietPlan      { id, memberId, tenantId, trainerId?, dailyTargets{calories,proteinG,carbsG,fatG},
                meals[], version, previousVersionId?, status, generatedBy, source, createdAt }
Exercise      { id, tenantId?(null = global library), name, bodyPart, equipment[], difficulty
                [beginner|intermediate|advanced], category, primaryMuscle, secondaryMuscle[],
                instructions, commonMistakes, safetyNotes, media{images[],videos[],gifs[]},
                tags[fat_loss|muscle_gain|mobility|rehabilitation], createdBy }
Meal          { id, tenantId?, name, mealType[breakfast|lunch|dinner|snack|pre_workout|
                post_workout], ingredients[], calories, proteinG, carbsG, fatG, fiberG,
                costEstimate, prepTimeMin, recipeText, media{images[],videos[]}, cuisine,
                createdBy }
PlanRevisionRequest { id, memberId, planId, planType[workout|diet], reason, status[open|
                       resolved], routedTo(trainerId?) }
```

`status` and `generatedBy` on plans are independent axes on purpose: a plan can be
`generatedBy: ai` and `status: pending_review` (awaiting its first trainer look), or
`generatedBy: trainer` and `status: active` (a trainer wrote it from scratch and it needs no
review). See Part 4 for the full state machine.

### 3.5 Progress & wearables

```
ProgressCheckIn { id, memberId, intervalNumber, dueAt, submittedAt?, weightKg, bodyFatPct,
                  waistCm, chestCm, armCm, thighCm, hipCm, photos[], energyLevel[1-5],
                  recoveryScore[1-5], sleepQuality[1-5] }
BodyMetric      { id, memberId, recordedAt, weightKg, bodyFatPct, measurements{...} }  // ad-hoc,
                  not tied to an interval; a ProgressCheckIn is a special BodyMetric with cadence
WearableConnection { id, memberId, provider[apple_health|google_health_connect|fitbit|garmin|
                     samsung_health], status[connected|revoked|error], lastSyncAt, scopes[] }
WearableSample  { connectionId, metric[steps|heart_rate|calories_burned|sleep|workout|weight],
                  value, recordedAt }
```

### 3.6 AI, chat & platform configuration

```
ChatConversation { id, memberId, startedAt }
ChatMessage      { id, conversationId, role[user|assistant|system], content, escalatedToTrainer,
                   createdAt }
AIPromptTemplate { id, key, version, roleTarget[workout_gen|diet_gen|chat|recommendation],
                   promptText, isActive, updatedBy, updatedAt }
IntervalRule     { id, tenantId?(null = platform default), cadenceDays, fieldsCollected[],
                   updatedBy }
FeatureFlag      { key, description, rolloutMode[all|percentage|tenant_list], updatedBy }
```

### 3.7 Notifications, gamification, commerce

```
Notification  { id, userId, type, payload, channel[push|inapp|email], readAt }
Challenge     { id, tenantId, title, description, criteria, xpReward, startAt, endAt }
Badge         { id, key, criteria, xpValue }
GamificationState { userId, xp, level, streakDays, badgeIds[] }
ReferralCode  { id, ownerId, code, rewardDescription }
Sponsor       { id, tenantId?, name, description, websiteUrl, active }
ContentArticle{ id, category, title, body, publishedAt, author }
Membership / MembershipPlan / PaymentEvent — billing entities, detailed in Part 7 §1
```

### 3.8 Security & moderation

```
AuditLogEntry   { id, actorId, actorRole, action, targetType, targetId, tenantId, beforeState?,
                  afterState?, ip, createdAt }   // append-only, no update/delete path exists
ModerationFlag  { id, reporterId, targetType, targetId, reason, status[open|actioned|dismissed] }
```

## 4. Onboarding data collection (field-to-entity map)

The brief's onboarding requirements map onto §3.2's profile entities as follows — listed here so
Part 2 (Mobile App) can build the wizard screens directly against these fields without
re-deriving the model:

| Brief category | Entity.field |
|---|---|
| Age, Gender, Height, Weight, Target Weight, Body Fat %, Muscle Mass, Activity Level, Occupation | `MemberProfile.{dob,gender,heightCm,currentWeightKg,targetWeightKg,bodyFatPct,muscleMassKg,activityLevel,occupation}` |
| Goals | `MemberProfile.goals[]` (ten-value enum, §3.2) |
| Injuries, Surgeries, Chronic Diseases, Allergies, Medications | `MedicalProfile.*` |
| Sleep, Water Intake, Food Preference | `LifestyleProfile.*` |
| Gym Availability, Home Workout, Equipment Available | `GymPreference.*` |
| Workout Preference (PPL / Bro Split / Upper-Lower / Full Body / Custom) | `MemberProfile.workoutSplitPreference` |
| Experience | `MemberProfile.experienceLevel` |
| Weekly Availability (days, session duration) | `MemberProfile.weeklyAvailability` |

## 5. Enforcement pattern (summary; full detail in Part 9)

Every route handler in every service applies the same three checks, in order, before touching
data:

1. **Authenticate** — valid access token, not expired, not revoked.
2. **Authorize by role** — does this role ever have this capability (§2)?
3. **Authorize by scope** — for this *specific* record, does the caller's Own/Assigned/Tenant/
   Global relationship actually hold? (E.g., for a trainer hitting
   `GET /members/:id/plans`, does an `active` `TrainerAssignment` row exist for exactly this
   `trainerId` + `memberId` pair? Tenant match alone is never sufficient.)

Step 3 is the one most often skipped in practice — it's the difference between "a trainer can see
members" and "a trainer can see *their* members" — and every service in Part 9 is specified with
its own explicit scope check for this reason.

---

**Previous:** [Part 0 — Executive Summary & Vision](./00-executive-summary-and-vision.md)
**Next:** [Part 2 — Mobile App Requirements](./02-mobile-app-requirements.md)
