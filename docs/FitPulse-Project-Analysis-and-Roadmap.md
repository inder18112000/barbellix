# FitPulse — Project Analysis & Market-Readiness Roadmap

*"Feel every rep." — Cross-platform gym & AI training app (React Native + Expo)*

**Prepared:** 2026-07-19 | Codebase snapshot analysis | Confidential — internal use

---

## Executive Summary

FitPulse is a cross-platform (iOS / Android / Web) gym management and AI-coached training app built on Expo + React Native, serving three distinct roles — member, trainer, and admin — from a single codebase. The build-out is substantial for an early-stage project: 37 screens are implemented (not stubs) across auth, workout logging, progress tracking, nutrition/habits, an AI coach with a real multi-provider LLM backend, trainer member-management, and admin analytics/attendance.

The codebase is UI-complete but backend-absent: every data layer is served by a mock (MSW-style fetch interception) rather than a real API, authentication auto-logs in during development, and several features (trainer–member messaging, notifications) only exist as local component state with nothing persisted. This is a normal and sensible stage for a UI-first build — but it means the gap to a market-ready product is almost entirely in backend, security, monetization, and platform-readiness work, not in UI surface area.

> **Most urgent finding:** the AI Coach calls Groq, Gemini, OpenRouter, and Anthropic directly from the client using `EXPO_PUBLIC_*` environment variables. Expo inlines `EXPO_PUBLIC_` values into the JavaScript bundle at build time, so every API key shipped this way is extractable from the compiled app by any user. This must be fixed (proxy the calls through a backend) before any public build, TestFlight/Play beta, or store submission — otherwise the developer's own API keys and billing are exposed.

This report inventories what exists, what's real vs. mocked, what's missing for a competitive market launch, and lays out a phased roadmap — starting with the security fix above, then real backend/auth, reliability, engagement features, monetization, and launch readiness.

---

## Current State Snapshot

| Metric | Value |
|---|---|
| Screens implemented | 37 (0 remaining placeholder stubs) |
| User roles | Member, Trainer, Admin (+ Superadmin defined but unused) |
| Platforms targeted | iOS, Android, Web (Expo, `userInterfaceStyle: automatic`) |
| Backend | None — all data served via client-side fetch mocking |
| Authentication | Mocked; auto-authenticated in `__DEV__` builds |
| AI Coach | Real multi-provider LLM integration (Groq / Gemini / OpenRouter / Claude) + rule-based fallback |
| Automated tests | 0 test files; no test runner installed |
| Push notifications | Dependency installed (`expo-notifications`); zero code usage |
| Payments / billing | Not present |
| Accessibility labels | 0 matches across the codebase |
| Dark mode | Not implemented (theme is light-mode only) |

---

## Architecture Overview

The app follows a mock-first, contract-driven pattern: domain types (`src/types`) → mock data (`src/mocks/data.ts`) → a fetch-patching mock server (`src/mocks/setup.ts`) → typed query/mutation functions (`src/api/queries.ts`) → screens consuming data via TanStack Query hooks. This cleanly isolates the eventual real-backend swap to `src/api/client.ts`'s `BASE_URL`.

| Layer | Choice | Note |
|---|---|---|
| App shell | Expo SDK 54 + React Native 0.81 + React 19 | Modern, current versions |
| Navigation | React Navigation (native-stack, bottom-tabs) | Role-based root switch |
| Server state | TanStack Query 5 | Well-suited; ready for a real API swap |
| Client state | Zustand | Used for auth store |
| Forms | react-hook-form + Zod | Solid validation stack |
| Charts | victory-native | Used for progress/volume charts |
| AI | Custom multi-provider client (`src/ai/`) | Groq → Gemini → OpenRouter → Claude priority chain |
| Local storage deps | react-native-mmkv, expo-secure-store | Installed but unused in `src/` |
| API mocking | Hand-rolled fetch patch (`src/mocks/setup.ts`) | A separate, unused MSW handler file also exists as dead code |
| Styling | Centralized theme + effects module | Glassmorphism / glow visual identity |

