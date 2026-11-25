# Multi-stage Dockerfile for BUILDORA 60 Vendor Portal

# Stage 1: Build the React + Vite static bundle
FROM node:20-alpine AS builder

WORKDIR /app

# Build-time API URL (defaults to Nginx reverse proxy path /api/v1)
ARG VITE_API_URL=/api/v1
ARG VITE_DEFAULT_TENANT_ID=tenant-buildora-blr
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_DEFAULT_TENANT_ID=$VITE_DEFAULT_TENANT_ID

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy root workspace configurations
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./

# Copy shared packages
COPY packages/ ./packages/

# Copy vendor-web application
COPY apps/vendor-web/ ./apps/vendor-web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared packages and vendor-web
RUN pnpm --filter @buildora/types build || true
RUN pnpm --filter @buildora/constants build || true
RUN pnpm --filter @buildora/utils build || true
RUN pnpm --filter @buildora/validation build || true
RUN pnpm --filter @buildora/vendor-web build

# Stage 2: Serve with lightweight Nginx
FROM nginx:alpine

# Copy built static assets from builder stage
COPY --from=builder /app/apps/vendor-web/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY apps/vendor-web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
