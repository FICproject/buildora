# BUILDORA 60 — Environment Configuration Guide

## 1. Overview & Security Policy

This guide details all environment variables required to run, develop, and deploy the **BUILDORA 60** platform across local development, staging, and production environments.

> [!CAUTION]
> **Strict Security Warning**: Never commit actual database passwords, payment gateway secrets, SMS provider API tokens, or JWT signing secrets to version control. All values in this document and in `.env.example` templates must use placeholders only.

---

## 2. Root Environment Configuration (`/.env`)

The root `.env` file configures monorepo orchestration, port assignments, and shared service endpoints:

```env
# ========================================================
# BUILDORA 60 - Multi-Tenant Quick-Commerce SaaS Platform
# Root Environment Configuration (Template)
# ========================================================

# Environment Mode: 'development' | 'staging' | 'production'
NODE_ENV=development

# Service Port Assignments
APP_PORT_GATEWAY=8000
APP_PORT_API=3000
APP_PORT_WORKER=3001

# Web Application Ports
PORT_CUSTOMER_WEB=5173
PORT_VENDOR_WEB=5174
PORT_DELIVERY_WEB=5175
PORT_COMPANY_ADMIN_WEB=5176
PORT_PLATFORM_ADMIN_WEB=5177

# Multi-Tenancy & Platform Identity
PLATFORM_DEFAULT_TENANT_ID=tenant-buildora-blr
PLATFORM_DOMAIN=buildora.com

# Database (MongoDB Atlas)
# Replace <DB_USER> and <DB_PASSWORD> with your real MongoDB Atlas credentials
MONGODB_URI=mongodb+srv://<DB_USER>:<DB_PASSWORD>@<CLUSTER_HOST>/buildora60?retryWrites=true&w=majority
MONGODB_DATABASE=buildora60

# Redis Cache & Message Broker (Optional in local development)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# AWS Infrastructure (Production Media & PDF Test Certificates)
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=<AWS_ACCESS_KEY_PLACEHOLDER>
AWS_SECRET_ACCESS_KEY=<AWS_SECRET_KEY_PLACEHOLDER>
AWS_S3_BUCKET_ASSETS=buildora-assets-prod
```

---

## 3. Backend API Environment Configuration (`services/backend/api/.env`)

Located at [services/backend/api/.env](file:///e:/Moorthy%20Project/Buildora/services/backend/api/.env):

```env
# Server Port
PORT=3000
NODE_ENV=development

# MongoDB Atlas Connection
# Replace <DB_USER> and <DB_PASSWORD> with actual Atlas database user credentials
MONGODB_URI=mongodb+srv://<DB_USER>:<DB_PASSWORD>@cluster0.eucyu5w.mongodb.net/buildora60?retryWrites=true&w=majority
MONGODB_DATABASE=buildora60

# JWT Authentication
JWT_SECRET=<SECURE_RANDOM_256BIT_SECRET_KEY>
JWT_EXPIRES_IN=7d

# Multi-Tenant Default
DEFAULT_TENANT_ID=tenant-buildora-blr

# Payment Gateway (Razorpay / Cashfree)
RAZORPAY_KEY_ID=<RAZORPAY_TEST_KEY_ID>
RAZORPAY_KEY_SECRET=<RAZORPAY_TEST_KEY_SECRET>

# SMS OTP Gateway (Twilio / MSG91)
SMS_GATEWAY_API_KEY=<SMS_API_KEY_PLACEHOLDER>
SMS_SENDER_ID=BLDORA
```

---

## 4. Customer Website Environment Configuration (`apps/customer-web/.env`)

Located at [apps/customer-web/.env](file:///e:/Moorthy%20Project/Buildora/apps/customer-web/.env):

```env
# Backend API Base URL
VITE_API_URL=http://localhost:3000/api/v1

# Tenant Context
VITE_DEFAULT_TENANT_ID=tenant-buildora-blr

# Application Identity
VITE_APP_NAME="BUILDORA 60"
VITE_ENABLE_ANALYTICS=false

# Payment Public Key (Client-side Razorpay SDK)
VITE_RAZORPAY_KEY_ID=<RAZORPAY_PUBLIC_KEY_PLACEHOLDER>
```

---

## 5. Instructions for MongoDB Atlas Activation

To connect the application to your real MongoDB Atlas cluster:

1. Open your MongoDB Atlas dashboard at `https://cloud.mongodb.com/`.
2. Navigate to **Security $\rightarrow$ Database Access**.
3. Verify that the database user `ficitproject_db_user` exists and has `readWriteAnyDatabase` privileges.
4. If you have created or reset the password for this user, copy the password.
5. In your project root, open [/.env](file:///e:/Moorthy%20Project/Buildora/.env) and [services/backend/api/.env](file:///e:/Moorthy%20Project/Buildora/services/backend/api/.env).
6. Replace `YOUR_PASSWORD` in the `MONGODB_URI` string with your real password.
7. Restart the backend service (`pnpm --filter @buildora/backend-api start`).
8. The health endpoint (`http://localhost:3000/api/health`) will immediately transition from `DISCONNECTED` to `CONNECTED`.
