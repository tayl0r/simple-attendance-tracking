# Node major: keep it equal to .nvmrc, which deploy.yml's test job reads. Nothing checks that the two match.
FROM node:22-alpine AS base
WORKDIR /app
# corepack installs the pnpm named by package.json's packageManager, so no pnpm version is written here.
COPY package.json ./
RUN corepack enable && corepack install
# The lockfile and every workspace package.json, or the frozen install refuses the lockfile
COPY pnpm-workspace.yaml pnpm-lock.yaml ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/

# Stage 1: build both packages
FROM base AS build
# Frozen: re-checks every lockfile entry against pnpm-workspace.yaml's cooldown.
RUN pnpm install --frozen-lockfile
COPY backend/ backend/
COPY frontend/ frontend/
RUN pnpm -r build

# Stage 2: the backend's production dependencies only
FROM base AS prod-deps
RUN pnpm install --frozen-lockfile --prod --filter ./backend

# Stage 3: production image
FROM node:22-alpine
WORKDIR /app
# All of it: backend/node_modules holds only links into the root's node_modules/.pnpm
COPY --from=prod-deps /app ./
COPY --from=build /app/backend/dist ./backend/dist
COPY backend/migrations ./backend/migrations
COPY --from=build /app/frontend/dist ./frontend/dist
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "backend/dist/index.js"]
