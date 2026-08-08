# Part 3 — Website Portals

> **Document set:** this is Part 3 of a 13-part architecture-level PRD for the *AI-Powered Fitness
> Ecosystem*. It specifies the four web-based "cockpits" introduced in Part 0 §1: the member-facing
> **User Portal**, the **Trainer Portal**, the tenant-scoped **Admin Portal**, and the
> platform-level **Super Admin Portal**. See [`README.md`](./README.md) for the full part list and
> reading order. This part assumes Part 1's role names (`member`, `trainer`, `admin`,
> `superadmin`) and canonical entities throughout and does not redefine them.

---

## 1. Shared Web Platform

All four portals are built from **one component library and one route-guarding pattern**, not
four independently-designed web apps that happen to share a backend. This matters because the
same trainer who reviews plans on a laptop between clients today may, in Part 10's roadmap, review
them from a tablet at the gym floor — the visual and interaction language must not fork.

### 1.1 Shared component library / design system

A single web component library — data table, calendar grid, plan-diff viewer, chat panel, form
wizard, stat tile, and approval-queue-card primitives — is consumed by all four portals plus the
public marketing shell. Concretely:

- The **calendar grid** primitive backs both the User Portal's Workout Calendar and Meal Calendar
  (§2) — it is the same component rendering `WorkoutPlan.days[]` in one instance and
  `DietPlan.meals[]` in the other, not two calendars.
- The **plan-diff viewer** — a side-by-side or inline rendering of a `WorkoutPlan`/`DietPlan`
  against its `previousVersionId` — is shared between the User Portal's Reports module (a member
  reading *why* their plan changed) and the Trainer Portal's AI Review Queue (§3.2–3.5, a trainer
  deciding whether to approve that same change).
- The **approval-queue-card** primitive is shared across three surfaces that are structurally
  identical even though their subject matter differs: the Trainer Portal's AI Review Queue
  (`WorkoutPlan`/`DietPlan` awaiting a trainer), the Admin Portal's Trainer Management approval
  queue (`User` rows awaiting an admin), and the Admin Portal's Exercise/Meal Approval queues
  (`Exercise`/`Meal` rows awaiting an admin). One card component, three data sources.
