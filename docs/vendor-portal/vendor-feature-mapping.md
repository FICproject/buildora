# BUILDORA 60 — Customer Website to Vendor Portal Feature Mapping

This document maps every customer-facing feature and business constraint to its corresponding vendor management capability.

---

## 1. Product & Catalog Management

| Customer Website Feature | Customer View / Touchpoint | Vendor Portal Control & Action |
|---|---|---|
| Product Display on PLP & PDP | Title, brand, description, specifications, image gallery, rating | Vendor creates/edits product, selects master department/category/child category, specifies attributes (Grade, Size, Thickness, Wattage, etc.), uploads gallery images |
| Product Status & Visibility | Products display only when `inStock: true`, active, and approved | Vendor toggles active/inactive, tracks approval state (`DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `REJECTED`) |
| Stock Availability Badge | "In Stock (X available)", "Only 2 left", or "Out of Stock" | Vendor updates stock counts, receives low-stock threshold alerts, executes stock adjustments |
| Product Variants | Select pack size, sheet thickness, length, wire gauge | Vendor adds/edits variants with individual SKUs, prices, stock counts, and attribute key-value pairs |

---

## 2. Pricing & Bulk Pricing

| Customer Website Feature | Customer View / Touchpoint | Vendor Portal Control & Action |
|---|---|---|
| Standard Pricing & GST | Selling price, MRP, GST rate (18%/28%), discount percentage | Vendor inputs MRP, selling price, tax rate; system auto-computes discount % and prevents selling price > MRP |
| Bulk Price Trigger & Dialog | "Bulk price ₹335 >" pill opens modal with tiered quantity list | Vendor configures bulk tiers: Minimum quantity (e.g. 10+, 30+, 60+), unit price, and discount % |
| Bulk Cart Calculation | Cart applies discounted unit price when line quantity meets tier | Backend validates bulk tiers upon order submission and attributes tier revenue to vendor settlement |

---

## 3. Orders & Fulfillment

| Customer Website Feature | Customer View / Touchpoint | Vendor Portal Control & Action |
|---|---|---|
| Order Placement | Customer pays and places order with delivery address | Vendor receives new order notification in vendor dashboard and order management list |
| Order Item Isolation | Customer views unified order invoice with all multi-vendor items | Vendor views only their assigned items, line totals, and pickup/packing requirements |
| Fulfillment Workflow | Customer tracks timeline: `PLACED` $\rightarrow$ `PACKED` $\rightarrow$ `DISPATCHED` | Vendor marks order as: `ACCEPTED` $\rightarrow$ `PROCESSING` $\rightarrow$ `READY_FOR_DISPATCH` $\rightarrow$ `DISPATCHED` |
| Cancellation & Returns | Customer requests cancellation before dispatch or return after delivery | Vendor receives cancellation / return request, reviews customer reason and evidence, accepts or rejects with justification |

---

## 4. Delivery & Warehousing

| Customer Website Feature | Customer View / Touchpoint | Vendor Portal Control & Action |
|---|---|---|
| 60-Min Express Dispatch | "60 Mins Delivery" badge for ASAP_60 enabled items | Vendor configures warehouse dispatch hub (`WH-BLR-01` to `WH-BLR-05`), daily cutoff time, and order preparation lead time |
| Serviceable Pincodes | Pincode checking modal and serviceability verification | Vendor registers pickup address and reviews dark store assignment within Bengaluru network |

---

## 5. Payments, Settlements & Earnings

| Customer Website Feature | Customer View / Touchpoint | Vendor Portal Control & Action |
|---|---|---|
| Online & COD Payments | Razorpay UPI, Cards, NetBanking, COD, Wallet | Platform collects payment and computes vendor net payable = Gross Sales - Platform Commission - Taxes |
| Invoicing & GST | Customer downloads B2B GST tax invoice | Vendor views settlement statement, payout transaction history, and downloadable GST summary |
