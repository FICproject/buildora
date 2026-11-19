# BUILDORA 60 — Monorepo Architecture

Multi-tenant, white-label construction materials quick-commerce SaaS platform monorepo.

## Technology Stack

- **Web Applications**: React + TypeScript + Vite
- **Mobile Applications**: Flutter + Dart
- **Backend Services**: Node.js + NestJS (Modular Architecture)
- **Monorepo Manager**: Turborepo + pnpm
- **Database**: MongoDB (Structure prepared)
- **Cache**: Redis (Structure prepared)
- **Cloud Infrastructure**: AWS + Docker + Terraform (Structure prepared)

## Monorepo Layout

```text
buildora-60/
├── apps/                 # Web applications (5 portals)
│   ├── customer-web/
│   ├── vendor-web/
│   ├── delivery-web/
│   ├── company-admin-web/
│   └── platform-admin-web/
├── mobile/               # Mobile applications (5 Flutter apps)
│   ├── customer-app/
│   ├── vendor-app/
│   ├── delivery-app/
│   ├── company-admin-app/
│   └── platform-admin-app/
├── services/             # Backend microservices and API gateways
│   └── backend/
│       ├── api-gateway/
│       ├── api/          # Main modular NestJS API (30 modules)
│       └── workers/      # Async task workers & queue consumers
├── packages/             # Shared TypeScript packages
│   ├── ui/
│   ├── types/
│   ├── utils/
│   ├── config/
│   ├── api-client/
│   ├── auth/
│   ├── tenant/
│   ├── permissions/
│   ├── validation/
│   └── constants/
├── infrastructure/       # DevOps, Cloud & Deployment configs
│   ├── docker/
│   ├── aws/
│   ├── terraform/
│   ├── ci-cd/
│   ├── monitoring/
│   └── security/
├── docs/                 # Documentation & Architecture records
└── tools/                # Monorepo tooling and scripts
```

## Phase 1 Status

Phase 1 completes the comprehensive monorepo project structure. No business logic, APIs, or UI screens are implemented in this phase.
