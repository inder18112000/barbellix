# Part 12 — Development Phases & Future Roadmap

> Part 12 of 13. See [`README.md`](./README.md) for the full document set and reading order.

---

## 1. Development phases

The build order below is sequenced by **risk and dependency**, not by feature glamour. The
adaptive AI engine (Phase 3) is the platform's entire reason for existing (Part 0 §1), but it
cannot be built first — it depends on real progress data, which depends on a member base actually
logging workouts and check-ins, which depends on the core member and trainer loops already
existing. Building it first would mean testing it against fabricated data, which tells you nothing
about whether the decision rules (Part 5 §5) are actually sound.

### Phase 0 — Foundations
*Nothing above this layer is buildable without it.*

| Workstream | Delivers |
|---|---|
| Auth & tenancy | `User`, `Tenant`, `Branch`, JWT auth, the role+scope enforcement pattern (Part 1 §5) |
| Data platform | PostgreSQL schema for the Part 1 §3 entity set, multi-tenancy strategy (Part 8 §4) |
| Platform skeleton | API Gateway, service scaffolding for the 13 services (Part 9), CI/CD (Part 11 §4) |
| RBAC | The permission matrix (Part 1 §2) enforced server-side, not just in client UI |

**Exit criterion:** a member, a trainer, and an admin can each log in, see only what their role and
scope entitle them to, and every cross-role access attempt outside that scope is rejected — proven
with tests, not just code review.

### Phase 1 — Core member experience
| Workstream | Delivers |
|---|---|
| Onboarding | The full assessment wizard (Part 2 §3) writing to `MemberProfile`/`MedicalProfile`/`LifestyleProfile`/`GymPreference` |
| Manual tracking | `BodyMetric` logging, `WorkoutPlan`/`DietPlan` *manual* creation and logging (no AI yet) |
| Libraries (read-only) | `Exercise` and `Meal` browsing, seeded with a starter content set |

**Exit criterion:** a member can complete onboarding, follow a manually-assigned plan, and log
progress — the product is usable end-to-end without AI turned on at all.

### Phase 2 — Trainer loop & first-generation AI
| Workstream | Delivers |
|---|---|
| Assignment | `TrainerAssignment` lifecycle (Part 4 §2): request → admin-assigned → change requests |
| Trainer authoring | Workout/meal builder, `WorkoutTemplate`, custom `Exercise`/`Meal` authoring (Part 3 §4, Part 6 §2–3) |
| First AI generation | One-shot `POST`-triggered plan generation (Part 5 §7) — a member or trainer explicitly asks for a plan; no interval loop yet |
| AI review queue | The `pending_review` → `approved`/`rejected` state machine (Part 4 §3), single-version only (no `previousVersionId` chaining yet) |

**Exit criterion:** an AI-generated plan cannot reach a member with an assigned trainer without
passing through that trainer's review — the core trust mechanism the whole product is built on.

### Phase 3 — The adaptive engine
*The highest-risk phase. This is the platform's actual differentiator (Part 0 §1) and the phase
every competitor analysis (implicitly) assumes already exists.*

| Workstream | Delivers |
|---|---|
| Scheduling | `IntervalRule`-driven check-in prompts, a real job-scheduling/message-queue layer (Part 9 §6 event catalog) — this is genuinely new infrastructure, not an extension of Phase 0–2's request/response services |
| Check-ins | `ProgressCheckIn` submission flow (Part 2 §5, Part 6 §4) |
| Comparison & decision engine | The delta computation and decision-rule table (Part 5 §5) as real, tested logic — not an LLM asked to "figure it out" |
| Versioning | `previousVersionId` chaining, version-diff UI (Part 2, Part 3 §4) |

**Exit criterion:** a member who completes two consecutive check-in cycles receives a materially
different, explainable plan version each time, and can see exactly what changed and why — this is
the single feature this whole PRD exists to justify, and it should be demoed end-to-end before any
later phase is prioritized.

### Phase 4 — Monetization & multi-tenancy at scale
| Workstream | Delivers |
|---|---|
| Billing | `Membership`/`MembershipPlan`/`PaymentEvent`, checkout + webhooks (Part 7 §1) |
| Tier gating | Server-side enforcement of Free/Premium/Trainer/Gym Enterprise entitlements (Part 0 §3.2, Part 9 §3) |
| Gym Enterprise | Multi-branch admin tooling, branding config (Part 0 §3.3) |