---

## Feature Completeness Matrix

**Status legend:** 🟢 **WIRED (mock)** = real UI + types + mock data + query, ready to point at a real API · 🟡 **PARTIAL** = UI exists but backing data/types are incomplete · 🔴 **FAKE / MISSING** = local-only state or entirely absent

| Feature Area | Status | Notes |
|---|---|---|
| Auth (login/register/forgot pw) | 🟢 WIRED (mock) | Dev builds auto-authenticate; superadmin has no login path |
| Workout plans / sessions / sets | 🟢 WIRED (mock) | Full logging flow incl. RPE, rest timer |
| Exercise library | 🟢 WIRED (mock) | |
| Personal records | 🟢 WIRED (mock) | |
| Body metrics / progress charts | 🟢 WIRED (mock) | |
| AI Coach — recommendation cards | 🟢 WIRED (mock) | Rule-based (deload/streak/overload logic) |
| AI Coach — chat | 🟡 WIRED, real LLM | Provider keys exposed client-side — security risk |
| Nutrition / habit tracking | 🟢 WIRED (mock) | |
| QR check-in | 🟢 WIRED, real device API | Uses expo-camera CameraView for real scanning |
| Admin attendance / analytics | 🟢 WIRED (mock) | |
| Trainer member list / assign plan | 🟢 WIRED (mock) | |
| Multi-gym (Branch/Tenant/Membership) | 🟡 PARTIAL | Types modeled, zero mock data/handlers; screen uses hardcoded local state |
| Trainer ↔ member messaging | 🔴 FAKE | Local component state only; own ad-hoc Message type, nothing persists |
| Notifications (in-app) | 🔴 FAKE | Local toggle state only; no Notification type or handler |
| Push notifications | 🔴 MISSING | Dependency installed, zero code usage |
| Payments / billing / subscriptions | 🔴 MISSING | Not present anywhere |
| Offline support / caching | 🔴 MISSING | mmkv dependency installed but unused |
| Analytics / crash reporting | 🔴 MISSING | No Sentry/Amplitude/Firebase etc. |
| Error boundaries | 🔴 MISSING | None found |
| Accessibility | 🔴 MISSING | 0 accessibilityLabel/Role usages |
| Dark mode | 🔴 MISSING | app.json declares automatic; theme is light-only |
| Internationalization (i18n) | 🔴 MISSING | English-only, no i18n library |
| Automated tests | 🔴 MISSING | 0 test files, no test runner |

---

## Strengths to Build On

- **Real screen coverage:** 37 functioning screens across 3 roles — the UI surface most competitors spend months on already exists.
- **Genuine AI differentiation:** the multi-provider LLM chat is built with a real priority-fallback chain (Groq→Gemini→OpenRouter→Claude) and constructs prompts from the user's actual workout/PR/body-metric/nutrition history — this is a real personalization engine, not a gimmick, and is rare in this category at this build stage.
- **B2B2C platform shape already modeled:** member + trainer + admin roles in one app is the same shape as Trainerize/TrueCoach/Mindbody — a viable, differentiated wedge into gyms rather than just another single-user fitness tracker.
- **Low type-debt:** strict TypeScript, centralized domain types, path aliases — refactors and a real-backend swap will be cheaper than in a typical MVP.
- **Clean swap point for the backend:** the mock-first architecture means moving off fetch-mocking to a real API is largely confined to `src/api/` and `src/mocks/`, not a rewrite.
- **Distinct visual identity:** the glassmorphism/glow theme is centralized and consistent — a real branding asset most fitness-app clones lack.
- **One real device integration already working:** camera-based QR check-in proves the team can ship real native functionality, not just mocks.

---

## Critical Gaps for a Market Launch

