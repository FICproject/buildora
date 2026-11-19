# BUILDORA 60 vs HomeRun — Full Gap Analysis & Benchmark Report

## 1. Executive Summary & Benchmark Overview

This document provides a rigorous gap analysis and architectural benchmark between **HomeRun** (the reference platform at `https://home-run.co/`) and **BUILDORA 60** (a multi-tenant, white-label construction materials quick-commerce SaaS platform).

While HomeRun demonstrates consumer-friendly e-commerce patterns for residential construction and DIY repairs, it exhibits notable structural weaknesses: client-side pricing calculations, inconsistent delivery fee thresholds across pages, lack of multi-tenant white-label isolation, and absence of civil engineering intelligence. BUILDORA 60 addresses these weaknesses by implementing an authoritative server-side calculation engine, dark store logistics routing, civil engineering material estimators, and multi-tenant SaaS architecture.

---

## 2. Platform Comparison Matrix

| Capability Domain | HomeRun Benchmark (`home-run.co`) | BUILDORA 60 Implementation | Analysis & Gap Resolution Status | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **Catalog Taxonomy** | Generic hardware & fixtures, superficial categorization | 5 Construction Departments covering 28 specialized heavy civil & finishing categories | **BUILDORA Superior**: Full taxonomy with standard units (bags, tons, brass, sq.ft, sheets). | P0 |
| **Delivery Model** | Scheduled or generic slot delivery; fee discrepancies across pages | Guaranteed 60-Minute Site Delivery (`ASAP_60`) + Scheduled Slots (`SCHEDULED_SLOT`) + Bulk Truckload (`BULK_CARGO`) | **BUILDORA Superior**: Tiered delivery rules: Subtotal $\ge ₹1,999$ gets Free Delivery; $< ₹1,999$ incurs ₹149. | P0 |
| **Pricing & Discount Engine** | Flat retail pricing; minimal bulk incentives | Authoritative server-side Tiered Volume Discounts (20–49 units: 3%, 50–99: 5%, 100+: 8%) | **BUILDORA Superior**: Calculations locked on backend (`validateOrderCalculation`). | P0 |
| **Search Experience** | Basic text search with static dropdown | Sequential animated search input, desktop discovery panel, mobile full-screen overlay, category pills, new launches carousel | **BUILDORA Superior**: High discoverability on mobile and desktop without viewport clipping. | P0 |
| **Site Delivery Logistics** | Standard residential delivery address fields | Dedicated Construction Site metadata (Site Name, Supervisor Contact, Gate/Tower, Offloading Forklift/Crane Needs) | **BUILDORA Superior**: Purpose-built for commercial job sites and contractors. | P0 |
| **Payment Options** | Card / Netbanking / Generic COD | Online UPI/Cards + COD (with OTP verification) + Wallet Balance + Split Payment + B2B Credit Terms | **BUILDORA Superior**: Mitigates high-value site delivery fraud via COD OTP verification. | P0 |
| **Civil Estimators** | None | 5 Civil Engineering Calculators (Concrete M20/M25, Interior/Exterior Paint, Floor Tiling, Waterproofing, Plywood/Carpentry) | **BUILDORA Unique Value**: Direct 1-click "Add Required Materials to Cart". | P2 |
| **Customer Retention** | Basic account profile | Built-in Wallet, Tiered Contractor Rewards, Project Material Lists, 1-Click Reorder | **BUILDORA Complete**: Fosters recurring contractor procurement cycles. | P1 |
| **Multi-Tenant SaaS** | Single-tenant proprietary store | Strict multi-tenant isolation with `x-tenant-id`, dynamic tenant branding, isolated inventory | **BUILDORA Superior**: Scalable white-label B2B/B2C SaaS platform. | P0 |

---

## 3. Detailed Gap Analysis by Functional Area

### 3.1. Homepage & Catalog Discovery
- **Reference Observation**: HomeRun uses prominent banner carousels and top-level tiles. However, category navigation on small mobile screens suffers from horizontal compression and lacks visual hierarchy.
- **BUILDORA Gap Identified**: Early versions had squeezed 4-column category grids on 360px mobile viewports, overcrowded hero trust badges, and static search inputs.
- **Correction Applied**:
  - Replaced crowded mobile grids with an edge-to-edge touch-scrollable shortcuts strip with CSS scroll snapping.
  - Implemented 2-column mobile card layouts with responsive padding (`p-2.5 sm:p-3.5`).
  - Added Flash Deals countdown timers, Newly Launched Materials, Contractor Best Sellers, and 4-Pillar Delivery Benefits.

### 3.2. Header & Search Interaction
- **Reference Observation**: HomeRun's desktop search bar does not dynamically showcase the depth of available construction materials and lacks instant add-to-cart actions inside the search results preview.
- **BUILDORA Gap Identified**: Dropdown search results clipped past the right screen boundary on tablets; notification popovers overflowed viewports $< 400$px; search placeholder was static.
- **Correction Applied**:
  - Implemented an animated rotating search placeholder cycling through 28 categories every 2.8s, respecting `prefers-reduced-motion`.
  - Built an anchored desktop discovery panel (Popular searches, Recent searches with LocalStorage persistence, Shop by Category, New Launches carousel).
  - Built a dedicated Full-Screen Mobile Search Overlay (`fixed inset-0 z-50 bg-white`) with auto-focus, touch dismiss, and keyboard accessibility.
  - Fixed Header to an 8-action desktop hierarchy (`Logo → Location → Search → Account → Wishlist → Notifications → Wallet → Cart`), 2-row tablet layout, and 3-row mobile layout.