- Tenant white-labeling (Gym Enterprise's branding parity requirement, Part 0 §4 "Aditi") is a
  theme layer resolved from `Tenant.brandingConfig` at load time — the Admin and User Portals for
  a given tenant re-skin (logo, palette, typographic scale) without a separate build. The Super
  Admin Portal never themes to a tenant; it always renders in the platform's own operator theme, a
  deliberate visual cue that a superadmin session is *not* inside any one gym's data.

### 1.2 Route guarding: role + scope

Every route in every one of the four portals is guarded by the same authenticate → authorize-by-role
→ authorize-by-scope pattern defined in Part 1 §5 — this part does not redefine that mechanism, only
maps each portal onto it:

| Portal | Role required | Scope enforced |
|---|---|---|
| User Portal | `member` | Own |
| Trainer Portal | `trainer` | Assigned (via `TrainerAssignment`, §3 below) |
| Admin Portal | `admin` | Tenant |
| Super Admin Portal | `superadmin` | Global |

Route guards hide and disable navigation client-side for UX only; the binding check on every one
of these screens is the server-side scope check described in Part 1 §5 and detailed per-service in
Part 9. A trainer who edits the DOM to reveal a hidden "all members" view still gets a 403 from the
API, because the API never trusted the client's role claim in the first place.

---

## 2. User Portal (Member Web)

The User Portal is the desktop mirror of the mobile app (Part 2): same account, same data, same
`member` role and Own scope, optimized for a larger screen and for the moments a member plans their
week rather than logs a single set. It is not a reduced feature set — Reports and Subscription, in
particular, are materially richer on web than on the phone.

| Module | Purpose | Key entities | Core requirements |
|---|---|---|---|
| **Dashboard** | Today-at-a-glance home screen | `WorkoutPlan`, `DietPlan`, `GamificationState`, `ProgressCheckIn`, `Notification` | Shows today's workout/meal, current `GamificationState.streakDays`/`xp`, the next `ProgressCheckIn.dueAt`, and a banner when a plan version's `status` is `pending_review` or freshly `approved` so the member knows a change is coming or has landed |
| **Progress** | Full metric history, not just today's snapshot | `ProgressCheckIn`, `BodyMetric`, `WearableConnection`, `WearableSample` | Trend charts over weight/body-fat/measurements, photo timeline (`ProgressCheckIn.photos[]`), overlay of wearable-sourced `WearableSample` data (steps, heart rate, sleep) against logged metrics; ad-hoc `BodyMetric` entries alongside scheduled check-ins |
| **Workout Calendar** | Month/week grid of the active `WorkoutPlan` | `WorkoutPlan`, `WorkoutDay`, `Exercise` | Renders `WorkoutPlan.days[]` onto calendar dates; mark-complete per day; tap an exercise to open its `Exercise` detail (video, instructions, `commonMistakes`, `safetyNotes`) read-only; "Request a change" writes a `PlanRevisionRequest` routed per Part 1 §2.1 |
| **Meal Calendar** | Month/week grid of the active `DietPlan` | `DietPlan`, `Meal` | Renders `DietPlan.meals[]` onto calendar dates against `dailyTargets`; log meal compliance; view `Meal.recipeText`/`media`; same `PlanRevisionRequest` path as Workout Calendar |
| **Trainer Chat** | Direct messaging with the assigned trainer | resolved via `TrainerAssignment.trainerId` | Two-sided thread, enabled only while an `active` `TrainerAssignment` exists (Part 1 §2.1); this is a distinct feature from the AI Chat Coach — the AI Coach is backed by `ChatConversation`/`ChatMessage` (`role: assistant`), Trainer Chat is human-to-human and disappears (with history retained, read-only) the moment the assignment ends |
| **Reports** | Exportable, explainable progress reporting | `WorkoutPlan`, `DietPlan`, `ProgressCheckIn` | The plan-diff viewer (§1.1) rendered for the member: "here is what changed between v3 and v4 of your plan, and why" sourced from the interval-adjustment reasoning (Part 5); adherence percentage over a selected date range; exportable as PDF |
| **Subscription** | Tier and billing self-service | `Membership`, `MembershipPlan`, `PaymentEvent` | View current tier against Part 0 §3.2's Free/Premium feature table; upgrade/downgrade; view `PaymentEvent` history and invoices; payment method management via the tenant's PCI-compliant provider integration (Part 7 §1, Part 9) |

---

## 3. Trainer Portal

The Trainer Portal is Arjun's (Part 0 §4) primary work surface. Every module below operates at
**Assigned** scope — a trainer's queries are always `WHERE trainerId = :self AND status = 'active'`
joined through `TrainerAssignment`, never `WHERE tenantId = :self.tenantId` (Part 1 §2.2). This is
restated here because it is the one rule every screen in this portal must visibly respect: a
trainer who somehow sees a member with no active assignment to them is a defect, not an edge case.

### 3.1 Module summary

| Module | Purpose | Key entities | Core requirements |
|---|---|---|---|
| **Assigned Users** | The trainer's roster — **never** a tenant-wide member list | `TrainerAssignment`, `User`, `MemberProfile` | Lists only members with an `active` `TrainerAssignment.trainerId = self`; per-row adherence indicator, days since last `ProgressCheckIn`, and current plan `status` badge; a trainer with 40 clients (Arjun, Part 0 §4) must be able to sort/filter this list by adherence risk |
| **Workout Builder** | Author or edit a `WorkoutPlan`/`WorkoutTemplate` | `WorkoutPlan`, `WorkoutDay`, `WorkoutTemplate`, `Exercise` | Build from scratch (`generatedBy: trainer`, `source: trainer_authored`) or start from an AI draft opened via the Review Queue (§3.7); every save creates a new plan version chained via `previousVersionId`, never an in-place mutation of a version a member has already seen; reusable `WorkoutTemplate` rows are authored here and are explicitly not tied to any one member |
| **Meal Builder** | Author or edit a `DietPlan` | `DietPlan`, `Meal` | Same authoring/versioning model as Workout Builder, against `dailyTargets` and `meals[]` |
| **Exercise Library** | **Create/edit**, not just browse | `Exercise` | Full CRUD on the tenant's `Exercise` library (`tenantId` set, `createdBy` = the trainer), not a read-only catalog view; if the tenant enables a review step, a newly authored or edited `Exercise` enters the `pending_approval` workflow state described in Part 1 §2.2 and surfaces in the Admin Portal's Exercise Approval queue (§4) before it's visible to members |
| **Video Upload** | Attach media to library content | `Exercise.media.videos[]` | Upload against a specific `Exercise`; storage/transcoding pipeline detailed in Part 8; upload does not bypass the same `pending_approval` gate as the rest of the `Exercise` record |
| **Progress Review** | Read the assigned member's trend data before writing notes | `ProgressCheckIn`, `BodyMetric` | Same trend/photo views as the User Portal's Progress module (§2), scoped to one assigned member at a time, with a trainer-notes field attached to the review |
| **AI Review Queue** | The single most important screen in this portal | `WorkoutPlan`, `DietPlan` | See §3.2–3.5 |
| **Messaging** | Trainer side of Trainer Chat (§2), plus roster-wide announcements | resolved via `TrainerAssignment` | One-on-one threads mirroring the User Portal's Trainer Chat; a broadcast/announcement mode to reach multiple assigned members at once (e.g., "gym closed for a holiday") |
| **Reports** | Roster-level adherence rollups | `ProgressCheckIn`, `WorkoutPlan`, `DietPlan` | Adherence and check-in-completion rates aggregated across the trainer's assigned roster, exportable, feeding the "median review turnaround" and adherence objectives in Part 0 §2 |

### 3.2 Why the AI Review Queue matters

Part 0 §1 states the Platform's core differentiating claim in one sentence: *AI proposes, a
certified human disposes.* The AI Review Queue is where that sentence becomes a screen. It is the
only path by which an AI-authored `WorkoutPlan` or `DietPlan` reaches a member who has an assigned
trainer (Part 1 §2.2), and Part 0 §2's second strategic objective — median review turnaround under
24 hours, an under-60-second accept for the common case — is measured almost entirely against this
one screen's usability. The exact state machine a plan moves through (`pending_review` →
`approved`/`rejected` → `active` → `superseded`, and what triggers each transition) is Part 4's
subject in full; this part specifies only the UI built on top of it.

