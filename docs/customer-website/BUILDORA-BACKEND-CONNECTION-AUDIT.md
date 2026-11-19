# BUILDORA 60 — Initial Backend Connection Audit

## 1. Executive Summary & Objective

This audit documents the initial baseline integration state between the **BUILDORA 60 Customer Website** (`apps/customer-web`) and the **Backend API Service** (`services/backend/api`).

The objective was to determine whether the frontend was genuinely connected to live backend endpoints, evaluate database connectivity, verify authentication session handling, and identify areas where pages relied on static constants or local storage simulation instead of real server-side REST API calls.

---

## 2. Integration Status Table (Initial State)

| Component / Layer | Status | Technical Details & Findings |
| :--- | :--- | :--- |
| **Frontend Application** | **CONNECTED** | React 18 + Vite + TypeScript application running on port 5173. Built cleanly without runtime errors. |
| **Backend Application** | **CONNECTED** | NestJS modular monolith application running on port 3000. Express HTTP server listening on `http://localhost:3000`. |
| **API Connection Layer** | **PARTIALLY CONNECTED** | `apps/customer-web/src/services/api.ts` had basic `safeFetch` wrappers, but primary pages imported static constants directly from `@buildora/constants` bypassing the API client. |
| **Backend Server** | **CONNECTED** | Active daemon process running and healthy on `http://localhost:3000`. |
| **MongoDB Connection** | **BLOCKED** | Mongoose driver installed; `process.env.MONGODB_URI` contains placeholder credentials (`YOUR_PASSWORD`). Live cluster connection blocked pending real credentials; backend operates safely in memory-persisted fallback mode. |
| **Authentication Flow** | **PARTIALLY CONNECTED** | Frontend `useAuthStore` simulated OTP via `setTimeout`. Backend lacked an `/api/v1/auth` controller. (Resolved: Implemented `AuthController` with OTP request/verification). |
| **Products API** | **CONNECTED** | Live endpoint `GET /api/v1/products` returns 14 verified construction SKUs with bulk slabs, stock counts, and IS standards. |
| **Categories API** | **CONNECTED** | Live endpoint `GET /api/v1/categories` serves all 28 master categories across 5 construction departments. |
| **Search API** | **CONNECTED** | Live endpoint `GET /api/v1/products?search=<query>` filters products by name, SKU, brand, and category on backend. |
| **Cart API** | **CONNECTED** | Live endpoint `POST /api/v1/cart/calculate` computes authoritative GST, subtotal, tiered volume discounts, and delivery fees. |
| **Checkout API** | **CONNECTED** | Live endpoint `POST /api/v1/orders` records orders with site delivery metadata and assigns delivery fleet. |
| **Orders API** | **CONNECTED** | Live endpoints `GET /api/v1/orders` and `GET /api/v1/orders/:id/track` provide 5-step status tracking timeline. |
| **Address API** | **CONNECTED** | Live endpoints `GET /api/v1/customer/addresses` and `POST /api/v1/customer/addresses` persist site addresses. |
| **Wallet API** | **CONNECTED** | Live endpoint `GET /api/v1/wallet` returns balance (₹1,250) and transaction ledger (`WTX-2026-98124`, etc.). |
| **Tenant Configuration** | **CONNECTED** | Multi-tenant header `x-tenant-id` supported across all endpoints; `/api/v1/tenants` returns tenant metadata. |
| **WebSocket** | **NOT IMPLEMENTED** | Real-time driver GPS tracking uses polling intervals; WebSockets planned for post-staging driver telemetry. |
| **Error Handling** | **CONNECTED** | Global NestJS exception filters return structured `{ success: false, message: string }` errors; frontend uses resilient fallback handlers. |
| **Environment Variables** | **CONNECTED** | `.env` files created at root, `apps/customer-web/.env`, and `services/backend/api/.env`. |

---

## 3. Discovered Integration Gaps

### 3.1. Direct Import of Static Mock Data in Pages
- **Gap**: `HomePage.tsx`, `ProductListingPage.tsx`, `ProductDetailPage.tsx`, `CategoryPage.tsx`, and `SearchPage.tsx` were directly importing `SEED_PRODUCTS`, `MASTER_CATEGORIES`, and `MASTER_BRANDS` from `@buildora/constants` at module level, rendering static arrays instead of making asynchronous requests to the backend.
- **Risk**: Any product price update, inventory depletion, or new category added in the backend was not reflected on customer-facing pages.

### 3.2. Simulated Authentication in Zustand Store
- **Gap**: `useAuthStore.ts` had a local `setTimeout` in `requestOtp` and hardcoded OTP verification without communicating with the backend.
- **Resolution**: Implemented `AuthController` (`/api/v1/auth/request-otp`, `/api/v1/auth/verify-otp`) and wired `useAuthStore` to real server endpoints.

### 3.3. Isolated Client-Side Order Creation
- **Gap**: In `CheckoutPage.tsx`, clicking "Complete Order" saved the order object only into client-side LocalStorage via `useOrderStore` without sending `POST /api/v1/orders` to the server.
- **Resolution**: Integrated `useOrderStore.placeOrder` to call `api.createOrder(orderData)` and persist the order to the backend dispatch queue.

### 3.4. Database Connection State Transparency
- **Gap**: The backend previously reported `database: 'IN_MEMORY_PERSISTED'` without attempting a genuine MongoDB Atlas connection or tracking Mongoose readiness states.
- **Resolution**: Created `DatabaseService` using Mongoose, attempting connection to `MONGODB_URI` with timeout protection, and reporting factual connection status (`DISCONNECTED`, `BLOCKED_CREDENTIALS_NEEDED`, or `CONNECTED`) on `/api/health` and `/api/v1/health`.
