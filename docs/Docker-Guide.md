# Docker for BarBellix — a step-by-step guide

This walks through exactly what was set up to containerize BarBellix, and *why* each piece
exists, so you can read it alongside the real files in the repo (`docker-compose.yml`,
`apps/server/Dockerfile`, `apps/web/Dockerfile`, `apps/web/nginx.conf`, `.dockerignore`) and
understand every line rather than just copy-pasting them.

Everything below has already been built and tested against this exact repo — see
[What we actually verified](#what-we-actually-verified) at the end for proof it works, not just
a theoretical description.

---

## 1. The concepts, in the order you actually need them

**Image vs. container.** An *image* is a read-only snapshot — a filesystem plus some metadata
(what command to run, what port to expose). A *container* is a running instance of an image, the
same way a running program is an instance of an executable on disk. You build one image and can
start many containers from it.

**Dockerfile.** A recipe for building an image, one instruction per line, executed top to bottom.
Each instruction (`COPY`, `RUN`, ...) produces a new *layer*. Docker caches layers: if a line and
everything above it are unchanged since the last build, Docker reuses the cached result instead
of re-running it. This is why file *order* inside a Dockerfile matters — see §4.

**docker-compose.** Running `docker build` and `docker run` by hand for three services (database,
API, web) with the right ports/networks/env vars every time would be tedious and easy to get
wrong. `docker-compose.yml` describes all of it declaratively — `docker compose up` builds
whatever needs building and starts everything in the right order.

**Networks.** By default, `docker compose` puts every service in the same file on one private
network, and each container can reach the others *by service name* as if it were a hostname
(`mongo`, `server`, `web`). This only works container-to-container — see §6, it's the single
most common point of confusion.

**Volumes.** Containers are disposable — delete one and everything written inside it is gone. A
*volume* is storage that lives outside any single container's lifecycle, so data (like MongoDB's
actual database files) survives even if you destroy and recreate the container.

---

## 2. What's containerized, and what isn't

| Service | Containerized? | Why |
|---|---|---|
| `apps/server` (Fastify API) | Yes | A real backend process — exactly what Docker is for. |
| MongoDB | Yes | Official `mongo` image, zero custom code needed. |
| `apps/web` (React dashboard) | Yes | Built to static files, served by nginx. |
| `apps/mobile` (Expo app) | **No** | Expo's dev workflow (Metro bundler + QR code + a physical device or simulator) doesn't gain anything from a container — you still need to run it on your machine or a simulator either way, and getting simulators/USB debugging to work *through* Docker is a lot of pain for no benefit. The mobile app just points its `API_BASE_URL` at wherever the dockerized server is running (`http://localhost:4000` on your machine), the same as if the server weren't dockerized at all. |

---

## 3. `docker-compose.yml`, service by service

```yaml
services:
  mongo:
    image: mongo:7
    restart: unless-stopped
    ports:
      - '27017:27017'
    volumes:
      - barbellix_mongo_data:/data/db
    healthcheck:
      test: ['CMD', 'mongosh', '--quiet', '--eval', "db.adminCommand('ping')"]
      interval: 5s
      timeout: 5s
      retries: 10
```

- `image: mongo:7` — no Dockerfile needed; we're not customizing MongoDB, so we just use the
  official image directly.
- `ports: '27017:27017'` — `hostPort:containerPort`. This exposes Mongo on your actual machine
  too, so you can point a GUI tool (MongoDB Compass, etc.) at `localhost:27017` if you want to
  poke around the data directly.
- `volumes: barbellix_mongo_data:/data/db` — MongoDB writes its data files to `/data/db` *inside*
  the container. Without this line, that data would vanish the moment the container is removed.
  With it, `/data/db` is backed by a named volume that Docker manages and keeps around across
  `docker compose down` / `up` cycles.
- `healthcheck` — Docker periodically runs this command *inside* the container to decide if it's
  "healthy," not just "started." A freshly-started `mongod` process needs a moment before it can
  actually accept connections — without a healthcheck, `server` could start and try to connect
  before Mongo is really ready.

```yaml
  server:
    build:
      context: .
      dockerfile: apps/server/Dockerfile
    depends_on:
      mongo:
        condition: service_healthy
    env_file:
      - apps/server/.env
    environment:
      MONGODB_URI: mongodb://mongo:27017/barbellix
      CORS_ORIGIN: http://localhost:8080,http://localhost:8081,http://localhost:5173
    ports:
      - '4000:4000'
```

- `build.context: .` — the **repo root**, not `apps/server`. This matters a lot; see §4.
- `depends_on.mongo.condition: service_healthy` — don't just start `server` after the `mongo`
  *container* exists, wait until its healthcheck actually passes. This is the fix for a real race
  condition, not decoration — without it, the server can boot faster than Mongo and crash on its
  first connection attempt.
- `env_file: apps/server/.env` — your existing local `.env` (JWT secrets, Stripe keys, AI
  provider keys) still applies inside the container.
