# Build context is the REPO ROOT (see docker-compose.yml's `context: .`), because this is an
# npm workspace: apps/server depends on packages/shared, and npm needs to see both package.json
# files together to install correctly.

# ---- build stage --------------------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /repo

# Copy only the manifests first. As long as these don't change, Docker reuses the cached
# `npm ci` layer on every rebuild instead of re-downloading the whole dependency tree.
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/server/package.json apps/server/package.json
RUN npm ci

# Now bring in the real source - this invalidates the cache from here down, but not the
# npm ci layer above.
COPY packages/shared packages/shared
COPY apps/server apps/server

RUN npm run build --workspace=@barbellix/shared
RUN npm run build --workspace=@barbellix/server

# ---- runtime stage --------------------------------------------------------------
# A second, clean image that only contains compiled JS + node_modules - no TypeScript
# compiler, no source .ts files, no devDependencies.
FROM node:20-alpine AS runtime
WORKDIR /repo
ENV NODE_ENV=production

COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/package.json ./package.json
COPY --from=build /repo/packages/shared/package.json packages/shared/package.json
COPY --from=build /repo/packages/shared/dist packages/shared/dist
COPY --from=build /repo/apps/server/package.json apps/server/package.json
COPY --from=build /repo/apps/server/dist apps/server/dist

EXPOSE 4000
CMD ["node", "apps/server/dist/server.js"]