| # | Gap | Severity | Why it blocks a market release |
|---|---|---|---|
| 1 | LLM API keys embedded client-side (`EXPO_PUBLIC_*`) | **BLOCKER** | Extractable from the compiled app; enables key theft and unbounded billing abuse on the developer's accounts |
| 2 | No real backend / database | **BLOCKER** | All data is client-mocked; nothing persists across devices, reinstalls, or users |
| 3 | Auth is mocked / auto-login in dev | **BLOCKER** | No real account system, session security, or password reset flow |
| 4 | Messaging & notifications are local-only | HIGH | Trainer–member communication, a core B2B2C value prop, doesn't actually work |
| 5 | No monetization layer | HIGH | No way to charge gyms, trainers, or members — no business model implemented yet |
| 6 | No automated tests | HIGH | 37 screens with zero regression safety net; every change risks silent breakage |
| 7 | No crash reporting / analytics | HIGH | No visibility into real-world failures or usage/retention once live |
| 8 | Push notifications not wired | MEDIUM | Dependency present but unused — losing the #1 retention lever for a habit-based app |
| 9 | No offline support | MEDIUM | Gym environments have poor connectivity; mmkv is installed but idle |
| 10 | No accessibility support | MEDIUM | 0 a11y labels — risk of App Store rejection concerns and excludes users |
| 11 | No dark mode despite declaring it | LOW | app.json promises automatic theming; theme module doesn't deliver it |
| 12 | Multi-gym (Branch/Tenant) types unused | MEDIUM | If the business model is per-gym SaaS, this data model needs a real backend to be sellable |

---

## Competitive Landscape & Positioning

| Competitor | Category | FitPulse's angle against it |
|---|---|---|
| Strava / Hevy | Consumer workout tracker/social | FitPulse adds trainer + gym-admin roles — not just a personal logger |
| Trainerize / TrueCoach / Mindbody | B2B2C gym & trainer platforms | Closest structural match; FitPulse's edge is a real LLM coach baked in, not bolted on |
| Fitbod / Future | AI-personalized programming | Future pairs AI with human coaches; FitPulse could position its LLM coach as the affordable middle tier |
| Whoop / Apple Fitness+ | Wearable-driven coaching | No wearable integration yet — a clear expansion opportunity, not a current competitor overlap |

Recommended positioning: a gym-facing SaaS (member + trainer + admin in one app) with a genuinely AI-personalized coach as the headline differentiator — closer to "Trainerize with a real AI coach" than to a Strava/Hevy-style consumer tracker. That framing also justifies the multi-tenant Branch/Membership data model already present in the types.

---

## Phased Roadmap to Market

### Phase 0 — Security & Cost Control (do first, before any beta)
*Nothing else matters if API keys are already leaking in test builds.*

| Item | Effort |
|---|---|
| Move all LLM provider calls behind a backend proxy / serverless function; strip EXPO_PUBLIC_ provider keys from the client entirely | M |
| Add per-user rate limiting and usage quotas on AI Coach calls | S |
| Rotate any API keys that have already been used in a built/shared app binary | S |

### Phase 1 — Real Backend & Auth
*Replaces the mock layer without needing a UI rewrite, thanks to the existing `api/` boundary.*

| Item | Effort |
|---|---|
| Stand up a real backend (custom API or BaaS such as Supabase/Firebase) and point `src/api/client.ts` at it | L |
| Implement real authentication: signup, login, password reset, session persistence; remove `__DEV__` auto-auth bypass | M |
| Add a superadmin login path (role exists in code, has no entry point today) | S |
| Persist trainer–member messaging and notifications server-side instead of component state | M |

### Phase 2 — Reliability & Observability
*Protects the investment made in Phase 1 as the app grows.*

| Item | Effort |
|---|---|
| Introduce a test runner (Jest + React Native Testing Library); start with pure logic — query functions, AI context builder, validation | M |
| Add error boundaries around navigators/screens | S |
| Wire crash reporting (e.g. Sentry) and product analytics (e.g. PostHog/Amplitude) for funnel & retention visibility | M |
| Persist TanStack Query cache to MMKV for offline-first behavior (dependency already installed, unused) | M |

