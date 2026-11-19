# BUILDORA 60 - Vendor Mobile App

Flutter mobile application for vendor operations, product updates, inventory, and sales.

## Flutter Structure
- `lib/core/`: Core application foundation
- `lib/config/`: Environment and app configurations
- `lib/constants/`: Mobile constants, strings, assets keys
- `lib/theme/`: App theming (colors, typography, styles)
- `lib/routing/`: App route definitions and navigation
- `lib/common/`: Common widgets and UI components
- `lib/features/`: Role-specific business domain feature modules:
  - `auth/`
  - `dashboard/`
  - `products/`
  - `inventory/`
  - `orders/`
  - `earnings/`
  - `analytics/`
  - `profile/`
- `lib/models/`: Data models
- `lib/services/`: Network, storage, and platform services
- `lib/providers/`: State management / Riverpod / Bloc / Provider placeholders
- `lib/utils/`: Utilities, formatters, helpers
- `assets/`: Asset bundles (images, icons, fonts)
- `android/`: Native Android configuration
- `ios/`: Native iOS configuration
- `test/`: Unit and widget tests
