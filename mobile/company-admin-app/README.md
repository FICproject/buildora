# BUILDORA 60 - Company Admin Mobile App

Flutter mobile application for tenant company leadership to monitor operations, vendors, and orders.

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
  - `orders/`
  - `operations/`
  - `inventory/`
  - `vendors/`
  - `delivery_partners/`
  - `reports/`
  - `settings/`
- `lib/models/`: Data models
- `lib/services/`: Network, storage, and platform services
- `lib/providers/`: State management / Riverpod / Bloc / Provider placeholders
- `lib/utils/`: Utilities, formatters, helpers
- `assets/`: Asset bundles (images, icons, fonts)
- `android/`: Native Android configuration
- `ios/`: Native iOS configuration
- `test/`: Unit and widget tests