### 3.3 Layout

The queue is a single-column, inbox-style list, not a paginated table — the design goal is
inbox-zero, not data browsing:

- **Sort order:** oldest `createdAt` first, always. The trainer works top-down until the queue is
  empty. There is no "sort by newest" option, because burying old items is the exact failure mode
  the 24-hour objective exists to prevent.
- **Age badge:** each card shows elapsed time since `createdAt` in human terms ("6h", "22h", "1d
  4h") and visually escalates — a neutral tone under ~12 hours, a warning tone approaching 24
  hours, an alert tone past it — giving the trainer an at-a-glance backlog-health signal without
  opening anything.
- **Card contents:** member name/photo, plan type (workout or diet), `source`
  (`initial`/`interval_adjustment`/`manual_request`), and a collapsed plan-diff summary (the same
  diff-viewer primitive from §1.1) against `previousVersionId` — e.g., "+1 set on 3 lifts, -1
  accessory exercise" — so the trainer can judge the shape of the change before opening it.
- **Filters:** by plan type (workout/diet) and by `source`, so a trainer can, for example, clear
  every routine `interval_adjustment` in a batch before handling the smaller number of
  `manual_request` items that need more attention.

### 3.4 Actions

Three actions are available directly from the card, in escalating order of effort:

1. **Approve** — one click, no navigation away from the queue. Transitions the plan to `approved`
   with no edits; the row is removed from the queue immediately (optimistic UI) and the queue
   counter decrements. This is the path Part 0 §2 wants completable in under 60 seconds.
2. **Edit** — opens the Workout Builder or Meal Builder pre-filled with the AI draft. Any save from
   here creates a new version in the same chain; the trainer's edits are what Part 0 §1's "provenance"
   language calls trainer-edited. The trainer can save-and-approve in one step from the builder,
   rather than edit, back out, then approve separately.
3. **Reject with reason** — requires a non-empty, freeform reason before the reject control
   activates. The plan is set to `rejected` and is never surfaced on the member's Workout Calendar
   or Meal Calendar (§2); the reason is retained against the plan version for audit and, per Part
   4, can drive a regeneration request back to the AI engine (Part 5).

Every action writes an `AuditLogEntry` (`actorId` = the trainer, `actorRole: trainer`, `action`
one of `approve_plan`/`edit_plan`/`reject_plan`, `targetType: WorkoutPlan` or `DietPlan`).

### 3.5 User stories — AI Review Queue

**Story 1 — Seeing only what's mine, oldest first.**
As a trainer, I want my review queue to show only `pending_review` plans for members actively
assigned to me, oldest first, so I never lose track of who's waiting and never see anyone else's
clients.

- The queue query is `WHERE status = 'pending_review' AND memberId IN (SELECT memberId FROM
  TrainerAssignment WHERE trainerId = :self AND status = 'active')` — Tenant match alone is never
  sufficient (Part 1 §5).
- Default sort is `createdAt ASC` (oldest first) and cannot be reversed to "newest first" as a
  saved preference.
- A card's age badge crosses into the warning tone at 12 hours and the alert tone at 24 hours,
  matching Part 0 §2's median-turnaround objective.
- If a member's `TrainerAssignment` ends (expires or is reassigned) while their plan is still
  `pending_review`, the card disappears from this trainer's queue on the next load — it does not
  linger as an orphaned entry.

**Story 2 — Approving the common case in one click.**
As a trainer, I want to approve a plan I agree with without leaving the queue, so the common case
(the AI got it right) costs me seconds, not minutes.

- The Approve button requires exactly one click/tap and no confirmation modal for the default case.
- On approve, the plan's `status` transitions to `approved` (and onward to `active` per Part 4's
  activation rule) and `generatedBy` remains `ai` — the provenance recorded is "AI-generated,
  trainer-approved," distinct from a trainer-edited plan.
