<!--
Sync Impact Report
Version change: [TEMPLATE] → 1.0.0 (initial ratification)
Modified principles: n/a (first concrete adoption; all 5 slots filled from placeholders)
Added sections: Core Principles (I-V), Technology Constraints, Development Workflow, Governance
Removed sections: none
Templates requiring updates:
  ✅ plan-template.md — Constitution Check gate is generic ("[Gates determined based on constitution file]"), no edit needed
  ✅ spec-template.md — no constitution-specific references, no edit needed
  ✅ tasks-template.md — tests already marked OPTIONAL by default, consistent with Principle III's deferred testing gate
  ✅ checklist-template.md — generic, no edit needed
Follow-up TODOs: none
-->

# BarBellix Constitution

## Core Principles

### I. Type-Safe TypeScript Everywhere
All code MUST pass `tsc` under `strict: true` (see `tsconfig.json`). The `any` type
MUST NOT be used except when interfacing with an untyped third-party module, and
such uses MUST be isolated behind a typed wrapper. Domain types (User, Exercise,
Session, etc.) live in `src/types/` as the single source of truth — screens,
queries, and mock handlers MUST import from there rather than redeclaring shapes.
Path aliases (`@/`, `@components/`, `@screens/`, etc.) MUST be used instead of
relative `../../..` chains.

**Rationale**: This is a solo-maintained cross-platform app; the type checker is
the primary safety net that a larger team's code review would otherwise provide.

### II. SOLID Component Architecture
Every component and hook MUST have one clear responsibility. Screens compose
smaller building blocks rather than growing monolithic; shared behavior (e.g.
`ScreenShell`, `PlaceholderScreen`) is extended through composition, not modified
per-use. New screens or API endpoints MUST be additive — existing contracts
(query keys, fetchers, mutators, mock handlers) are extended, not restructured,
unless the change is the explicit goal of the work. Screens MUST consume data via
TanStack Query hooks / custom hooks and MUST NOT call `fetch()` or MSW directly.

**Rationale**: Explicitly established as a project convention in `README.md`
("SOLID Principles Applied") — keeping it codified here prevents drift as the
screen count grows.

### III. Mock-First, Contract-Driven Development
New features start by defining the data contract, in this order: (1) types in
`src/types/`, (2) mock data in `src/mocks/data.ts`, (3) an MSW handler in
`src/mocks/handlers/index.ts`, (4) a query/mutation function + query key in
`src/api/queries.ts`, (5) the screen. This lets UI work proceed without a live
backend and keeps the eventual real API swap to a single point of change
(`BASE_URL` in `src/api/client.ts`).

Formal automated testing (unit/integration/E2E) is NOT currently required as a
merge gate — no test runner is installed yet and the project is in an active
UI-first build-out phase. This is a deliberate, temporary state: revisit once
core member/trainer/admin flows stabilize, and prefer adding tests for pure
business logic (validation, calculations, query/mutation functions) first.

**Rationale**: Matches the documented "UI-first phase" workflow and the existing
MSW-backed mock layer; avoids inventing a testing mandate the project isn't
resourced to enforce yet, while leaving a clear trigger for when to add one.

### IV. Consistent Design System
All visual styling (colors, spacing, typography, radii, shadows, glow, gradients,
glassmorphism, pulse/shimmer animation config) MUST come from `src/theme/index.ts`
and `src/theme/effects.ts`. Hard-coded hex colors, magic spacing numbers, or
inline shadow/gradient definitions in screen or component files are NOT allowed —
extend the theme module instead. Any new reusable visual effect is added to
`effects.ts` so it stays discoverable and reusable across screens.

**Rationale**: Keeps the app's distinct visual identity (glassmorphism, neon
glows) coherent across member/trainer/admin surfaces as more screens are built
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
is amended: Expo + React Native (0.81) for the app shell, TanStack Query for
server-state, Zustand for client-state, React Navigation for routing, Zod +
react-hook-form for form validation, MSW for API mocking during UI-first
development, and `react-native-mmkv` / `expo-secure-store` for local
persistence. New dependencies that duplicate an already-adopted tool's purpose
(e.g. a second state manager, a second charting library) require justification
in the relevant `plan.md`'s Complexity Tracking section.

## Development Workflow

`npm run lint` (ESLint over `src/**/*.{ts,tsx}`) MUST pass before a change is
considered done. Placeholder screens (`PlaceholderScreen`) are the expected
stub for unbuilt UI — replacing one is a self-contained task per the README's
"Switching a stub to a real screen" workflow and MUST NOT bundle unrelated
navigation or type changes. Adding an API endpoint MUST follow the 4-step
sequence in `README.md` ("Adding a new API endpoint") so mocks, types, and
query layer stay in sync.

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

**Version**: 1.0.0 | **Ratified**: 2026-07-19 | **Last Amended**: 2026-07-19
