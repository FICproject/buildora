# BUILDORA 60 — Header Redesign & Action Placement Report

## 1. Architectural Overview

The **BUILDORA 60 Header** (`apps/customer-web/src/components/common/Header.tsx`) has been completely overhauled to meet strict functional ordering, mobile-first responsiveness, and contextual customer permissions.

The header serves as the primary operational anchor for construction contractors, site engineers, and homeowners, providing real-time location ETA, catalog search, personal account management, notifications, and cart checkout staging.

---

## 2. Desktop Header Order (`>= 1024px`)

On desktop viewports, the primary navigation row strictly implements the required sequence:

```
+-------------------------------------------------------------------------------------------------------------------------------+
| [B] BUILDORA 60 | Deliver to: 560038 (60m) | [   Smart Search Bar...   ] | My Account | [Heart 3] | [Bell 2] | Wallet ₹1,250 | [Cart ₹6,350] |
+-------------------------------------------------------------------------------------------------------------------------------+
| [=] All 28 Categories | Civil & Core | Furniture & Wood | Electrical | Plumbing | Hardware | Brands | Deals | 7AM-11PM Site Delivery |
+-------------------------------------------------------------------------------------------------------------------------------+
```

### Detailed Element Specifications (Left to Right):

1. **Brand Logo (`Logo`)**:
   - Deep Blue (`#1E3A8A`) rounded square with bold white lettermark `B`.
   - Brand text `BUILDORA` + Safety Orange `60`.
   - Sub-tagline: `BUILD SMART. DELIVER FAST.`.
   - Links to `/` (Storefront Home).

2. **Deliver-To Location Pill (`Location`)**:
   - Interactive button triggering the modal `openLocationModal()`.
   - Displays active pincode (default `560038`) and city name (`Bengaluru`).
   - Displays live dark store delivery ETA badge (`60m` or live calculated minutes).

3. **Smart Search Bar (`Search`)**:
   - Embeds `<SmartSearchBar />` with responsive flex expansion (`flex-1 max-w-xl mx-2`).
   - Displays sequentially rotating animated placeholder.
   - Triggers the Search-Open Interaction Panel on click/focus prior to typing.

4. **My Account (`My Account`)**:
   - **Authenticated Customer**: Displays initial badge, user name or phone, and dropdown chevron. Clicking opens a dropdown menu with:
     - Account Dashboard Overview (`/account`)
     - My Orders & Dispatches (`/account/orders`)
     - Buildora Wallet (`/account/wallet`)
     - Contractor Rewards (`/account/rewards`)
     - Site Delivery Addresses (`/account/addresses`)
     - Project Procurement Lists (`/account/projects`)
     - Profile Settings & GSTIN (`/account/profile`)
     - Security & PIN Settings (`/account/security`)
     - Sign Out action.
   - **Guest Visitor**: Displays a clean "Sign In" button with User icon, calling `openAuthModal('/account', 'Sign in to access your Buildora account and saved details')`.

5. **Wishlist (`Wishlist`)**:
   - Heart icon linking to `/wishlist`.
   - Dynamic counter badge reflecting `wishlistItems.length` from `useWishlistStore`.
   - Available to both guests (stored locally in localStorage) and authenticated users.

6. **Notifications (`Notifications`)**:
   - Embedded `<NotificationPopover />` with Bell icon.
   - Live unread badge pulsating when `unreadCount > 0`.
   - On click, displays an interactive popover with:
     - Real-time GPS dispatches (e.g. driver name, vehicle plate, ETA).
     - Wallet credits & cashbacks.
     - Deals and site operational announcements.
     - "Mark all read" button.
     - If unauthenticated, displays a contextual prompt inviting sign-in for private dispatch updates.

7. **Wallet (`Wallet`)**:
   - Displays `Wallet` icon in emerald green.
   - **Authenticated**: Shows live Buildora Cash balance (e.g. `₹1,250.00`). Clicking routes directly to `/account/wallet`.
   - **Guest**: Displays "Wallet" label. Clicking invokes `openAuthModal('/account/wallet', 'Sign in to access your Buildora Cash Wallet and promotional cashbacks.')`.

8. **Cart (`Cart`)**:
   - High-contrast Safety Orange (`bg-brand-orange-500 hover:bg-brand-orange-600`) button.
   - Shopping bag icon with live item count badge.
   - Displays real-time grand total (e.g. `₹6,350` or `Cart`).
   - Clicking opens the slide-in `CartDrawer` with free delivery progress bar and checkout staging.

---

## 3. Desktop Row 2: Departments & Mega Menus

Desktop Row 2 contains category discovery anchors:
1. **All 28 Categories Mega Menu**: A persistent dropdown presenting all 28 master construction categories in a 3-column visual grid with photography.
2. **5 Construction Departments**:
   - `Civil & Core Structural`
   - `Furniture, Wood & Hardware`
   - `Electrical & Power Distribution`
   - `Plumbing & Sanitaryware`
   - `Hardware, Tools & Site Appliances`
   - Hovering any department opens a mega-menu displaying its child categories and subcategories.
3. **Shortcuts**: "Top Brands", "Deals" (with sparkle icon), and "7:00 AM - 11:00 PM Site Delivery" operational status badge.

---

## 4. Adaptive Tablet Header Layout (`768px` - `1023px`)

To eliminate overlapping buttons and cramped search bars on tablet devices:
- **Row 1**:
  - Logo (`BUILDORA 60`) + Compact Location Pill (`560038`).
  - Action Group: My Account, Wishlist, Notifications, Wallet icon, Cart button, and Hamburger menu button.
- **Row 2**:
  - Full-width `SmartSearchBar` spanning the entire tablet width.

---

## 5. Dedicated Mobile Header Layout (`< 768px`)

Optimized for 1-handed operation and small mobile viewports (320px - 430px):
- **Row 1**:
  - Left: Hamburger toggle button + Compact Logo (`B` + `BUILDORA 60`).
  - Right: Wishlist icon (with badge) + Notifications popover + Compact Cart button with count badge.
- **Row 2**:
  - Full-width Deliver-to Location pill with live ETA.
  - Full-width `SmartSearchBar` with animated placeholder.
- **Slide-Down Mobile Drawer**:
  - Displays user account status (or Sign In button).
  - Displays Buildora Wallet balance or sign-in prompt.
  - Lists the 5 Construction Departments with quick subcategory links.
  - Provides quick links to Material Estimators, Commercial Bulk Quotations, Deals, Brands, and Knowledge Hub.

---

## 6. Implementation Reference Table

| Component File | Role & Key Logic |
| :--- | :--- |
| `apps/customer-web/src/components/common/Header.tsx` | Main responsive header controller handling desktop, tablet, and mobile layouts |
| `apps/customer-web/src/components/common/SmartSearchBar.tsx` | Rotating placeholder, focus panel, popular tags, and live search suggestions |
| `apps/customer-web/src/components/common/NotificationPopover.tsx` | Interactive notifications popover with dispatch alerts and guest banners |
| `apps/customer-web/src/components/common/AuthModal.tsx` | Contextual mobile OTP login modal with destination preservation |
| `apps/customer-web/src/components/common/CartDrawer.tsx` | Slide-in cart drawer with free delivery meter and order staging |
