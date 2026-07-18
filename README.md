# ⚡ FitPulse

> *Feel every rep.* — Cross-platform gym & AI training app built with React Native + Expo.

## Quick Start

```bash
cd "E:\Personal Projects\fitpulse"
npm install
npx expo start
```

Press `a` for Android, `i` for iOS, `w` for web.

## Project Structure

```
fitpulse/
├── App.tsx                    # Entry point — QueryClient + MSW + Navigation
├── src/
│   ├── api/
│   │   ├── client.ts          # Fetch wrapper with auth header injection
│   │   └── queries.ts         # All query/mutation functions + queryKeys
│   ├── components/
│   │   └── common/
│   │       ├── ScreenShell.tsx      # Base screen wrapper (safe area + header)
│   │       └── PlaceholderScreen.tsx # Stub used during UI-first phase
│   ├── mocks/
│   │   ├── data.ts            # All mock data (users, sessions, exercises…)
│   │   ├── setup.ts           # MSW server bootstrap
│   │   └── handlers/
│   │       └── index.ts       # MSW request handlers for every API endpoint
│   ├── navigation/
│   │   ├── types.ts           # All navigator param types (TypeScript)
│   │   ├── RootNavigator.tsx  # Auth-aware root — routes by user role
│   │   ├── AuthNavigator.tsx  # Splash → Onboarding → Login/Register flow
│   │   ├── MemberNavigator.tsx # Bottom tabs + nested stacks
│   │   ├── TrainerNavigator.tsx
│   │   └── AdminNavigator.tsx
│   ├── screens/
│   │   ├── auth/              # Splash, Onboarding, Login, Register, Goals, Stats
│   │   ├── member/            # Home, Workout, Progress, AI Coach, Profile
│   │   ├── trainer/           # Trainer dashboard, member management
│   │   └── admin/             # Admin dashboard, analytics, attendance feed
│   ├── store/
│   │   ├── authStore.ts       # Zustand auth state (auto-authenticated in DEV)
│   │   └── queryClient.ts     # TanStack Query client config
│   ├── theme/
│   │   ├── index.ts           # Colors, spacing, typography, border radius, shadows
│   │   └── effects.ts         # Glassmorphism, glow, gradient presets, pulse config
│   └── types/
│       └── index.ts           # All TypeScript types (User, Exercise, Session…)
```

## SOLID Principles Applied

- **S** — Each component/hook has one job. `ScreenShell` wraps, `PlaceholderScreen` stubs, `HomeScreen` composes.
- **O** — Screens extend `ScreenShell` without modifying it. Mock handlers extend the `handlers` array.
- **L** — All screens accept the same `navigation` contract via React Navigation.
- **I** — Query keys, fetchers, and mutators are separate exports — import only what you need.
- **D** — Screens call custom hooks / TanStack queries, never `fetch()` directly.

## Dev Workflow

### Switching a stub to a real screen
1. Open `src/screens/member/WorkoutHomeScreen.tsx`
2. Replace `PlaceholderScreen` with your actual UI
3. The navigation, types, and mock data are already wired

### Adding a new API endpoint
1. Add mock data to `src/mocks/data.ts`
2. Add an MSW handler in `src/mocks/handlers/index.ts`
3. Add a query key + fetch function in `src/api/queries.ts`
4. Use `useQuery` in your screen

### Disabling mocks (connect real backend)
In `App.tsx`, remove or gate the `startMockServer()` call. Point `BASE_URL` in `src/api/client.ts` to your real API.

## Creative Effects

All visual effects are in `src/theme/effects.ts`:
- `glass.card` / `glass.cardStrong` — glassmorphism surfaces
- `glow.primary` / `glow.accent` — neon shadow glows
- `gradients.*` — gradient color arrays for `expo-linear-gradient`
- `pulseConfig` — animated pulse ring parameters (Reanimated)
- `shimmerConfig` — shimmer loading skeleton parameters

## Next Screens to Build (priority order)

1. `WorkoutHomeScreen` — today's plan + start button
2. `ActiveWorkoutScreen` — live logger with set/rep/weight input + rest timer
3. `ProgressHomeScreen` — body weight chart + volume chart
4. `AICoachScreen` — recommendation cards + rule-based suggestions
5. `LoginScreen` + `RegisterScreen` — auth forms with Zod validation
