# BUILDORA 60 - Delivery Partner Mobile App

Flutter mobile application for delivery drivers, task dispatch, pickup navigation, and payouts.

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
  - `tasks/`
  - `pickups/`
  - `deliveries/`
  - `navigation/`
  - `earnings/`
  - `profile/`
- `lib/models/`: Data models
- `lib/services/`: Network, storage, and platform services
- `lib/providers/`: State management / Riverpod / Bloc / Provider placeholders
- `lib/utils/`: Utilities, formatters, helpers
- `assets/`: Asset bundles (images, icons, fonts)
- `android/`: Native Android configuration
- `ios/`: Native iOS configuration
- `test/`: Unit and widget tests
