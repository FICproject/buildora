# BUILDORA 60 — Smart Search Bar & Interaction Experience Report

## 1. Overview & Objective

The search experience on **BUILDORA 60** has been engineered to deliver instant discovery of construction materials, electrical supplies, plumbing fixtures, and finishes. Inspired by quick-commerce discovery patterns and the HomeRun reference model, the search bar transitions from an engaging idle state into a full-featured discovery command center upon user interaction.

The implementation resides in `apps/customer-web/src/components/common/SmartSearchBar.tsx`.

---

## 2. Animated Rotating Placeholder Specification

### 2.1. Phrasing & Dynamic Categories
The search input displays rotating animated placeholder phrases generated dynamically from the catalog's top categories and subcategories:

- *"Search for Cement"*
- *"Search for Tiles"*
- *"Search for Plywood"*
- *"Search for Paint"*
- *"Search for Waterproofing"*
- *"Search for Electrical Wires"*
- *"Search for Switches & Sockets"*
- *"Search for Plumbing Pipes"*
- *"Search for Bathroom Fittings"*
- *"Search for Kitchen Accessories"*
- *"Search for Power Tools"*
- *"Search for Door Locks"*
- *"Search for Ceiling Fans"*
- *"Search for Lighting"*
- *"Search for General Hardware"*
- Subcategory dynamic phrases (e.g. *"Search for Calibrated Marine Plywood"*, *"Search for CPVC High Pressure Pipes"*).

### 2.2. Motion & Lifecycle Controls
1. **Rotation Interval**: Cycles every 2,800 ms with a smooth CSS slide-up and fade transition (`animate-in fade-in slide-in-from-bottom-2 duration-300`).
2. **Focus Pause**: When the user clicks or focuses the input field, the rotation timer immediately pauses.
3. **Typing Suspension**: While characters are present in the search bar, the overlay placeholder is unmounted completely.
4. **Blur / Idle Resume**: When the user blurs the input without entering any text, the timer resumes from the current index.
5. **Accessibility (`prefers-reduced-motion`)**: Honors user OS preferences (`window.matchMedia('(prefers-reduced-motion: reduce)')`). When enabled, animated rotation is disabled and a static descriptive placeholder is rendered instead.

---

## 3. Search-Open Interaction Panel (Pre-Typing Mode)

Prior to the user typing any text, focusing or clicking the search bar immediately opens the **Search-Open Interaction Panel**. This provides instantaneous visual discovery without requiring typing:

### 3.1. Section 1 — Popular & Recent Searches
- **Popular Chips**: High-frequency contractor queries:
  - `UltraTech Cement`
  - `Havells Wires`
  - `Astral CPVC`
  - `Waterproofing`
  - `Vitrified Tiles`
  - `Marine Plywood`
  - `Asian Paints`
  - `Bosch Drill`
  - `Mortise Locks`
- **Recent Searches**: Stored in `localStorage` under key `buildora_search_history`. Displays the user's latest 5 searches with a 1-click "Clear" button. Clicking any term immediately executes the search.

### 3.2. Section 2 — Shop by Category
- Dynamic grid displaying top master categories with high-resolution imagery and direct routing:
  - Civil & Structural (`/categories/cement-aggregates`)
  - Electrical Supplies (`/categories/wires-cables`)
  - Plumbing & Sanitary (`/categories/pipes-fittings`)
  - Wood & Hardware (`/categories/plywood-mdf-hdhmr`)
  - Direct "See All 28 &rarr;" shortcut leading to the full product catalog.

### 3.3. Section 3 — Newly Launched Materials Carousel
- Displays newly added catalog materials with real-time interactions:
  - Product thumbnail and title.
  - Live contractor price with GST breakdown.
  - **1-Click Quick-Add to Cart** button (`addItem` via `useCartStore`).
  - **1-Click Wishlist Toggle** button (`toggleItem` via `useWishlistStore`).

---

## 4. Live Search Matching (Typing Mode)

When the user enters 1 or more characters, the interaction panel switches seamlessly to live query matching:

```
+-------------------------------------------------------------------+
|  [Q] havells                                             [X] [Search] |
+-------------------------------------------------------------------+
| CATEGORIES                                                        |
|   Wires & Cables                                            ->    |
|   Switches & Sockets                                        ->    |
| BRANDS                                                            |
|   [Logo] Havells India Ltd                                  ->    |
| MATCHING MATERIALS                                                |
|   [Img] Havells LifeLine Plus 2.5 sq mm Wire (90m)      ₹2,450    |
|   [Img] Havells Fabio 6A 1-Way Switch White               ₹115    |
|   [Img] Havells Reo 16A Power Socket Plate                ₹240    |
| ----------------------------------------------------------------- |
|   View all matching results for "havells" &rarr;                  |
+-------------------------------------------------------------------+
```

- **Search Attributes**: Matches case-insensitively across product `name`, `brand`, `sku`, and `category`.
- **Keyboard Navigation**:
  - `Escape`: Closes the panel and restores focus.
  - `Enter`: Submits the search form and redirects to `/search?q={query}`.
- **Outside Click**: Event listeners detect document clicks outside `searchContainerRef` and close the panel automatically.

---

## 5. Summary & Verification

| Requirement | Status | Verification Note |
| :--- | :---: | :--- |
| Sequential Animated Placeholder | Verified | Cycles 28+ phrases every 2.8s; pauses on focus/typing |
| Search-Open Panel Before Typing | Verified | Opens immediately upon focus/click |
| Popular Searches Chips | Verified | 9 verified building material tags |
| Recent Search History | Verified | Backed by LocalStorage with Clear capability |
| Shop by Category Grid | Verified | 8 top categories with direct links |
| New Launches with Quick-Add | Verified | Displays items with Cart & Wishlist actions |
| Live Typed Matching | Verified | Matches Categories, Brands, SKUs, and Products |
| View All Results Route | Verified | Links to `/search?q=...` |
