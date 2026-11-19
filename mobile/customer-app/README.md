# BUILDORA 60 - Customer Mobile App

Flutter mobile application for customer storefront, catalogue, orders, and live tracking.

## Flutter Structure
- `lib/core/`: Core application foundation
- `lib/config/`: Environment and app configurations
- `lib/constants/`: Mobile constants, strings, assets keys
- `lib/theme/`: App theming (colors, typography, styles)
- `lib/routing/`: App route definitions and navigation
- `lib/common/`: Common widgets and UI components
- `lib/features/`: Role-specific business domain feature modules:
  - `auth/`
  - `catalogue/`
  - `cart/`
  - `checkout/`
  - `orders/`
  - `tracking/`
  - `profile/`
  - `support/`
- `lib/models/`: Data models
- `lib/services/`: Network, storage, and platform services
- `lib/providers/`: State management / Riverpod / Bloc / Provider placeholders
- `lib/utils/`: Utilities, formatters, helpers
- `assets/`: Asset bundles (images, icons, fonts)
- `android/`: Native Android configuration
- `ios/`: Native iOS configuration
- `test/`: Unit and widget tests