- `environment:` — these two values are *overridden* on top of whatever `.env` has, because
  they need to change specifically because we're now running in Docker:
  - `MONGODB_URI` now points at the Mongo **container**, reachable by its service name `mongo`,
    not `localhost` (there is no MongoDB running on `localhost` inside the server's container).
  - `CORS_ORIGIN` needs to include `http://localhost:8080`, which is where the browser will
    actually be loading the web dashboard from once it's dockerized too (see the next service).
- `ports: '4000:4000'` — exposes the API on your machine at `localhost:4000`, exactly like
  running `npm run server` without Docker at all.

```yaml
  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
      args:
        VITE_API_BASE_URL: http://localhost:4000
    depends_on:
      - server
    ports:
      - '8080:80'
```

- `args.VITE_API_BASE_URL` — a **build-time** argument, not a runtime environment variable. This
  is the single most important gotcha in this whole setup — fully explained in §6.
- `ports: '8080:80'` — the web container runs nginx listening on port 80 *inside* the container;
  we map that to `8080` on your machine so it doesn't collide with anything else you might have
  running locally (like Vite's own dev server on 5173).

---

## 4. Why the build `context` is the repo root, not the app folder

BarBellix is an **npm workspace monorepo**: `apps/server` and `apps/web` both depend on
`packages/shared` (`import { loginSchema } from '@barbellix/shared'`, etc.). A Docker build can
only `COPY` files that exist inside its *build context* — the folder you point it at. If the
context were just `apps/server`, the Dockerfile would have no way to reach `packages/shared` at
all, because Docker builds are sandboxed from the rest of your filesystem by design.

That's why both Dockerfiles start their `COPY` paths from the repo root (`packages/shared/...`,
`apps/server/...`) and `docker-compose.yml` sets `context: .` — repo root — for both.

### The two-stage `COPY` trick (why it's not just `COPY . .`)

Look at `apps/server/Dockerfile`'s build stage:

```dockerfile
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/server/package.json apps/server/package.json
RUN npm ci

COPY packages/shared packages/shared
COPY apps/server apps/server
RUN npm run build --workspace=@barbellix/shared
RUN npm run build --workspace=@barbellix/server
```

This copies **only the `package.json` files first**, runs `npm ci`, *then* copies the actual
source code. Why not just copy everything and `npm ci` in one step?

Layer caching (§1) again: `npm ci` — downloading and installing every dependency — is the slowest
step in the whole build. If we copied source code first, then every single source-code edit
(even a one-line change to a React component) would invalidate the cache and force a full
`npm ci` re-run on every build. By copying only the manifests first, Docker only re-runs `npm ci`
when a `package.json` or the lockfile actually changes — everyday code edits reuse the cached
dependency layer and rebuild in seconds instead of minutes.

Notice neither Dockerfile copies `apps/web/package.json` or `apps/mobile/package.json` into the
image. That's deliberate, not an oversight: a Docker image only ever contains what you explicitly
`COPY` into it. Even though the *build context* is the whole repo, the *image* only gets the
handful of paths each Dockerfile actually names — so the server's image has no idea the mobile
app or the web dashboard even exist, which keeps it small and their dependencies out of it.

### Multi-stage builds (why there are two `FROM` lines)

Both Dockerfiles have two stages: `build` and `runtime`.

```dockerfile
FROM node:20-alpine AS build
# ... npm ci, npm run build ...

FROM node:20-alpine AS runtime
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/server/dist apps/server/dist
# no TypeScript compiler, no .ts source files, no devDependencies-only tools in this image
```

The `build` stage needs the TypeScript compiler, all the source `.ts` files, etc. None of that is
needed to actually *run* the compiled server — it's just extra weight (and extra attack surface)
in the final image. `COPY --from=build` cherry-picks only the compiled output and the installed
`node_modules` out of the build stage into a fresh, clean image. The `apps/web` Dockerfile takes
this even further: its runtime stage isn't Node at all, it's `nginx:alpine`, because the build
output is just static HTML/CSS/JS — nginx serving files is smaller and simpler than running a
Node server just to hand back static assets.

---

## 5. `apps/web/nginx.conf` — the SPA routing fix

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

React Router handles routes like `/admin/members` entirely in the browser — there's no real file
at that path. If nginx were left at its defaults, a hard refresh (or a shared link) to
`/admin/members` would hit nginx directly, find no matching file, and return a 404 — even though
the exact same route works fine when you navigate to it by clicking inside the already-loaded
app. `try_files` tells nginx: look for a real file matching the URL, then a matching directory,
and if neither exists, fall back to serving `index.html` instead — which lets React Router take
over and render the right screen client-side.

---

## 6. The trickiest part: two different kinds of "the API's address"

This project's frontend and backend talk to MongoDB and each other in **two different network
contexts**, and mixing them up is the single most common Docker networking mistake.

**Container-to-container** (server → mongo): both containers are on the same Docker-managed
network, so `server` can reach Mongo at the hostname `mongo` — Docker's internal DNS resolves
that to the right container automatically. This is why `MONGODB_URI` is
`mongodb://mongo:27017/barbellix`, not `localhost`.

**Browser-to-container** (your browser → the web/server containers): your browser is running on
your actual machine, *completely outside* the Docker network. It has no idea what `server` or
`web` mean as hostnames. It can only reach whatever port was published to your machine via
`ports:` — `localhost:8080` for the dashboard, `localhost:4000` for the API.

This is exactly why `VITE_API_BASE_URL` is set to `http://localhost:4000` and not
`http://server:4000`: the React app's JavaScript runs *in the browser*, not inside the `web`
container, so it needs the host-mapped address, the same one you'd type into your own browser's
address bar.

And this is also why `VITE_API_BASE_URL` had to be a **build ARG**, not a compose `environment:`
entry like `MONGODB_URI`. Vite inlines any `VITE_`-prefixed variable directly into the compiled
JavaScript bundle *when you run `vite build`* — by the time the container is actually running,
the value is already baked into static files nginx is serving; there's no live process left to
read a runtime environment variable from. Setting `environment: VITE_API_BASE_URL: ...` on the
`web` service in compose would do *nothing* — the files are already built by then.

---

## 7. Environment variables and secrets

- `apps/server/.env` is never copied into any image (see `.dockerignore`'s `**/.env` line) — it's
  only read by `docker compose` on your machine at `up` time via `env_file:`, and injected into
  the container's environment. It never becomes part of an image layer, so it can't leak if you
  ever push an image somewhere.
- `VITE_API_BASE_URL` is the one intentional exception — it's not a secret (it's just a URL), and
  it *has* to be baked in at build time per §6.
- If you ever add a new secret the server needs, put it in `apps/server/.env` — `env_file:`
  already wires the whole file through, nothing else to configure.

---

## 8. Running it

```bash
# One-time: create your local env file if you haven't already
cp apps/server/.env.example apps/server/.env   # then fill in real values
cp apps/web/.env.example apps/web/.env         # only used for non-Docker `npm run dev`

# Build all three images
docker compose build

# Start everything in the background
docker compose up -d

# Watch logs (all services, or one at a time)
docker compose logs -f
docker compose logs -f server

# See what's running
docker compose ps

# Get a shell inside a running container (handy for debugging)
docker compose exec server sh

# Stop everything (keeps the mongo-data volume, so your data survives)
docker compose down

# Stop AND delete the volume (full reset - you'll need to re-seed)
docker compose down -v

# Rebuild just one service after changing its code
docker compose build server
docker compose up -d server
```

The first time you start it against a fresh volume, MongoDB has no data in it yet — seed it the
same way you would locally, just pointed at the container's published port:

```bash
MONGODB_URI="mongodb://localhost:27017/barbellix" npm run seed --workspace=@barbellix/server
```

Then open **http://localhost:8080** and log in with any of the seeded accounts (see
`apps/server/src/db/seed.ts` for the full list — `admin@barbellix.app` / `password123` is the
gym-owner account).

