# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Stage 2: Build backend
FROM node:20-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ .
RUN npm run build

# Stage 3: Production image
FROM node:20-alpine
WORKDIR /app
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/node_modules ./node_modules
COPY --from=backend-build /app/backend/package.json .
COPY --from=backend-build /app/backend/migrations ./migrations
COPY --from=frontend-build /app/frontend/dist ./frontend/dist
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/index.js"]
