# BUILDORA 60 — API Integration & Implementation Report

## 1. Executive Summary

This report outlines the end-to-end integration implemented between the **BUILDORA 60 Customer Website** (`apps/customer-web`) and the **Backend API Service** (`services/backend/api`).

All customer-facing modules have been refactored from static module imports to asynchronous REST API consumers powered by a centralized, typed API client with multi-tenant headers, Bearer token authentication, and resilient offline fallbacks.

---

## 2. Inventory of Connected APIs & Modules

### 2.1. Authentication & Session Module
- **Endpoints Connected**:
  - `POST /api/v1/auth/request-otp` — Validates 10-digit Indian mobile number and issues OTP.
  - `POST /api/v1/auth/verify-otp` — Verifies OTP (with test OTP `6060` in dev mode), generates JWT session token, and hydrates contractor customer profile.
  - `GET /api/v1/auth/session` — Resolves authenticated user profile from Bearer token header.
  - `POST /api/v1/auth/logout` — Revokes active session.
- **Frontend Integration**: [useAuthStore.ts](file:///e:/Moorthy%20Project/Buildora/apps/customer-web/src/store/useAuthStore.ts) connected to `api.requestOtp` and `api.verifyOtp`.

### 2.2. Product Catalogue & Taxonomy Module
- **Endpoints Connected**:
  - `GET /api/v1/categories` — Delivers all 28 master categories across 5 construction departments.
  - `GET /api/v1/brands` — Delivers 10 authorized premier construction brands (UltraTech, Astral, Havells, Pidilite, etc.).
  - `GET /api/v1/products` — Delivers verified SKU catalog with query parameters (`category`, `subcategory`, `brand`, `search`).
  - `GET /api/v1/products/:slug` — Resolves single product details, variants, bulk tier pricing slabs, and IS technical certifications.
- **Frontend Integration**:
  - [HomePage.tsx](file:///e:/Moorthy%20Project/Buildora/apps/customer-web/src/pages/HomePage.tsx) — Fetches live categories, brands, deals of the day, and best sellers on mount.
  - [ProductListingPage.tsx](file:///e:/Moorthy%20Project/Buildora/apps/customer-web/src/pages/ProductListingPage.tsx) — Re-fetches catalog from backend whenever category, brand, or search filters change.
  - [ProductDetailPage.tsx](file:///e:/Moorthy%20Project/Buildora/apps/customer-web/src/pages/ProductDetailPage.tsx) — Fetches live product data and specifications on route slug navigation.
  - [CategoryPage.tsx](file:///e:/Moorthy%20Project/Buildora/apps/customer-web/src/pages/CategoryPage.tsx) — Loads department categories and filtered product slices from backend.
  - [SearchPage.tsx](file:///e:/Moorthy%20Project/Buildora/apps/customer-web/src/pages/SearchPage.tsx) & [SmartSearchBar.tsx](file:///e:/Moorthy%20Project/Buildora/apps/customer-web/src/components/common/SmartSearchBar.tsx) — Fetches matching search results from backend API.

### 2.3. Cart, Calculation & Pricing Module
- **Endpoints Connected**:
  - `POST /api/v1/cart/calculate` — Authoritative server-side calculation of order subtotal, item discounts, tiered volume bulk discounts (3%, 5%, 8%), coupon code validations (`BUILD60`), GST distribution, and delivery charges.
  - `GET /api/v1/serviceability/check?pincode=...` — Real-time dark store routing and delivery ETA calculation (e.g., 560038 $\rightarrow$ Indiranagar WH-BLR-01, 60 mins).
- **Frontend Integration**: [useCartStore.ts](file:///e:/Moorthy%20Project/Buildora/apps/customer-web/src/store/useCartStore.ts) connected to `api.calculateCart`.

### 2.4. Orders & Fulfillment Module
- **Endpoints Connected**:
  - `GET /api/v1/orders` — Retrieves authenticated contractor's order history.
  - `GET /api/v1/orders/:idOrNumber` — Retrieves full order invoice and breakdown.
  - `GET /api/v1/orders/:idOrNumber/track` — Returns live 5-step order timeline, driver contact, vehicle type, and estimated arrival time.
  - `POST /api/v1/orders` — Creates order record on backend with construction site delivery address metadata.
  - `POST /api/v1/orders/:id/cancel` — Cancels order and initiates wallet refund.
  - `POST /api/v1/orders/:id/return` — Submits site material return / replacement request.
- **Frontend Integration**: [useOrderStore.ts](file:///e:/Moorthy%20Project/Buildora/apps/customer-web/src/store/useOrderStore.ts) and [CheckoutPage.tsx](file:///e:/Moorthy%20Project/Buildora/apps/customer-web/src/pages/CheckoutPage.tsx) execute `await placeOrder(orderData)` which dispatches `POST /api/v1/orders`.

### 2.5. Customer Profile & Address Book Module
- **Endpoints Connected**:
  - `GET /api/v1/customer/profile` — Retrieves contractor business details, GSTIN, and loyalty reward points.
  - `PUT /api/v1/customer/profile` — Updates customer profile.
  - `GET /api/v1/customer/addresses` — Retrieves saved construction site delivery addresses.
  - `POST /api/v1/customer/addresses` — Creates new site address with site supervisor contact, gate instructions, and offloading requirements.
  - `DELETE /api/v1/customer/addresses/:id` — Removes saved site address.
- **Frontend Integration**: [useAuthStore.ts](file:///e:/Moorthy%20Project/Buildora/apps/customer-web/src/store/useAuthStore.ts) synchronized with backend address and profile endpoints.

### 2.6. Contractor Wallet Module
- **Endpoints Connected**:
  - `GET /api/v1/wallet` — Retrieves current wallet balance (₹1,250) and currency metadata.
  - `GET /api/v1/wallet/transactions` — Retrieves complete credit/debit transaction ledger.
  - `POST /api/v1/wallet/topup` — Simulates instant UPI top-up.
- **Frontend Integration**: [WalletPage.tsx](file:///e:/Moorthy%20Project/Buildora/apps/customer-web/src/pages/WalletPage.tsx) fetches ledger on mount.

### 2.7. Health & Multi-Tenant Diagnostics Module
- **Endpoints Connected**:
  - `GET /api/health` — Unversioned root health check returning database status, driver info, and warehouse status.
  - `GET /api/v1/health` — Versioned health check.
  - `GET /api/v1/tenants` — Returns active tenants and warehouse mappings.
  - `GET /api/v1/tenants/:slug` — Returns tenant theme tokens and active features.

---

## 3. Retained Fallbacks vs Removed False Mocks

| Area | Prior Mock State | New Integrated State | Architectural Rationale |
| :--- | :--- | :--- | :--- |
| **Product Listings** | Read `SEED_PRODUCTS` constant only | Asynchronously fetched via `api.getProducts()` | Server is now the single source of truth for stock, price, and active deals. Constants retained strictly as initial state to prevent flash of empty content. |
| **Authentication** | `setTimeout` with dummy user object | `POST /api/v1/auth/verify-otp` with JWT issuance | Enforces server-side authentication; token stored in client LocalStorage and attached to subsequent request headers. |
| **Order Placement** | Saved into LocalStorage store only | Dispatched to `POST /api/v1/orders` on backend | Server validates inventory, records order timeline, assigns driver fleet, and registers dispatch queue. |
| **Cart Pricing** | Evaluated purely in client JavaScript | Shared calculation validated via `POST /api/v1/cart/calculate` | Eliminates tampering vulnerability; ensures server-authoritative discount and GST computation. |

---

## 4. Modified & New Files

| File Path | Action | Role & Changes |
| :--- | :--- | :--- |
| [services/backend/api/src/database/database.service.ts](file:///e:/Moorthy%20Project/Buildora/services/backend/api/src/database/database.service.ts) | **NEW** | Mongoose connection service with connection retry, status tracking, and graceful fallback |
| [services/backend/api/src/modules/auth/controllers/auth.controller.ts](file:///e:/Moorthy%20Project/Buildora/services/backend/api/src/modules/auth/controllers/auth.controller.ts) | **NEW** | OTP authentication endpoints (`request-otp`, `verify-otp`, `session`, `logout`) |
| [services/backend/api/src/app.controller.ts](file:///e:/Moorthy%20Project/Buildora/services/backend/api/src/app.controller.ts) | **UPDATED** | `/api/health` and `/api/v1/health` reporting database readiness and warehouse health |
| [services/backend/api/src/app.module.ts](file:///e:/Moorthy%20Project/Buildora/services/backend/api/src/app.module.ts) | **UPDATED** | Registered `DatabaseService` and `AuthController` |
| [services/backend/api/src/modules/cart/controllers/cart.controller.ts](file:///e:/Moorthy%20Project/Buildora/services/backend/api/src/modules/cart/controllers/cart.controller.ts) | **UPDATED** | Robust coupon resolution and cart calculation handling |
| [apps/customer-web/src/services/api.ts](file:///e:/Moorthy%20Project/Buildora/apps/customer-web/src/services/api.ts) | **UPDATED** | Centralized, typed API client with `x-tenant-id`, JWT auth headers, and resilient fallbacks |
| [apps/customer-web/src/store/useAuthStore.ts](file:///e:/Moorthy%20Project/Buildora/apps/customer-web/src/store/useAuthStore.ts) | **UPDATED** | Wired to backend OTP endpoints and profile APIs |
| [apps/customer-web/src/store/useOrderStore.ts](file:///e:/Moorthy%20Project/Buildora/apps/customer-web/src/store/useOrderStore.ts) | **UPDATED** | Dispatches `createOrder` to backend API and syncs order history |
| [apps/customer-web/src/store/useCartStore.ts](file:///e:/Moorthy%20Project/Buildora/apps/customer-web/src/store/useCartStore.ts) | **UPDATED** | Added `syncWithBackend` calling `POST /api/v1/cart/calculate` |
| [apps/customer-web/src/pages/HomePage.tsx](file:///e:/Moorthy%20Project/Buildora/apps/customer-web/src/pages/HomePage.tsx) | **UPDATED** | Fetches products, categories, and brands from live backend endpoints on mount |
| [apps/customer-web/src/pages/ProductListingPage.tsx](file:///e:/Moorthy%20Project/Buildora/apps/customer-web/src/pages/ProductListingPage.tsx) | **UPDATED** | Fetches filtered catalog from backend API when filters change |
| [apps/customer-web/src/pages/ProductDetailPage.tsx](file:///e:/Moorthy%20Project/Buildora/apps/customer-web/src/pages/ProductDetailPage.tsx) | **UPDATED** | Fetches product specifications from backend API on slug navigation |
| [apps/customer-web/src/pages/CategoryPage.tsx](file:///e:/Moorthy%20Project/Buildora/apps/customer-web/src/pages/CategoryPage.tsx) | **UPDATED** | Fetches category and products from backend API |
| [apps/customer-web/src/pages/SearchPage.tsx](file:///e:/Moorthy%20Project/Buildora/apps/customer-web/src/pages/SearchPage.tsx) | **UPDATED** | Queries products API with search term |
| [apps/customer-web/src/pages/CheckoutPage.tsx](file:///e:/Moorthy%20Project/Buildora/apps/customer-web/src/pages/CheckoutPage.tsx) | **UPDATED** | Executes asynchronous backend order creation |
| [apps/customer-web/src/pages/WalletPage.tsx](file:///e:/Moorthy%20Project/Buildora/apps/customer-web/src/pages/WalletPage.tsx) | **UPDATED** | Syncs wallet ledger from backend API on mount |
| [apps/customer-web/src/components/common/SmartSearchBar.tsx](file:///e:/Moorthy%20Project/Buildora/apps/customer-web/src/components/common/SmartSearchBar.tsx) | **UPDATED** | Uses live product catalog for search previews and new launches carousel |
| [tools/scripts/verify-integration.ts](file:///e:/Moorthy%20Project/Buildora/tools/scripts/verify-integration.ts) | **NEW** | Automated 12-point live integration audit script |
