# ⚡ BarBellix

Gym management platform: a React Native member app, a React web dashboard for gym owners and
trainers, and a Node.js/Fastify backend with MongoDB — sharing one real API, one database, and
one set of TypeScript types. Real JWT auth, real attendance/workout tracking, real Cashfree
payment collection (UPI + cards, plus SMS-confirmed cash payments), and a rate-limited AI
coaching proxy (no client-side AI keys).

## Monorepo structure

```
barbellix/
├── apps/
│   ├── mobile/     # React Native + Expo — member-facing app
│   ├── server/     # Fastify + Mongoose/MongoDB — the one real backend both clients talk to
│   └── web/        # Vite + React — management dashboard for gym owners (admin) and trainers
└── packages/
    └── shared/     # Types, Zod schemas, and constants shared across all three apps
```

- **apps/mobile** — Expo Router-free React Navigation app for members: onboarding, workout
  logging, progress tracking, nutrition/habits, AI coach, QR check-in. State via Zustand.
- **apps/server** — the single source of truth for both clients. Fastify 5, Mongoose 8, JWT
  access+refresh auth with rotation/theft detection, Zod-validated routes, role-based guards
  (`member` / `trainer` / `admin` / `superadmin`), Cashfree Orders + webhooks for billing.
- **apps/web** — the staff-only dashboard. "Gym owner" is the `admin`/`superadmin` role; trainers
  get their own scoped views. Tailwind + shadcn/ui, MobX for state, TanStack Query, real-time-ish
  polling for attendance.
- **packages/shared** — the contract between all three: TypeScript interfaces and Zod schemas
  built once (`npm run build --workspace=@barbellix/shared`) and consumed by every app.

## Quick start

```bash
git clone https://github.com/inder18112000/barbellix.git
cd barbellix
npm install
npm run build --workspace=@barbellix/shared
```

**Backend** (needs a local or remote MongoDB — see `apps/server/.env.example`):

```bash
cp apps/server/.env.example apps/server/.env   # fill in MONGODB_URI, JWT secrets, etc.
npm run server                                  # starts Fastify on :4000
```

There's no seed script — register a member via the mobile app, then promote/create trainer and
admin accounts as described in `docs/DEPLOYMENT.md`.

**Web dashboard** (owner + trainer login):

```bash
cp apps/web/.env.example apps/web/.env
npm run dev --workspace=@barbellix/web          # :5173, log in with a seeded admin/trainer account
```

**Mobile app** (member login):

```bash
cp apps/mobile/.env.example apps/mobile/.env
npm run mobile                                  # expo start — press a/i/w
```

Cashfree billing (`apps/web`'s membership plans + checkout links) works without any Cashfree keys
for everything except creating a real online checkout session — set `CASHFREE_APP_ID` /
`CASHFREE_SECRET_KEY` in `apps/server/.env` to enable that part. Cash payments confirmed by SMS
OTP additionally need `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` — see
`docs/DEPLOYMENT.md` for the full list.

## Roles

| Role | Client | Notes |
|---|---|---|
| `member` | mobile | self-registers; rejected from the web dashboard |
| `trainer` | web | manages assigned members, builds/assigns workout plans, messaging |
| `admin` / `superadmin` | web | "gym owner" — everything trainers can do, plus billing, branch settings, member status |

## Brand

The bolt-sliced "B" monogram, the Obsidian Black / Titanium Silver / Electric Volt palette, and
every platform variant (favicon, app icon, adaptive icon, notification icon, splash) are
documented in [`docs/brand/Brand-Guide.html`](docs/brand/Brand-Guide.html) — open it in a browser.
`BrandMark.tsx` (in both `apps/web` and `apps/mobile`) and `apps/web/public/favicon.svg` render
this exact construction; treat the guide as canonical before changing any of them.

## Development notes

- Workspaces are npm workspaces (not pnpm — Expo/Metro's module resolution doesn't play well
  with pnpm's hoisting).
- After changing anything in `packages/shared`, rebuild it before the other apps will pick up the
  change: `npm run build --workspace=@barbellix/shared`.
- `npm run lint` runs lint across every workspace that defines a `lint` script.
