# BUILDORA 60 — REFERENCE GAP ANALYSIS & AUDIT REPORT

> **Reference Website:** [HomeRun (home-run.co)](https://home-run.co/)  
> **Target Application:** BUILDORA 60 Customer Website (`apps/customer-web`) & Backend API (`services/backend/api`)  
> **Date of Audit:** November 19, 2026  
> **Auditor:** Senior Full-Stack Developer, UI/UX Engineer, QA Engineer, E-Commerce Architect  

---

## 1. Executive Summary

A comprehensive, itemized audit of the current **BUILDORA 60 Customer Website** was conducted against the **HomeRun** quick-commerce model and our architectural requirements. While the core foundation (Vite build, Tailwind styling, Zustand state stores, and 28 master categories) is established, critical customer-facing gaps were identified in:
1. **Header Structure**: Lack of 2-row navigation with 5 clear construction departmental groupings; search history and keyboard accessibility need enhancement.
2. **Homepage Experience**: Missing countdown timers on flash deals, missing "Newly Launched Arrivals", missing "Trending Materials" section, missing "Delivery Benefits" 4-pillar trust grid, and missing "Project Procurement" banner.
3. **My Account Suite**: `/account` redirected directly to `/account/profile` instead of rendering a centralized customer dashboard; `/account/orders/:orderId` detail view and `/account/security` were absent.
4. **BUILDORA Wallet**: The frontend had a simple static display while the backend `services/backend/api/src/modules/wallet/` was empty (`.gitkeep` only), lacking an immutable ledger and API endpoints.
5. **Product Detail Experience**: Lacked an interactive zoom preview, return/replacement terms, product-specific FAQs, and bundle ("Frequently Bought Together") quick-add.
6. **Footer**: Missing the dedicated "Customer Account & Quick Links" column.

---

## 2. Detailed Gap Analysis Matrix

| Module | Reference Feature | BUILDORA Current Status | Missing / Incorrect | Required Correction | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Header (Row 1)** | Logo, Location Picker, Search Bar, Account, Wishlist, Cart | Single unified bar; basic location pill and search. | Search lacks recent search history dropdown; mobile header shrinks desktop layout rather than using dedicated mobile layout. | Implement dedicated 2-row desktop header: Row 1 with Logo, Location selector with ETA, Search with live history & suggestions, Wishlist counter, Account dropdown, and Cart drawer trigger. Dedicated mobile header. | **Needs UI Improvement** |
| **Header (Row 2)** | Category Navigation grouped by Department + Mega Menu | Single row with "All 28 Categories" button and a few flat links. | Lacks clear construction departmental grouping (Civil, Hardware, Electrical, Plumbing, Tools). Mega menu was a flat 28-item list without subcategory previews. | Group all 28 categories into 5 major construction departments: 1) Civil & Interiors, 2) Furniture & Architectural Hardware, 3) Electrical, 4) Plumbing & Bath, 5) Hardware & Appliances. Render interactive hover mega menu with subcategories. | **Needs UI Improvement** |
| **Homepage** | Comprehensive Hero, Flash Deals, New Launches, Best Sellers, Brand Grid, Estimators, Reviews | Hero banner, deals, categories, and testimonials present. | Missing Flash Deals countdown timer; missing Newly Launched Arrivals section; missing Trending Products section; missing dedicated 4-pillar Delivery Benefits grid; missing Project Procurement banner. | Rebuild Homepage with all 29 required sections: add countdown timer to Flash Deals, add New Arrivals carousel, add Trending Site Products, add 4-pillar trust grid, add Project Procurement showcase, add newsletter subscription. | **Needs UI Improvement** |
| **My Account Dashboard** | Centralized Customer Overview Portal (`/account`) | `/account` redirected straight to `/account/profile`. | No overview dashboard with profile summary, active orders card, wallet balance card, reward points, addresses preview, support shortcut. | Implement `AccountDashboardPage.tsx` at `/account` with full customer summary cards, active orders banner with direct tracking shortcut, wallet quick-actions, and project list. | **Missing** |
| **Order Management** | Order History, Order Details, Re-order, Return Request | Orders list at `/orders`; no dedicated itemized order detail page at `/account/orders/:orderId`. | Order details view missing; return/refund request action missing on delivered items; invoice download was a placeholder. | Implement comprehensive `OrderDetailView` supporting cancellation, live tracking shortcut, itemized invoice breakdown, and Return/Refund request modal. | **Partially Complete** |
| **BUILDORA Wallet** | Full Wallet with Ledger, Credits/Debits, Refunds, Cashbacks | Frontend `WalletPage.tsx` with static items; backend wallet module has only `.gitkeep`. | Backend `WalletController` missing; no transaction ledger API; no credit/debit validation; no refund processing endpoint. | Implement backend `WalletController` (`/api/v1/wallet/*`), stateful transaction ledger with immutable audit trail, filterable UI (All, Credits, Debits, Refunds), top-up flow, and transaction detail modal. | **Needs Business Logic** |
| **Category Navigation** | 28 Master Categories with subcategories and department mapping | All 28 categories in constants; category page exists. | Department mapping not structured in constants or header; category pages lacked subcategory quick-filter pills. | Export `CONSTRUCTION_DEPARTMENTS` mapping in `@buildora/constants`; add interactive subcategory chips on `CategoryPage.tsx` for seamless filtering. | **Needs UI Improvement** |
| **Product Listing** | Faceted filtering, Multi-sort, Grid/List view | Sidebar with price, category, brand, and rating filters exists. | Lacks clear active filter chips with one-click individual dismissal; pagination/infinite scroll UI indicator missing. | Add active filter pills above product grid with "Clear All" action, and add visual product count indicators. | **Needs UI Improvement** |
| **Product Detail** | Gallery + Zoom, Bulk Tiers, Specs, FAQs, Bundle Add, Return Info | Images, specs table, bulk tiers, and applications present. | Missing interactive image zoom; missing product FAQs; missing return & replacement policy info box; missing "Frequently Bought Together" bundle add-to-cart. | Add image zoom hover, product FAQ accordion, return & site unloading policy card, and 1-click bundle add on `ProductDetailPage.tsx`. | **Needs UI Improvement** |
| **Authentication Flow** | OTP Login, Register, Session Management, Guest Cart Merge | Simulated OTP in `useAuthStore` with modal. | Logging in did not merge guest cart items with user account; header account link did not redirect intelligently based on auth status. | Enhance `useAuthStore` and `Header.tsx`: smart redirect to `/account` when logged in, open Auth modal when guest, and preserve cart contents during login. | **Needs Business Logic** |
| **Footer & Legal** | Complete 4-column footer with Company, Policies, Shopping, Customer Care | 3 columns present; missing dedicated "Customer Account & Support" column. | Links to My Account, My Orders, Track Order, Wallet, and Support were missing from footer navigation. | Update `Footer.tsx` to include dedicated "Customer Account" section with active links to all account routes; eliminate any potential 404 links. | **Needs UI Improvement** |
| **Backend REST API** | Full modular monolith for Catalogue, Cart, Orders, Wallet, Support | Catalogue, Products, Cart, Orders, Support controllers implemented. | `WalletController` missing; `CustomerController` missing; wallet transactions not persisted in `dbStore`. | Implement `WalletController` and `CustomerController` in NestJS backend; register in `app.module.ts`; add stateful wallet transaction ledger to `dbStore`. | **Needs Business Logic** |

