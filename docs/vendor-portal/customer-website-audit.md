# BUILDORA 60 — Customer Website Deep Code Audit for Vendor Integration

**Audit Date:** 2026-11-23  
**Auditor:** Antigravity Engineering  
**Scope:** Customer Website Architecture, Data Models, Cart/Order Engines, Product Catalog, Pricing & Delivery Systems  

---

## 1. Monorepo & Application Architecture

- **Workspace Engine:** `pnpm` (version >= 9.0.0) with `turbo` pipeline orchestrator.
- **Applications:**
  - `apps/customer-web`: Active customer-facing quick-commerce application (React 18, TypeScript, Vite, Tailwind CSS, Zustand, Lucide React).
  - `apps/vendor-web`: Vendor management portal application container.
  - `apps/delivery-web`: Delivery partner app container.
  - `apps/company-admin-web`: Tenant/franchise administration container.
  - `apps/platform-admin-web`: Multi-tenant SaaS super-admin platform container.
  - `services/backend/api`: NestJS monolith providing REST endpoints for customer, catalogue, cart, orders, wallet, serviceability, checkout, etc.
- **Shared Packages (`packages/*`):**
  - `@buildora/types`: Canonical TypeScript interfaces (`Product`, `Category`, `Order`, `Address`, `CustomerProfile`, `BulkPriceTier`, etc.).
  - `@buildora/constants`: Master categories (28), brands (10), seed products (51), serviceable pincodes (all Bengaluru metro 560xxx & rural 562xxx), dark stores (`WH-BLR-01` to `WH-BLR-05`), coupons (`BUILD60`, `SUPER10`, etc.).
  - `@buildora/utils`: Financial formatters (`formatCurrency`), unit calculations, estimator suites.
  - `@buildora/config`: Environment variables, ports, endpoints, tenant defaults.

---

## 2. Product Catalog & Data Structure

- **Departments & Categories:**
  - 5 Construction Departments: `Civil & Interiors`, `Furniture & Architectural Hardware`, `Electrical`, `Plumbing, Sanitary & Bath`, `Hardware & Appliances` + Curated `New Launches`.
  - 28 Master Categories with 79 Child Subcategories.
- **Product Entity Model:**
  - Identifier: `id`, `slug`, `sku`.
  - Taxonomy: `categorySlug`, `category`, `subcategorySlug`, `subcategory`, `brand`, `brandSlug`.
  - Pricing: `mrp`, `price` (selling price), `discount` (calculated or percentage), `gstRate` (18% or 28%), `unit`, `packSize`.
  - Inventory: `inStock` (boolean), `stockCount` (integer), `maxStock`.
  - Bulk Pricing: `isBulkEligible` (boolean), `bulkPricing: BulkPriceTier[]` (`{ minQuantity, discountPercentage, unitPrice }`).
  - Variants: `variants?: ProductVariant[]` (`id`, `sku`, `name`, `attributes`, `price`, `mrp`, `stock`, `inStock`, `image`).
  - Specifications: `specifications: Record<string, string>` and `categoryAttributes: Record<string, any>`.
  - Delivery Capabilities: `deliverySpeedAvailable: DeliverySpeed[]` (`ASAP_60`, `EXPRESS_90`, `SCHEDULED`, `NEXT_DAY`, `STANDARD`).
- **Vendor Responsibility Identified:**
  - A vendor owns a subset of catalog products or can submit new products for admin review.
  - Vendors manage: base price, MRP, stock count, variant stocks, and bulk pricing quantity tiers (e.g., 10+, 30+, 60+).

---

## 3. Bulk Pricing Engine (HomeRun Reference Parity)

- **Customer UX:**
  - Product cards and detail pages render a clickable `Bulk price ₹X >` trigger.
  - Clicking opens the `BulkPricingModal` center dialog with dark overlay, product title, and tiered unit pricing bullets.