- The card is removed from the visible queue within the same interaction, with no full-page reload.
- The action produces an `AuditLogEntry` capturing `beforeState.status: pending_review` and
  `afterState.status: approved` before the plan reaches the member's calendar.

**Story 3 — Rejecting never happens silently.**
As a trainer, I want to send a plan back with a specific, recorded reason when something is wrong,
so my client never receives an AI output I didn't actually endorse, and there is a paper trail for
why.

- The Reject action is disabled until a reason is entered — an empty-reason reject is not possible
  in the UI.
- Rejecting sets `status: rejected`; the plan is excluded from every member-facing surface (Workout
  Calendar, Meal Calendar, Dashboard banner) permanently for that version.
- The reason text is visible later in Progress Review (§3.1) and in the Admin Portal's Analytics
  drill-down as part of the trainer's audit trail — it is never write-only.
- Rejecting a plan does not silently retry generation; what happens next (regeneration, escalation,
  or a manual builder session) is governed by Part 4's workflow, which this screen triggers but does
  not itself decide.

---

## 4. Admin Portal

The Admin Portal is Meena's (Part 0 §4) daily console: everything here operates at **Tenant**
scope — any record sharing the admin's `tenantId`, never crossing into another gym's data (Part 1
§1.1). Meena is explicitly non-technical; every module below is designed to answer a business
question ("is billing okay," "can I trust this new trainer") without exposing AI or infrastructure
internals, which are Super Admin's domain (§5).

