# BUILDORA 60 - Platform Admin Mobile App

Flutter mobile application for SaaS platform owners to view tenant metrics, subscriptions, and system health.

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
  - `tenants/`
  - `subscriptions/`
  - `platform_analytics/`
  - `system_health/`
  - `settings/`
- `lib/models/`: Data models
- `lib/services/`: Network, storage, and platform services
- `lib/providers/`: State management / Riverpod / Bloc / Provider placeholders
- `lib/utils/`: Utilities, formatters, helpers
- `assets/`: Asset bundles (images, icons, fonts)
- `android/`: Native Android configuration
- `ios/`: Native iOS configuration
- `test/`: Unit and widget tests