---

## What we actually verified

Everything in this guide was built and tested against this exact repo, not just written from
theory:

1. `docker compose build` — both `barbellix-server` and `barbellix-web` images built successfully.
2. `docker compose up -d` — all three containers started; `mongo`'s healthcheck passed *before*
   `server` started (proving `depends_on.condition: service_healthy` actually works).
3. `curl http://localhost:4000/health` → `{"status":"ok","mongo":"connected"}` — the
   containerized server is really talking to the containerized MongoDB.
4. `curl http://localhost:8080/` → `200` — nginx is serving the built React app.
5. `curl http://localhost:8080/admin/members` → `200` (not nginx's default 404) — the SPA
   fallback routing fix in `nginx.conf` works.
6. Ran the real seed script against the dockerized Mongo (`MONGODB_URI=mongodb://localhost:27017/barbellix`),
   then `POST /auth/login` against the dockerized server with a seeded account → got back a real
   user object and a real JWT access token.
7. Inspected the built JS inside the running `web` container and confirmed `localhost:4000` is
   actually present in the compiled bundle — proving the `VITE_API_BASE_URL` build ARG was really
   baked in, not silently ignored.

The stack was left running after this — `docker compose ps` will show it, and
`http://localhost:8080` is live right now if you want to click around immediately.

---

## Ideas to extend this yourself (good next learning steps)

- **Trim the server image further**: run `npm ci --omit=dev` (or `npm prune --omit=dev` after
  building) before the final `COPY --from=build .../node_modules` so devDependencies-only
  packages don't ride along into the runtime image.
- **Add a healthcheck to the `server` service** using the existing `GET /health` route, so
  `docker compose ps` reports it as healthy/unhealthy instead of just "running."
- **Multi-arch builds** (`docker buildx build --platform linux/amd64,linux/arm64`) if you ever
  need images that run on both Intel and Apple Silicon / ARM servers.
- **A dev-mode compose override** (`docker-compose.override.yml`) that mounts `apps/server/src`
  as a volume and runs `tsx watch` instead of the compiled build, for hot-reload inside a
  container instead of rebuilding the image on every change.