| Module | Purpose | Key entities | Core requirements |
|---|---|---|---|
| **User Management** | Manage the tenant's member and staff accounts | `User`, `MemberProfile` | Create/edit/deactivate any `User` in the tenant; view profile summaries; resolve a member's `change_requested` `TrainerAssignment` by ending the old row and creating a new `active` one (Part 1 §3.3) — an explicit, auditable transition, never a silent overwrite |
| **Trainer Management** | Approval queue for new trainers | `User` (`role: trainer`, `status: pending_approval`) | Lists every `pending_approval` trainer account in the tenant; a trainer has **zero** standing access to any member until approved (Part 1 §2.2); approve/suspend actions write `AuditLogEntry`; see user story 1 below |
| **Exercise Approval** | Moderation for trainer-authored library content | `Exercise` | Lists tenant-library `Exercise` rows awaiting sign-off — the `pending_approval` workflow state referenced in Part 1 §2.2 — before they're visible to any member; approve publishes the record for the tenant, reject returns it to the authoring trainer with a reason |
| **Meal Approval** | Moderation for trainer-authored meals, and reported content | `Meal`, `ModerationFlag` | Two related but distinct queues on one screen: (1) newly authored/edited `Meal` rows awaiting the same `pending_approval` sign-off as Exercise Approval, and (2) `ModerationFlag` rows (`status: open`, `targetType: Meal`) raised by members reporting an already-published meal — see user story 2 below |
| **Analytics** | Business-health dashboards | rollups over `ProgressCheckIn`, `WorkoutPlan`/`DietPlan` adherence, `PaymentEvent` | Active members, renewal/expiry pipeline, per-trainer and per-branch adherence, revenue — the tenant-scoped counterpart to Part 0 §2's objective #3 (full detail in Part 7) |
| **Payments** | Billing operations | `Membership`, `MembershipPlan`, `PaymentEvent` | Create/edit/cancel/refund subscriptions; view full `PaymentEvent` history per member; reconciliation view so Meena can trust "billing just works" (Part 0 §4) |
| **CMS** | Tenant-scoped content, distinct from the global feed | tenant announcements/articles | Manage announcements and articles surfaced only inside this tenant's apps; this is explicitly separate from the global `ContentArticle` editorial feed, which only Super Admin manages (Part 1 §2.3/§2.4, Part 6 §5) |
| **Notifications** | Tenant-level configuration on top of global templates | `Notification` channel/config | Admin does not author notification template *content* or add new delivery channels — that authority is Super Admin's, Global scope (Part 1 §2.4) — but can toggle which of the platform's configured templates are active for this tenant and set tenant branding variables (sender name, footer) within them |

### 4.1 User stories

**Story 1 — Approving a new trainer.**
As an Admin, I want to review and approve a `pending_approval` trainer account before it can touch
any member data, so unqualified people can never claim the trainer role at my gym.

- Acceptance: the Trainer Management queue lists every `User` row where `role = trainer AND status
  = pending_approval`, scoped to Tenant only.
- Acceptance: until approved, the account cannot successfully call any Assigned-scope endpoint —
  there is no member roster, no chat, nothing — because no `TrainerAssignment` can exist against an
  account that isn't `active` (Part 1 §2.2).
- Acceptance: Approve transitions `User.status` to `active`; the action writes an `AuditLogEntry`
  with `actorRole: admin`, `action: approve_trainer`, `targetType: User`.
- Acceptance: a rejected/suspended application keeps `status: suspended` and the applicant is
  notified; re-application is a new record, not a resurrected one.

