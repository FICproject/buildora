# BUILDORA 60 — Global Navigation Scroll Position Bug Audit

**System:** BUILDORA 60 — Customer Web Storefront (`apps/customer-web`)  
**Auditor:** Senior React Frontend Engineer & QA Debugging Specialist  
**Status:** Audit Completed & Root Causes Documented  

---

## 1. Executive Summary

A comprehensive audit was performed across the entire BUILDORA 60 customer storefront to investigate and diagnose the issue where navigating to different pages resulted in destination pages opening at the bottom or retaining a previously scrolled position.

The audit verified that **every single route** across the storefront was affected. This was caused by the fundamental behavior of client-side single-page application (SPA) routing in React Router v6 in the complete absence of a global scroll restoration or scroll-to-top mechanism.

---

## 2. Full Route & Layout Architecture Audit

### 2.1 Top-Level Layouts & Route Trees
The customer application is organized into three distinct layout trees in `apps/customer-web/src/routes/index.tsx`:

1. **`PublicStoreLayout` (`path: '/'`)**
   - Contains Header (`<Header />`), main content area (`<Outlet />`), and Footer (`<Footer />`).
   - Hosts all public storefront pages, catalogs, tools, policies, and static pages.
2. **`CheckoutLayout` (`path: '/checkout'`)**
   - Contains focused minimal checkout header, main step outlet, and secure payment footer.
   - Hosts the multi-step checkout workflow (`CheckoutPage`).
3. **`CustomerAccountLayout` (`path: '/account'`)**
   - Contains Header, sticky desktop account sidebar (`<aside>`), mobile horizontal tab bar, and nested content `<Outlet />`.
   - Hosts all authenticated customer account management pages.
4. **Legacy Direct Routes (`path: '/orders'`, `'/projects'`, `'/support'`):**
   - Forward compatibility aliases that render within `CustomerAccountLayout`.

---

### 2.2 Comprehensive Route Inventory & Impact Matrix

Every route registered in `apps/customer-web/src/routes/index.tsx` was audited:

| # | Route Path | Component | Layout | Page Height Type | Bug Symptoms Before Fix |
|---|---|---|---|---|---|
| 1 | `/` | `HomePage` | `PublicStoreLayout` | Long (~4500px) | Navigating to shorter pages clamped scroll to bottom |
| 2 | `/products` | `ProductListingPage` | `PublicStoreLayout` | Dynamic (~3000px) | Retained scroll from previous page |
| 3 | `/products/:slug` | `ProductDetailPage` | `PublicStoreLayout` | Dynamic (~2800px) | Opening related products kept scroll at bottom (2500px) |
| 4 | `/categories/:slug` | `CategoryPage` | `PublicStoreLayout` | Dynamic (~2400px) | Swapping categories retained previous scroll |
| 5 | `/categories/:slug/:subcategorySlug` | `CategoryPage` | `PublicStoreLayout` | Dynamic (~2200px) | Swapping subcategories retained previous scroll |
| 6 | `/search` | `SearchPage` | `PublicStoreLayout` | Dynamic | Clicking search result opened PDP scrolled down |
| 7 | `/brands` | `BrandsPage` | `PublicStoreLayout` | Medium (~1800px) | Retained previous scroll |
| 8 | `/brands/:slug` | `BrandsPage` | `PublicStoreLayout` | Medium (~1800px) | Retained previous scroll |
| 9 | `/deals` | `DealsPage` | `PublicStoreLayout` | Medium (~1600px) | Retained previous scroll |
| 10 | `/offers` | `DealsPage` | `PublicStoreLayout` | Medium (~1600px) | Retained previous scroll |
| 11 | `/bulk-orders` | `BulkOrdersPage` | `PublicStoreLayout` | Short (~1200px) | Clamped to bottom if coming from scrolled page |
| 12 | `/price-lists` | `BulkOrdersPage` | `PublicStoreLayout` | Short (~1200px) | Clamped to bottom if coming from scrolled page |
| 13 | `/cart` | `CartPage` | `PublicStoreLayout` | Medium (~1400px) | Clicking Cart in header while scrolled opened Cart at bottom |
| 14 | `/wishlist` | `WishlistPage` | `PublicStoreLayout` | Medium (~1200px) | Retained previous scroll |
| 15 | `/compare` | `ComparePage` | `PublicStoreLayout` | Medium (~1600px) | Retained previous scroll |
| 16 | `/tools/material-estimator` | `MaterialEstimatorPage` | `PublicStoreLayout` | Long (~3200px) | Retained previous scroll |
| 17 | `/estimator` | `MaterialEstimatorPage` | `PublicStoreLayout` | Long (~3200px) | Retained previous scroll |
| 18 | `/knowledge-hub` | `KnowledgeHubPage` | `PublicStoreLayout` | Medium (~1800px) | Retained previous scroll |
| 19 | `/knowledge-hub/:slug` | `KnowledgeHubPage` | `PublicStoreLayout` | Medium (~1800px) | Retained previous scroll |
| 20 | `/orders/:orderId/track` | `OrderTrackingPage` | `PublicStoreLayout` | Medium (~1400px) | Retained previous scroll |
| 21 | `/about` | `AboutPage` | `PublicStoreLayout` | Short (~1000px) | **Severe:** Clamped immediately to bottom footer |
| 22 | `/contact` | `ContactPage` | `PublicStoreLayout` | Short (~1100px) | **Severe:** Clamped immediately to bottom footer |
| 23 | `/faq` | `FaqPage` | `PublicStoreLayout` | Short (~1300px) | **Severe:** Clamped immediately to bottom footer |
| 24 | `/shipping-policy` | `PolicyPage` | `PublicStoreLayout` | Short (~900px) | **Severe:** Clamped immediately to bottom footer |
| 25 | `/return-policy` | `PolicyPage` | `PublicStoreLayout` | Short (~900px) | **Severe:** Clamped immediately to bottom footer |
| 26 | `/refund-policy` | `PolicyPage` | `PublicStoreLayout` | Short (~900px) | **Severe:** Clamped immediately to bottom footer |
| 27 | `/cancellation-policy` | `PolicyPage` | `PublicStoreLayout` | Short (~900px) | **Severe:** Clamped immediately to bottom footer |
| 28 | `/privacy-policy` | `PolicyPage` | `PublicStoreLayout` | Short (~900px) | **Severe:** Clamped immediately to bottom footer |
| 29 | `/terms-and-conditions` | `PolicyPage` | `PublicStoreLayout` | Short (~900px) | **Severe:** Clamped immediately to bottom footer |
| 30 | `/payment-information` | `PolicyPage` | `PublicStoreLayout` | Short (~900px) | **Severe:** Clamped immediately to bottom footer |
| 31 | `/serviceability` | `PolicyPage` | `PublicStoreLayout` | Short (~900px) | **Severe:** Clamped immediately to bottom footer |
| 32 | `*` | `NotFoundPage` | `PublicStoreLayout` | Short (~600px) | Clamped to bottom |
| 33 | `/checkout` | `CheckoutPage` | `CheckoutLayout` | Medium (~1600px) | Retained scroll from Cart |
| 34 | `/account` | `AccountDashboardPage` | `CustomerAccountLayout` | Medium (~1500px) | Retained previous scroll |
| 35 | `/account/profile` | `ProfilePage` | `CustomerAccountLayout` | Medium (~1400px) | Switching from Orders opened Profile scrolled down |
| 36 | `/account/orders` | `OrdersPage` | `CustomerAccountLayout` | Long (~2600px) | Retained previous scroll |
| 37 | `/account/orders/:orderId` | `OrdersPage` | `CustomerAccountLayout` | Medium (~1600px) | Clicking order item opened detail view scrolled down |
| 38 | `/account/addresses` | `AddressesPage` | `CustomerAccountLayout` | Medium (~1400px) | Retained previous scroll |
| 39 | `/account/wallet` | `WalletPage` | `CustomerAccountLayout` | Long (~2200px) | Retained previous scroll |
| 40 | `/account/rewards` | `RewardsPage` | `CustomerAccountLayout` | Medium (~1400px) | Retained previous scroll |
| 41 | `/account/projects` | `ProjectsPage` | `CustomerAccountLayout` | Medium (~1600px) | Retained previous scroll |
| 42 | `/account/support` | `SupportPage` | `CustomerAccountLayout` | Medium (~1500px) | Retained previous scroll |
| 43 | `/account/security` | `SecurityPage` | `CustomerAccountLayout` | Short (~1000px) | Retained previous scroll |

