<!--
Sync Impact Report
Version change: 1.0.0 → 2.0.0
Modified principles:
  - III. Mock-First, Contract-Driven Development → III. Contract-Driven Development (Shared Types, Real Backend)
    Redefined incompatibly: the mock/MSW layer this principle described has been fully replaced by a
    real Fastify + Mongoose/MongoDB backend (apps/server) since the 2026-07-19 ratification. The
    contract chain now runs through packages/shared (Zod schemas + TS types) instead of src/mocks/.
  - I. Type-Safe TypeScript Everywhere — clarified (not redefined): domain types' single source of
    truth moved from mobile-only `src/types/` to monorepo-wide `packages/shared/src/types.ts`,
    matching the same real-backend shift as Principle III.
  - IV. Consistent Design System — clarified (not redefined): disambiguated the theme file paths
    now that this is a 3-app monorepo (`apps/mobile/src/theme/*` vs. `apps/web/src/index.css`),
    named the shared dark palette both apps now use, and pointed at the new canonical brand
    reference `docs/brand/Brand-Guide.html`.
Modified sections:
  - Technology Constraints — removed MSW; added the real backend stack (Fastify, Mongoose/MongoDB,
    JWT, Stripe, packages/shared) alongside the existing client-side stack
  - Development Workflow — replaced dangling references to README sections that no longer exist
    ("SOLID Principles Applied", "Adding a new API endpoint", "Switching a stub to a real screen")
    with the current equivalent workflow
Added sections: none
Removed sections: none
Templates requiring updates:
  ✅ plan-template.md — Constitution Check gate is generic, no edit needed
  ✅ spec-template.md — no constitution-specific references, no edit needed
  ✅ tasks-template.md — tests still OPTIONAL by default, still consistent with Principle III's deferred testing gate
  ✅ checklist-template.md — generic, no edit needed
Follow-up TODOs: none
-->

# BarBellix Constitution

## Core Principles

### I. Type-Safe TypeScript Everywhere
All code MUST pass `tsc` under `strict: true` (see `tsconfig.json`). The `any` type
MUST NOT be used except when interfacing with an untyped third-party module, and
such uses MUST be isolated behind a typed wrapper. Domain types (User, Exercise,
Session, etc.) live in `packages/shared/src/types.ts` as the single source of
truth across all three apps — server routes, client queries, and screens MUST
import from there rather than redeclaring shapes. Path aliases (`@/`,
`@components/`, `@screens/`, etc.) MUST be used instead of relative `../../..`
chains.

**Rationale**: This is a solo-maintained cross-platform app; the type checker is
the primary safety net that a larger team's code review would otherwise provide.

### II. SOLID Component Architecture
Every component and hook MUST have one clear responsibility. Screens compose
smaller building blocks rather than growing monolithic; shared behavior (e.g.
`ScreenShell`, `PlaceholderScreen`) is extended through composition, not modified
per-use. New screens or API endpoints MUST be additive — existing contracts
(query keys, fetchers, mutators, Fastify route handlers) are extended, not
restructured, unless the change is the explicit goal of the work. Screens MUST
consume data via TanStack Query hooks / custom hooks and MUST NOT call
`fetch()` directly.

**Rationale**: Keeps each layer (screen, hook, query function, route handler)
independently testable and swappable as the screen and endpoint count grows
across three role surfaces (member/trainer/admin).

### III. Contract-Driven Development (Shared Types, Real Backend)
New features start by defining the data contract, in this order: (1) the Zod
schema + TypeScript type in `packages/shared/src` (`schemas.ts`/`types.ts`),
(2) rebuild the shared package (`npm run build --workspace=@barbellix/shared`),
(3) the real, Zod-validated, role-guarded Fastify route in `apps/server/src`,
(4) a query/mutation function + query key in the consuming client's API layer
(`apps/mobile/src/api/queries.ts` or `apps/web/src/api/queries.ts`), (5) the
screen/page. `packages/shared` is the single source of truth for these shapes
— apps/server, apps/web, and apps/mobile all import from it rather than
redeclaring contracts locally.

Formal automated testing (unit/integration/E2E) is NOT currently required as a
merge gate — `apps/server` has vitest installed (`npm test`) but zero test
files exist yet anywhere in the monorepo. This is a deliberate, temporary
state: revisit once core member/trainer/admin flows stabilize, and prefer
adding tests for pure business logic (validation, calculations, the
grace-period/access-block check, query/mutation functions) first.