**Story 2 — Reviewing a reported piece of content.**
As an Admin, I want to review a member's report against a published `Meal` (or `Exercise`) and
either action it or dismiss it, so unsafe or inaccurate trainer-authored content doesn't linger in
my tenant's library.

- Acceptance: the queue lists `ModerationFlag` rows where `status = open`, scoped to the reporting
  member's tenant, each showing `reporterId`, `targetType`, `targetId`, and `reason`.
- Acceptance: each row links through to a live preview of the flagged `Meal`/`Exercise` so the
  admin doesn't have to leave the queue to judge context.
- Acceptance: "Action" moves the flag to `status: actioned` and un-publishes or edits the underlying
  content in the same step; "Dismiss" moves it to `status: dismissed` with no content change.
- Acceptance: both outcomes write an `AuditLogEntry`, and the flag itself, once `actioned` or
  `dismissed`, is never silently reopened — a new report creates a new `ModerationFlag` row.

---

## 5. Super Admin Portal

The Super Admin Portal is Devraj's (Part 0 §4) control plane for the platform itself, not for any
one gym. Everything here is **Global** scope, and per Part 1 §1.1, every Global action is written
to `AuditLogEntry` without exception — including read access to cross-tenant data during
investigations. Devraj's portal is the only one of the four that intentionally never adopts a
tenant's `brandingConfig` (§1.1) — a visual reminder that a superadmin session sits above every
tenant, not inside one.

| Module | Purpose | Key entities | Core requirements |
|---|---|---|---|
| **System Configuration** | Platform-wide defaults and tenant provisioning | `Tenant`, `IntervalRule` | Create `Tenant` rows and assign `planTier`; set the platform-default `IntervalRule` (`cadenceDays`, `fieldsCollected[]`, `tenantId: null`), which tenants and members may then override within admin-set bounds (Part 1 §2.4) |
| **AI Prompt Management** | The prompt library, versioned | `AIPromptTemplate` | See §5.1 |
| **RBAC UI** | The permission matrix, as data | the Part 1 §2 matrix, expressed as configuration | Role × capability × scope grid, editable without a redeploy; a change here is what makes Part 1 §2 authoritative in production, not just in this document |
| **Audit Logs** | Read-only, filterable, immutable | `AuditLogEntry` | Filterable by `actorId`, `actorRole`, `tenantId`, `targetType`, `action`, and date range; append-only with no update or delete path for any role, including Super Admin (Part 1 §3.8) — the UI does not even render an edit affordance |
| **API Management** | External integrations and quotas | AI usage quotas, webhook config | Per-tenant AI generation quota (Part 0 §3.1's usage-based overage), API keys/webhooks for Stripe and wearable providers, rate-limit thresholds |
| **Feature Flags** | Global rollout control | `FeatureFlag` | Targeting UI over `rolloutMode`: **all** (single on/off toggle), **percentage** (a slider driving consistent-hash bucketing so a member's on/off state doesn't flicker across sessions), **tenant_list** (multi-select tenant search, for Gym Enterprise-only betas) |
| **Monitoring** | Infrastructure and AI-layer health | AI provider latency/error rate, queue depth | Infra-level metrics explicitly out of Admin's reach (Part 1 §2.3's "not infrastructure metrics" carve-out) — provider uptime/fallback status (Part 5 §7), and the aggregate AI Review Queue backlog *across every tenant*, the platform-wide view of Part 0 §2's 24-hour objective |
| **Backup & Restore** | Disaster recovery | full platform snapshot | Backup is routine and single-operator; **Restore is a deliberately dangerous, two-person-confirmed action** — see §5.2 |

### 5.1 AI Prompt Management: editor and rollback UX

Each `AIPromptTemplate` row is one version of one `key`/`roleTarget` combination
(`workout_gen`/`diet_gen`/`chat`/`recommendation`). The screen is built around one core idea:
**rollback is a version-pointer flip, not a redeploy** (Part 1 §2.4).

