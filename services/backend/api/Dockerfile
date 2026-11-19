# Multi-stage Dockerfile for BUILDORA 60 NestJS Backend API

FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy monorepo workspace configurations
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./

# Copy shared packages
COPY packages/ ./packages/

# Copy backend api service
COPY services/backend/api/ ./services/backend/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared packages and backend
RUN pnpm --filter @buildora/types build || true
RUN pnpm --filter @buildora/constants build || true
RUN pnpm --filter @buildora/utils build || true
RUN pnpm --filter @buildora/backend-api build

# Stage 2: Production runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY packages/ ./packages/
COPY services/backend/api/ ./services/backend/api/

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

EXPOSE 3000

CMD ["node", "services/backend/api/dist/main.js"]