### 3.3. Product Listing (PLP) & Product Detail (PDP)
- **Reference Observation**: HomeRun lacks real-time warehouse ETA indicators and bulk tier visualization on the listing cards.
- **BUILDORA Gap Identified**: PLP filters were squashed on mobile screens without a dedicated filter drawer; PDP lacked mobile-sticky purchase controls for contractors scrolling long technical specification tables.
- **Correction Applied**:
  - Implemented mobile slide-over Filter Drawer with touch-friendly checkboxes and active filter counts.
  - PDP now features an interactive Bulk Pricing Calculator, technical specification sheet downloads, compliance certifications (IS / ASTM), and a sticky bottom Add-to-Cart bar on viewports $< 768$px.

### 3.4. Cart, Pricing & Server-Side Security
- **Reference Observation**: Many e-commerce sites compute discounts and delivery charges in JavaScript client bundles, creating tampering vulnerabilities via DevTools. HomeRun also shows conflicting free shipping thresholds across marketing pages vs checkout.
- **BUILDORA Gap Identified**: Early drafts risked client-side state divergence.
- **Correction Applied**:
  - Enforced single source of truth in backend `@buildora/backend-api` and shared `@buildora/utils` (`validateOrderCalculation`).
  - Explicit business rules: Subtotal $\ge ₹1,999$ qualifies for Free Delivery; Subtotal $< ₹1,999$ incurs ₹149 delivery fee.
  - Automatic slab discounts: 20–49 units = 3% off, 50–99 units = 5% off, 100+ units = 8% off.
  - Tax calculation handles GST tiers (18% for cement/chemicals, 28% for luxury fixtures, 5% for aggregates).

### 3.5. Construction Site Address & Order Delivery
- **Reference Observation**: Standard delivery addresses fail on construction sites because gates change, trucks need forklift unloading, and site supervisors differ from the purchasing manager.
- **BUILDORA Correction**:
  - Built dedicated site address fields: Site Name (e.g., "Prestige Tech Park Tower B"), Site Supervisor Phone, Gate Number, Offloading Accessibility (Crane / Forklift required).

### 3.6. Construction Intelligence & BOQ Tools
- **Reference Observation**: HomeRun has no estimation or project management tooling.
- **BUILDORA Unique Implementation**:
  - Developed 5 Civil Engineering Calculators with transparent engineering formulas (IS 456 concrete ratios, carpet-to-wall area paint multipliers, tile box wastage factors).
  - Built "My Projects" store allowing contractors to group materials by project phase (Foundation, Structure, Finishing) and export Bills of Quantities (BOQ).

---

## 4. Priority Matrix

```
       HIGH IMPACT
            ▲
            │  [P0] Server-Side Pricing Engine      [P0] 60-Min Site Delivery
            │  [P0] Responsive PLP/PDP/Cart/Header  [P0] Site Address Model
            │  [P0] Full Mobile Search Overlay       [P1] Contractor Wallet & Ledger
            │
            │  [P1] 1-Click Reorder & Lists         [P2] Civil Material Estimators
            │  [P1] Notifications Drawer            [P2] Bulk RFQ / Quotations
            │  [P2] BOQ Project Grouping            [P2] Knowledge Hub & Technical Guides
            └─────────────────────────────────────────────────────────────►
           LOW EFFORT                                             HIGH EFFORT
```

### P0 (Core Commerce & Essential Architecture) — Complete
- Multi-category navigation (5 Departments, 28 Categories).
- Server-authoritative Cart, GST, Delivery Fee, and Tiered Volume Discount Engine.
- Responsive Header (8-action hierarchy, 2-row tablet, 3-row mobile).
- Smart Search Bar (Animated placeholder, desktop preview, mobile full-screen overlay).
- Dark store serviceability mapping and 60-minute delivery promise.
- Construction Site Address Book with supervisor contact & gate instructions.
- 3-Step Checkout with Online, Wallet Split, and OTP-verified COD.

### P1 (Customer Retention & Contractor Loyalty) — Complete
- Customer Wallet with credit/debit transaction ledger.
- Rewards & cashback tier tracking.
- Past order tracking, invoice downloads, and 1-click reorder.
- Mobile bottom-sheet notification center with zero-route interruption.
- Wishlist with local storage and account sync.

### P2 (Construction Intelligence & B2B Expansion) — Complete
- Civil engineering calculators (Concrete, Paint, Tile, Waterproofing, Carpentry).
- 1-Click "Add Estimator Bill of Materials to Cart".
- Multi-truck bulk order request-for-quote (RFQ) workflow.
- Contractor "My Projects" BOQ management.
- Knowledge Hub, Material Grade Guides, and Construction Price Index.