---

## 3. Prioritized Action Plan

1. **Step 1: Departmental Constants & Backend Wallet API**:
   - Define the 5 Construction Departments in `@buildora/constants`.
   - Implement `WalletController` and `CustomerController` in `services/backend/api`.
   - Register them in `app.module.ts` and add wallet ledger collections to `dbStore`.
2. **Step 2: Header & Mega Menu Rebuild**:
   - Build 2-row Desktop Header (Row 1: Logo, Location, Search with history & suggestions, Wishlist, Account, Cart; Row 2: 5 Construction Departments + All 28 Categories Mega Menu).
   - Build dedicated Mobile Header with slide-out drawer, department tabs, and account shortcuts.
3. **Step 3: Complete My Account Suite**:
   - Create `AccountDashboardPage.tsx` at `/account`.
   - Implement Order Details view with Return/Refund request flow at `/account/orders/:orderId`.
   - Implement `/account/security` for password/PIN and active sessions.
   - Update `CustomerAccountLayout.tsx` with all 11 working routes.
4. **Step 4: BUILDORA Wallet Enhancement**:
   - Connect `WalletPage.tsx` to backend wallet ledger API.
   - Add transaction filters (All, Credits, Debits, Refunds), transaction detail modal, and live top-up.
5. **Step 5: Homepage Refinement**:
   - Add Flash Deals countdown timer.
   - Add Newly Launched Arrivals and Trending Site Products sections.
   - Add 4-pillar Delivery Benefits trust grid.
   - Add Project Procurement banner and newsletter subscription banner.
6. **Step 6: Product Detail & Listing Upgrades**:
   - Add FAQs accordion, Return & site unloading policy card, and Bundle add-to-cart on `ProductDetailPage.tsx`.
   - Add subcategory chips and active filter dismissal on `ProductListingPage.tsx` and `CategoryPage.tsx`.
7. **Step 7: Footer & Information Pages**:
   - Add Customer Account column to `Footer.tsx`.
8. **Step 8: Automated Verification & Audit Report**:
   - Run production builds (`customer-web` & `backend-api`).
   - Run business logic test suite.
   - Generate `CORRECTION-IMPLEMENTATION-REPORT.md` and `FINAL-CUSTOMER-WEBSITE-AUDIT.md`.