**Rationale**: The mock-first/MSW phase this principle originally described
ended once `apps/server` (Fastify + Mongoose/MongoDB, real JWT auth, Stripe
billing) replaced the mock layer entirely — codifying the current real
contract chain here prevents drift back toward ad hoc, per-app type
duplication now that three consumers (server, web, mobile) share one
contract surface.

### IV. Consistent Design System
All visual styling (colors, spacing, typography, radii, shadows, glow, gradients,
glassmorphism, pulse/shimmer animation config) MUST come from the shared token
layer for that app — `apps/mobile/src/theme/index.ts` +
`apps/mobile/src/theme/effects.ts` on mobile, the CSS custom properties in
`apps/web/src/index.css` on web. Hard-coded hex colors, magic spacing numbers,
or inline shadow/gradient definitions in screen or component files are NOT
allowed — extend the token layer instead. Any new reusable visual effect is
added to `effects.ts` (mobile) so it stays discoverable and reusable across
screens. The brand palette itself (Obsidian Black / Titanium Silver / Electric
Volt) is one deliberate dark identity shared by both apps, not a per-app
choice or a light/dark toggle. The brand mark (bolt-sliced "B" monogram),
palette swatches, and every platform variant (favicon, app icon, adaptive
icon, notification icon, splash) are canonically documented in
`docs/brand/Brand-Guide.html` — open it in a browser before touching
`BrandMark.tsx` (web or mobile), `favicon.svg`, or any mobile icon asset, and
keep it in sync if that construction ever changes.

**Rationale**: Keeps the app's distinct visual identity coherent across
member/trainer/admin surfaces and across mobile/web as more screens are built
by a single maintainer over time, and avoids one-off styling that's hard to
retheme later.

### V. Cross-Platform Parity by Default
Code MUST work across iOS, Android, and Web (the three Expo targets in this
project) unless a feature is explicitly platform-scoped. Platform-specific
branches (`Platform.OS === '...'`, `.ios.tsx`/`.android.tsx` files) MUST be
justified by a real platform constraint (e.g. a native-only API like the
barcode scanner or camera) — not used as a shortcut to avoid solving a
cross-platform layout or interaction problem.

**Rationale**: The Quick Start instructions treat Android/iOS/Web as equally
first-class (`Press a/i/w`); silently breaking one platform undermines the
"cross-platform gym app" premise stated in the README's tagline.

## Technology Constraints

The stack is fixed unless a change is explicitly proposed and the constitution
is amended.

- **apps/server** (single real backend): Fastify 5, Mongoose 8 / MongoDB, Zod
  request validation, JWT access+refresh auth, Stripe for billing.
- **apps/mobile**: Expo + React Native (0.81), TanStack Query for server-state,
  Zustand for client-state, React Navigation for routing, Zod +
  react-hook-form for form validation, `react-native-mmkv` / `expo-secure-store`
  for local persistence.
- **apps/web**: Vite + React, TanStack Query, MobX for local UI state,
  Tailwind + shadcn/ui.
- **packages/shared**: the only place domain types and Zod schemas are
  defined; all three apps consume it, none redeclare it.

New dependencies that duplicate an already-adopted tool's purpose (e.g. a
second state manager, a second charting library) require justification in the
relevant `plan.md`'s Complexity Tracking section.

## Development Workflow

`npm run lint` (runs lint across every workspace that defines a `lint` script)
MUST pass before a change is considered done. Placeholder screens
(`PlaceholderScreen`) are the expected stub for unbuilt mobile UI — replacing
one is a self-contained task and MUST NOT bundle unrelated navigation or type
changes. Adding an API endpoint MUST follow the 5-step contract chain in
Principle III (shared schema → rebuild shared → route → client query function
→ screen) so `packages/shared`, `apps/server`, and the consuming client stay
in sync.

## Governance

This constitution supersedes ad hoc conventions when the two conflict. Amending
it requires: (1) editing this file, (2) bumping `CONSTITUTION_VERSION` per
semantic versioning (MAJOR = principle removed/redefined incompatibly, MINOR =
principle or section added, PATCH = clarification/wording), and (3) noting the
change in a Sync Impact Report comment at the top of the file, as done here.
Since this is a solo-maintained project, "approval" is self-review at the time
of the amending commit rather than a multi-party process — but the version
bump and impact report are still required so the history of *why* a principle
changed is preserved. Complexity or deviation from a principle MUST be justified
in the relevant `plan.md` Complexity Tracking table rather than silently
ignored.

**Version**: 2.0.0 | **Ratified**: 2026-07-19 | **Last Amended**: 2026-07-30
