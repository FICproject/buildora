# BUILDORA 60 — Search UI & Notification Popover Repair Report

## 1. Executive Summary

This report documents the architectural corrections and interaction redesign applied to the two primary navigation mechanisms on the BUILDORA 60 platform:
1. **The Smart Search Bar & Discovery Panel** (`SmartSearchBar.tsx`)
2. **The Notification Popover & Bottom Sheet Drawer** (`NotificationPopover.tsx`)

Both components previously suffered from positioning anomalies, layout overlap, and mobile viewport clipping. They have been re-engineered into viewport-adaptive components that deliver frictionless discovery without disruptive route changes.

---

## 2. Search Experience Overhaul

### 2.1. Problems Identified in Previous Implementation
- Search dropdown used naive absolute positioning that floated over unrelated header elements.
- Width and alignment failed to track the parent input container during viewport resizing.
- On mobile viewports (320px–430px), a desktop-style dropdown was forced into a tight, clipped layout, rendering category cards unreadable and obscuring keyboard inputs.
- Dropdown height frequently clipped against parent container overflow.

---

### 2.2. Desktop & Tablet Implementation (`>= 768px`)
- **Direct Input Alignment**: The panel is contained within `searchContainerRef` (`relative w-full max-w-xl mx-auto`), rendering directly beneath the input field with exact horizontal alignment:
  ```html
  <div class="hidden md:block absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-slate-200 z-50 max-h-[520px] overflow-y-auto">
  ```
- **Z-Index & Layout Isolation**: Configured with `z-50` and shadow elevation (`shadow-2xl`), eliminating any page layout displacement or overlapping of header action icons.
- **Auto-Dismiss Lifecycle**: Document-level event listeners detect clicks outside `searchContainerRef` or `Escape` keystrokes and dismiss the panel smoothly.
- **Pre-Typing Mode**: Opening the panel displays:
  1. **Popular Searches**: High-volume contractor tags (`UltraTech Cement`, `Havells Wires`, `Waterproofing`, etc.).
  2. **Recent Searches**: Stored in `localStorage` under `buildora_search_history` with an instant "Clear Recent" action.
  3. **Shop by Category**: Visual grid with high-resolution photography.
  4. **New Launches Carousel**: Newly added materials with 1-click **Add to Cart** and **Wishlist Toggle**.
- **Live Query Suggestions**: As the user types, debounced live matches categorize results into Matching Categories, Authorized Brands, and Specific Materials with real-time pricing.

---

### 2.3. Mobile Implementation (`< 768px`): Dedicated Full-Screen Search Overlay
Instead of cramming a desktop dropdown into mobile screens, focusing or tapping the search bar opens a **Dedicated Full-Screen Mobile Search Overlay** (`fixed inset-0 z-50 bg-white flex flex-col`):
1. **Fixed Top Search Header**:
   - Back button (`ArrowLeft`) to exit search and return to the exact scroll position.
   - Auto-focused input field (`mobileInputRef`) with search icon.
   - 1-tap Clear button (`X`) when text is present.
   - Primary "Search" button for immediate form submission.
2. **Scrollable Discovery Surface**:
   - Allows natural vertical touch scrolling without viewport jitter.
   - Popular search chips with minimum 36px touch targets.
   - 2-column "Shop by Category" visual cards.
   - 2-column "Newly Launched Materials" grid with direct Add-to-Cart buttons.
   - Live query suggestions with instant tap-to-navigate links.
3. **Keyboard Compatibility**: Prevents iOS and Android virtual keyboards from obscuring search suggestions.

---

### 2.4. Sequential Animated Rotating Placeholder
- **Phrasing Engine**: Sourced dynamically from catalog categories and subcategories (*"Search for Cement"*, *"Search for Electrical Wires"*, *"Search for Asian Paints"*, *"Search for Power Tools"*).
- **Animation Interval**: Cycles every 2,800 ms with smooth CSS keyframes (`animate-in fade-in slide-in-from-bottom-2 duration-300`).
- **Interaction Pausing**: Pauses instantly upon user focus, unmounts during typing, resumes on blur if empty, and respects `prefers-reduced-motion: reduce`.

---

## 3. Notification Interaction Overhaul

### 3.1. Problems Identified in Previous Implementation
- Clicking the notification bell in earlier iterations frequently navigated to `/account/notifications`, abruptly taking users away from their shopping flow or checkout staging.
- When rendered as a popover, a fixed 320px width (`w-80`) with `right-0` anchor caused the panel to overflow off the left edge of mobile viewports (e.g. 320px, 360px).

---

### 3.2. Desktop & Tablet Anchored Popover (`>= 640px`)
- **Direct Anchor**: Positioned directly beneath the notification trigger button:
  ```html
  <div class="hidden sm:block absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50">
  ```
- **Zero Route Navigation**: Clicking the Bell icon toggles the popover open/closed without triggering any URL navigation. The current page remains intact.
- **Keyboard & Click-Outside Dismissal**: Closes automatically on outside click or when `Escape` is pressed.
- **Notification Feed**:
  - Displays GPS mini-truck dispatches (driver name, vehicle number, arrival ETA).
  - Displays Buildora Wallet cashback credits.
  - Displays contractor price-drop offers and site announcements.
  - Includes an unread badge indicator, timestamps, and a "Mark all read" action.
  - Features an unauthenticated banner inviting contractors to sign in for private dispatch updates.

---

### 3.3. Mobile Bottom Sheet Drawer (`< 640px`)
On mobile devices, clicking the notification bell triggers a native **Mobile Bottom Sheet Drawer**:
```html
<div class="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 max-h-[82vh] flex flex-col animate-in slide-in-from-bottom duration-200">
```
- **Backdrop**: Smooth dark backdrop (`bg-slate-950/60 backdrop-blur-sm z-50`) closes the drawer when tapped.
- **Header**: Includes visual drag handle indicator, "Notifications" title, unread count pill, "Mark read" button, and prominent close button (`X`).
- **Scrollable List**: Fluid touch scrolling for notification items with high-contrast icons, timestamps, and unread dot indicators.
- **Zero Page Shift**: Closes smoothly without changing the underlying route.

---

## 4. Verification & QA Test Results

| Test Scenario | Viewport | Expected Behavior | Result |
| :--- | :---: | :--- | :---: |
| Click Search input | Desktop (`1440px`) | Anchored panel opens directly below input; aligns with input boundaries | **PASS** |
| Type query in Search | Desktop (`1440px`) | Live matching categories, brands, and products render with prices | **PASS** |
| Press Escape in Search | Desktop (`1440px`) | Panel closes; focus returns to input | **PASS** |
| Click Search input | Mobile (`375px`) | Full-screen mobile search overlay opens with auto-focused text field | **PASS** |
| Tap Back in Mobile Search | Mobile (`375px`) | Mobile overlay closes; original page and scroll position restored | **PASS** |
| Click Bell Icon | Desktop (`1440px`) | Popover opens anchored to bell; current page URL remains unchanged | **PASS** |
| Click Bell Icon again | Desktop (`1440px`) | Popover toggles closed | **PASS** |
| Click outside Popover | Desktop (`1440px`) | Popover closes | **PASS** |
| Tap Bell Icon | Mobile (`375px`) | Bottom-sheet drawer slides up with backdrop; route unchanged | **PASS** |
| Tap Close / Backdrop | Mobile (`375px`) | Bottom-sheet drawer dismisses smoothly | **PASS** |
| Mark all read | Both | Unread count badge resets to 0 across header bell and popover | **PASS** |
| Empty notification state | Both | Displays `"No notifications yet"` with descriptive subtext | **PASS** |