### Phase 3 — Engagement Features
*The features that turn a logging app into a habit.*

| Item | Effort |
|---|---|
| Wire expo-notifications for real push: workout reminders, trainer messages, streak nudges | M |
| Real-time trainer↔member messaging (websocket or polling-backed) | M |
| Implement dark mode in the theme module to match app.json's "automatic" declaration | S |
| Accessibility pass: labels/roles on interactive elements, screen-reader test on core flows | M |

### Phase 4 — Monetization & Multi-Tenancy
*Turns the product into a business.*

| Item | Effort |
|---|---|
| Build the real backend for Branch/Tenant/Membership (types already modeled, currently unused) | L |
| Add subscriptions/paywall (RevenueCat or Stripe): e.g. free rule-based coach vs. paid LLM coach; per-gym SaaS tier for admin/trainer seats | L |
| Membership & attendance billing integration for gyms | L |

### Phase 5 — Market Launch Prep
*What the App Store / Play Store review process and real users will actually require.*

| Item | Effort |
|---|---|
| Replace placeholder icon/splash assets with final branding | S |
| Privacy policy & Terms of Service (mandatory given health data + AI chat) | S |
| GDPR/CCPA data export & deletion flows for health-category data | M |
| Store listing assets, screenshots, ASO copywriting | S |
| Wearable integrations (Apple Health / Google Fit) — high-leverage differentiator in this category | L |

### Phase 6 — Growth & Differentiation
*Post-launch levers once the core is stable and monetized.*

| Item | Effort |
|---|---|
| Social features: leaderboards, friend challenges, gym-level community feed | L |
| Exercise video demos / AI camera-based form-check | L |
| Referral program for member and gym acquisition | M |
| Internationalization for non-English markets | M |

*(Effort key: S = small, M = medium, L = large)*

---

## Immediate Next 5 TODOs

The highest-leverage actions to take right now, in order.

1. **Fix the API key exposure.** Proxy every LLM provider call through a backend/serverless function before building another test binary.
2. **Pick and stand up a real backend.** Supabase/Firebase for speed, or a custom API if the multi-tenant gym model needs more control — this unblocks auth, persistence, messaging, and notifications simultaneously.
3. **Add a test runner and first tests.** Cover the AI context builder and query functions first — highest business risk, easiest to test in isolation.
4. **Wire real push notifications.** The dependency is already installed; this is the cheapest, highest-impact retention feature currently missing.
5. **Decide the monetization + multi-tenancy model.** The Branch/Tenant/Membership types already assume a per-gym SaaS business — confirm that's the target model, then build its backend and paywall together rather than bolting billing on later.

---

## Appendix A — Full Screen Inventory

All 37 screens are real implementations; none are placeholder stubs.

**Auth (7)**
SplashScreen · OnboardingScreen · LoginScreen · RegisterScreen · ForgotPasswordScreen · GoalSelectionScreen · BodyStatsScreen

**Member (22)**
HomeScreen · WorkoutHomeScreen · ActiveWorkoutScreen · WorkoutSummaryScreen · WorkoutHistoryScreen · WorkoutDetailScreen · ExerciseLibraryScreen · ExerciseDetailScreen · ExercisePickerScreen · ProgressHomeScreen · PersonalRecordsScreen · BodyMetricsScreen · AICoachScreen · NutritionScreen · QRCheckInScreen · ProfileHomeScreen · EditProfileScreen · SettingsScreen · NotificationsScreen

**Trainer (5)**
TrainerHomeScreen · MemberListScreen · MemberDetailScreen · AssignPlanScreen · MessageMemberScreen

**Admin (5)**
AdminHomeScreen · AttendanceFeedScreen · AnalyticsScreen · MemberManagementScreen · BranchSettingsScreen