---

## 3. Root Cause Investigation

### Root Cause 1: Absence of Client-Side Scroll Management in SPA
- Unlike traditional multi-page websites where the browser executes a full HTML page reload and naturally resets `window.scrollY = 0`, client-side React Router replaces components within an existing DOM tree.
- The window viewport retains its exact scroll coordinates (`window.scrollY`, `document.documentElement.scrollTop`).
- When a user on `HomePage` at `window.scrollY = 3500px` clicks any navigation element to a page whose height is only `1000px` (such as `/about` or `/shipping-policy`), the browser clamps `window.scrollY` to the maximum height `1000px`. The user perceives that the page "opened at the bottom."

### Root Cause 2: Sibling Top-Level Layout Route Structure
- In `routes/index.tsx`, `PublicStoreLayout`, `CheckoutLayout`, and `CustomerAccountLayout` were sibling top-level routes under `createBrowserRouter`.
- There was no top-level `<RootLayout>` wrapping the route hierarchy.
- React Router's official `<ScrollRestoration />` was completely omitted.

### Root Cause 3: Nested Route Swapping inside `CustomerAccountLayout`
- In `CustomerAccountLayout`, the account sidebar is sticky (`sticky top-28`).
- Clicking sidebar links (`/account/orders` -> `/account/profile`) unmounts and mounts child components inside `<Outlet />`.
- Because the outer layout never unmounts, the window scroll position remained frozen at whatever position the previous tab had reached.

### Root Cause 4: Dynamic Parameter Route Reuse (`ProductDetailPage` & `CategoryPage`)
- In `ProductDetailPage`, clicking a related product at the bottom of the page (`scrollY = 2400px`) navigates to `/products/:slug`.
- The `ProductDetailPage` component remains mounted; only the `:slug` param changes and an async fetch (`api.getProductBySlug`) runs.
- Without a route-change scroll reset, the user remains looking at the related products at the bottom of the page, completely unaware that the new product loaded above.

### Root Cause 5: Asynchronous Data Hydration & Layout Race Conditions
- In React 18 with concurrent rendering, components mount with initial empty or skeleton states before data arrives.
- If a scroll reset is fired synchronously only once before content paints or during layout shifts, browser layout recalculations can restore stale scroll offsets.
- A multi-frame `requestAnimationFrame` enforcement is required to guarantee the scroll position is pinned at `(0, 0)`.
