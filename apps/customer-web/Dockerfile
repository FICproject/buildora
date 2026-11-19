# Multi-stage Dockerfile for BUILDORA 60 Customer Web

# Stage 1: Build the React + Vite static bundle
FROM node:20-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy root workspace configurations
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./

# Copy shared packages
COPY packages/ ./packages/

# Copy customer-web application
COPY apps/customer-web/ ./apps/customer-web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared packages and customer-web
RUN pnpm --filter @buildora/types build || true
RUN pnpm --filter @buildora/constants build || true
RUN pnpm --filter @buildora/utils build || true
RUN pnpm --filter @buildora/customer-web build

# Stage 2: Serve with lightweight Nginx
FROM nginx:alpine

# Copy built static assets from builder stage
COPY --from=builder /app/apps/customer-web/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY apps/customer-web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