- A version list per `key`, newest first, each showing `version`, `updatedBy`, `updatedAt`, and
  whether `isActive`.
- A text editor for `promptText` on a new draft version — saving a draft never touches `isActive`;
  drafts are inert until explicitly promoted.
- A diff view between any two versions of the same `key`, using the same diff primitive as the
  plan-diff viewer (§1.1), so a regression is visible line-by-line, not just by version number.
- "Make Active" on any version — draft or historical — flips `isActive` on that row and clears it
  on whichever version currently holds it, atomically. The next generation request for that
  `roleTarget` (Part 5) picks up the newly active prompt with no deployment step.

### 5.2 Backup & Restore: why Restore requires two people

Backup runs on schedule and can be triggered ad hoc by a single Super Admin — it is non-destructive.
Restore overwrites live data and is therefore gated behind an explicit two-person confirmation flow:

1. **Request.** A Super Admin selects a snapshot (timestamp, size, and tenant scope if the restore
   is partial) from a read-only list and enters a written justification. This creates a *pending*
   restore request — nothing executes yet.
2. **Independent confirmation.** A **second, distinct** Super Admin account — not the initiator,
   enforced server-side — must open the request, review the initiator's identity, justification,
   and a computed delta of what the restore would overwrite, and then confirm.
3. **Typed confirmation phrase.** The confirming admin must type an exact phrase (e.g., the
   environment or tenant name being restored) before the confirm control activates — a guard
   against reflexive click-through.
4. **Bounded window.** An unconfirmed request auto-expires (e.g., after 30 minutes) and must be
   re-initiated; a stale, forgotten restore request can never fire later on its own.
5. **Full audit trail.** Request, confirmation, execution, expiry, and cancellation each write a
   distinct `AuditLogEntry` — the sequence is reconstructable after the fact even though the
   `AuditLogEntry` table itself is append-only and immutable.

### 5.3 User stories

**Story 1 — Rolling back a bad AI prompt version.**
As a Super Admin, I want to roll back a `workout_gen` prompt template to its previous version
within minutes of spotting a regression, so the AI keeps producing safe, on-brief output while the
root cause is investigated offline.

- Acceptance: the version list for the affected `key` is sorted newest first and clearly marks
  which version is currently `isActive`.
- Acceptance: selecting a prior version and confirming "Make Active" flips `isActive` to that
  version and off the current one in a single atomic operation — no redeploy, no waiting on a
  release pipeline.
- Acceptance: the change takes effect on the very next generation call for that `roleTarget` (Part
  5); it is not retroactive against plans already generated or already sitting in the Trainer
  Portal's AI Review Queue (§3), whose exact carry-forward semantics are Part 4/5's to define.
- Acceptance: the rollback writes an `AuditLogEntry` with `beforeState`/`afterState` recording the
  old and new active `version` numbers and `updatedBy`.

**Story 2 — Restoring from backup.**
As a Super Admin, I want a Restore to require a second, independent Super Admin's confirmation
before it executes, so a single compromised or careless account can never trigger irreversible,
platform-wide data loss.

- Acceptance: initiating Restore only ever creates a pending request; there is no code path where
  one Super Admin's action alone causes data to be overwritten.
- Acceptance: the confirming admin must be a different account than the initiator, checked
  server-side, not merely a different browser session hidden from the initiator's own account.
- Acceptance: the confirmation screen surfaces the snapshot's delta against live data before the
  confirm control is enabled — the second admin is confirming an informed, specific action, not a
  blind rubber stamp.
- Acceptance: an unconfirmed request expires within its bounded window and must be re-initiated
  from scratch; every state transition (requested, confirmed, executed, expired, cancelled) is an
  immutable `AuditLogEntry` entry.

---

**Previous:** [Part 2 — Mobile App Requirements](./02-mobile-app-requirements.md)
**Next:** [Part 4 — Trainer Management & the AI Review Workflow](./04-trainer-management-and-ai-review-workflow.md)