- **Calculation Rule:**
  - When quantity $\ge \text{minQuantity}$, the effective unit price is applied in cart calculation (`effectiveUnitPrice = tier.unitPrice`).
  - Cart calculation respects tiered discounts before coupon applications.
- **Vendor Control Point:**
  - Vendor must configure minimum quantity, discounted unit price, and discount percentage without violating base selling price boundaries ($\text{bulk price} \le \text{selling price} < \text{MRP}$).

---

## 4. Delivery, Serviceability & Warehousing

- **Centralized Bengaluru Network:**
  - 5 Dark Store Hubs:
    - `WH-BLR-01`: Central (Indiranagar, Koramangala, CBD)
    - `WH-BLR-02`: South (Jayanagar, BTM, JP Nagar, HSR)
    - `WH-BLR-03`: East (Whitefield, Marathahalli, Mahadevapura)
    - `WH-BLR-04`: West (Nagarabhavi, Peenya, Rajajinagar, Vijayanagar)
    - `WH-BLR-05`: North (Hebbal, Yelahanka, Manyata Tech Park)
  - All 560xxx (Bengaluru Metro) receive active 60-90 min dispatch; 562xxx (Rural corridors) receive scheduled 120-180 min truck dispatch.
- **Delivery Fee Matrix:**
  - Orders $\ge$ ₹1,000: **FREE Standard Delivery**
  - Orders < ₹1,000: ₹199 Delivery Fee
  - Fragile material transit protection: +₹49
  - Heavy bulk material handling: +₹99
  - Optional ground floor site unloading: ₹199 (base) + ₹50/floor if no lift.
- **Vendor Portal Integration Point:**
  - Vendors dispatch goods to the assigned dark store hub or register as a local dispatch partner.
  - Vendors configure pickup addresses, warehouse location, preparation time, and daily dispatch cutoff times.

---

## 5. Orders, Cart & Checkout Lifecycle

- **Order Status Progression:**
  `ORDER_PLACED` $\rightarrow$ `PAYMENT_CONFIRMED` $\rightarrow$ `PROCESSING` $\rightarrow$ `CONFIRMED` $\rightarrow$ `WAREHOUSE_ASSIGNED` $\rightarrow$ `PACKED` $\rightarrow$ `READY_FOR_DISPATCH` $\rightarrow$ `DISPATCHED` $\rightarrow$ `OUT_FOR_DELIVERY` $\rightarrow$ `DELIVERED`.
- **Payment Modes:** Razorpay UPI, Razorpay Card, Net Banking, Cash/UPI on Delivery (COD), BUILDORA Wallet.
- **Multi-Vendor Order Isolation Requirement:**
  - Customer order may contain items from Vendor A and Vendor B.
  - The vendor portal must display vendor-specific order views: only the items, quantities, and settlement amounts belonging to the logged-in vendor.

---

## 6. Multi-Tenant Architecture & Security

- **Default Tenant:** `tenant-buildora-blr` (`PLATFORM_DEFAULT_TENANT_ID`).
- **Data Isolation:**
  - Every API request carries/resolves tenant context.
  - Vendors are associated with a single tenant and have an isolated `vendorId`.
  - Backend must enforce cross-vendor access control (Vendor 1 cannot read/mutate Vendor 2's catalog, stock, or financials).

---

## 7. Reusability Matrix

| Component / Service | Location | Reusability in Vendor Portal |
|---|---|---|
| Master Categories & Brands | `@buildora/constants` | 100% Direct Reuse |
| Master Types (`Product`, `Order`, `Address`) | `@buildora/types` | 100% Direct Reuse |
| Serviceability & Dark Stores | `@buildora/constants` | 100% Direct Reuse |
| Currency & Pricing Formatters | `@buildora/utils` | 100% Direct Reuse |
| UI Component Atoms (Button, Modal, Input) | Extracted/Adapted from Customer Web | 100% Direct Reuse |
| Lucide Icons & Tailwind Palette | Workspace dependencies | 100% Direct Reuse |
| Backend Store & Controllers | `services/backend/api` | Extend with Vendor Controller |