### Phase 5 — Engagement
| Workstream | Delivers |
|---|---|
| Notifications | The full matrix (Part 7 §3) across all three recipient roles |
| Gamification | XP/levels/streaks/badges/challenges/leaderboards/referrals (Part 7 §4) |
| Wearables | The five provider integrations (Part 6 §5) |

### Phase 6 — Platform operations & enterprise analytics
| Workstream | Delivers |
|---|---|
| Super Admin portal | AI Prompt Library, Feature Flags, RBAC UI, Audit Logs, Backup/Restore (Part 3 §7) |
| Analytics | Admin and Super Admin dashboards (Part 7 §5) |
| CMS | The editorial content feed (Part 3 §6) |

### Phase 7 — Launch hardening
| Workstream | Delivers |
|---|---|
| Security & compliance | Full Part 10 treatment — encryption audit, data-subject-rights flows, incident-response runbook |
| Deployment | Production cloud topology, CI/CD promotion gates (Part 11) |
| Store/legal readiness | Privacy policy, ToS, app-store review requirements for health-data apps |

---

## 2. Future roadmap

The features below are **explicitly out of scope for the core build** (Part 0 §2's non-goals) but
are the reason several Part 1 entities were shaped the way they were — each roadmap item below
attaches to an *existing* entity or service rather than requiring a new core data model, which is
deliberate: it's cheaper to extend `Exercise` with a `formCheckEnabled` flag later than to have
skipped modeling `Exercise` cleanly now.

| Feature | Attaches to | Horizon | Note |
|---|---|---|---|
| AI posture analysis from uploaded videos | `WorkoutPlan.days[].exercises[]` sessions; new `PostureAnalysis` result linked to a logged set | Near | Consumes video already captured for form-check uploads |
| AI exercise form correction (computer vision) | Same session data, plus `Exercise.instructions`/`safetyNotes` as the reference standard | Near | Natural pairing with posture analysis — likely the same CV pipeline |
| AI calorie estimation from meal photos | `MealLog`/`DietPlan` compliance tracking | Near | Directly reduces friction in "meal compliance" input to Part 5's engine |
| AI barcode scanner for packaged foods | `Meal`/ingredient lookup | Near | Feeds a nutrition database lookup service, extends `Meal.ingredients[]` |
| AI grocery-list generation from meal plans | Derived from `DietPlan.meals[]` | Near | Pure read/aggregate over existing data — no new model needed |
| AI shopping integration | Grocery list + a commerce partner API | Mid | Depends on grocery-list feature landing first |
| Adaptive periodization (long-term, multi-cycle) | Extends Part 5's interval engine with a longer lookback window across many `WorkoutPlan` versions | Mid | A generalization of the Phase 3 decision engine, not a new engine |
| Injury risk prediction | `MedicalProfile` + logged RPE/volume trends + `ProgressCheckIn.recoveryScore` | Mid | Highest-liability feature on this list — needs the Part 10 compliance treatment revisited specifically for predictive (not just descriptive) health claims |
| Plateau detection with automatic program adjustment | Same decision-rule table (Part 5 §5), extended with a longer-window "no progress across N intervals" rule | Mid | This is arguably a Phase 3 decision rule that shipped later, not a separate system |
| Voice-enabled AI fitness coach | `ChatConversation`/`ChatMessage`, new voice I/O layer only | Mid | No new data model — same chat entity, different input/output modality |
| Smart workout scheduling based on calendar availability | `MemberProfile.weeklyAvailability` + external calendar OAuth | Mid | Extends existing availability field rather than replacing it |
| Community groups & trainer-led programs | New `Group`/`GroupMembership` entities, referencing existing `Challenge`/`WorkoutTemplate` | Far | First roadmap item that genuinely needs new core entities |
| Corporate wellness programs | `Tenant` extended with a corporate-sponsor billing relationship distinct from Gym Enterprise | Far | Business-model extension more than a technical one |
| Multi-gym / franchise management with branch-level reporting | Already modeled by `Tenant`/`Branch` (Part 1 §3.1) and Gym Enterprise tier (Part 0 §3.2) | Near | The only roadmap item that is largely a Part 6/7 analytics build-out, not new architecture — franchise reporting is a rollup query over existing `Branch`-scoped data |

---

**Previous:** [Part 11 — Deployment Architecture & Tech Stack](./11-deployment-architecture-and-tech-stack.md)
**This is the final part.** Return to [`README.md`](./README.md) for the full document set.
