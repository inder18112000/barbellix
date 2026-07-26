# Build context is the REPO ROOT (see docker-compose.yml's `context: .`) - same reason as
# apps/server/Dockerfile: this workspace depends on packages/shared.

# ---- build stage --------------------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /repo

COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

COPY packages/shared packages/shared
COPY apps/web apps/web

# Vite inlines VITE_-prefixed env vars into the JS bundle AT BUILD TIME, not at container
# start time - so this has to be a build ARG, not a runtime `environment:` entry in compose.
# It must be the URL the *user's browser* will use to reach the API, which is the host-mapped
# port (e.g. http://localhost:4000), not the in-network service name ("server") - the browser
# runs outside the Docker network entirely.
ARG VITE_API_BASE_URL=http://localhost:4000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build --workspace=@fitpulse/shared
RUN npm run build --workspace=@fitpulse/web

# ---- runtime stage --------------------------------------------------------------
# The build output is just static HTML/JS/CSS, so the runtime image doesn't need Node at
# all - nginx serving static files is smaller and simpler than running `vite preview`.
FROM nginx:1.27-alpine AS runtime
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
