# AI-Powered Fitness Ecosystem — Architecture PRD

A 13-part, ~43,000-word architecture-level Product Requirements Document for the full enterprise
vision described in the 2026-08-01 ecosystem brief: mobile app, web portals (member, trainer,
admin, super admin), an AI recommendation engine with trainer-in-the-loop review, and a
microservice backend.

## ⚠️ How this relates to the BarBellix codebase

**This document is a future-state blueprint, not a description of what exists today.** Two things
are true at once:

1. The real product in this repo (`apps/mobile`, `apps/web`, `apps/server`,
   `packages/shared`) is a considerably smaller, concrete gym-management app, and the actual
   client's own requirements are tracked separately in
   [`../Client-Requirements-and-Status.md`](../Client-Requirements-and-Status.md) (dated
   2026-07-26). That document and this one describe two different scopes — neither references the
   other, and this PRD should not be read as replacing or superseding it.
2. A line-by-line audit of this ecosystem brief against the real codebase found roughly 1 in 5
   requirements fully built, another 1 in 5 partially built, and the rest — including the
   platform's own stated Primary Goal, the interval-based adaptive plan engine (Part 5) — entirely
   unbuilt. That audit is preserved as a published artifact from the session that produced it; ask
   in-conversation if you need it re-surfaced.

Use this PRD as the target architecture if and when the product's scope is deliberately expanded
toward the full ecosystem vision. Don't use it as a status report on the current codebase — for
that, see the Client Requirements doc above or run a fresh audit.

## Reading order

| Part | Title | Covers |
|---|---|---|
| [0](./00-executive-summary-and-vision.md) | Executive Summary, Vision & Business Model | Vision statement, non-goals, revenue streams, subscription tiers, multi-tenancy model, 5 personas |
| [1](./01-rbac-and-data-model.md) | Roles, Permissions & the Canonical Data Model | **The spine.** Role/scope permission matrix for all 4 roles; every entity name/field used by every later part |
| [2](./02-mobile-app-requirements.md) | Mobile App Requirements | iOS/Android member app: IA, onboarding wizard, all 14 core permissions, gamification UI, 8 user stories |
| [3](./03-website-portals.md) | Website Portals | User, Trainer, Admin, and Super Admin web portals — module-by-module, incl. the AI Review Queue and Backup/Restore UX |
| [4](./04-trainer-management-and-ai-review-workflow.md) | Trainer Management & the AI → Trainer Review Workflow | Assignment lifecycle, the generate→review→approve/edit/reject pipeline, a full worked example |
| [5](./05-ai-recommendation-engine.md) | The AI Recommendation Engine | Inputs/outputs, the interval-based adaptive loop, a 12-rule decision table, 4 full AI prompt specs, plan versioning, provider strategy |
| [6](./06-exercise-meal-libraries-progress-wearables.md) | Exercise & Meal Libraries, Progress Tracking & Wearables | Full field specs + moderation workflow for both libraries; check-in lifecycle; all 5 wearable providers |
| [7](./07-payments-notifications-gamification-analytics.md) | Payments, Notifications, Gamification & Analytics | Billing/webhooks, the full notification matrix, XP/levels/streaks/badges/leaderboards, KPI dashboards |
| [8](./08-database-architecture.md) | Database Architecture | ER diagram, PostgreSQL justification, multi-tenancy strategy, indexing, retention policy |
| [9](./09-microservice-architecture-and-apis.md) | Microservice Architecture & API Specifications | 13-service boundary table, API Gateway, 43-endpoint REST table, sequence diagrams, event catalog |
| [10](./10-security-and-compliance.md) | Security & Compliance | RBAC enforcement, audit-log tamper-evidence, secrets management, GDPR/DPDP/CCPA, encryption, moderation SLAs |
| [11](./11-deployment-architecture-and-tech-stack.md) | Deployment Architecture & Tech Stack | Azure-primary cloud topology (AWS equivalents noted), environments, CI/CD, repo layout, full tech-stack table |
| [12](./12-development-phases-and-future-roadmap.md) | Development Phases & Future Roadmap | An 8-phase build order (risk-sequenced, not feature-glamour-sequenced) and 14 future features mapped to existing entities |

Parts 0 and 1 are prerequisite reading for every other part — every subsequent part uses the exact
role names, entity names, and field names Part 1 defines, and extends that vocabulary explicitly
(flagged inline) rather than inventing parallel names for the same concept.
