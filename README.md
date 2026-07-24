# PilotUiAngular

Production-ready Angular SPA using standalone APIs, strict typing, and OpenAPI-generated clients.

## Tech Stack

- Angular 22 (latest stable)
- Standalone components and route-based lazy loading
- SCSS styling
- RxJS + Angular signals for feature state
- ng-openapi-gen for typed API client generation
- ESLint + Prettier
- Vitest via Angular CLI test builder

## Architecture

Source layout follows feature-first boundaries with shared/core layers:

- src/app/core
  - App-wide singleton services, typed config tokens, interceptors, and global error handling.
- src/app/shared
  - Reusable presentational UI building blocks, directives, and pipes.
- src/app/features
  - Domain features with container components and facades.
- src/app/api
  - Generated OpenAPI client code (isolated) and thin handwritten API adapters/mappers.

### Core Principles Applied

- Business logic is in facades/services, not UI components.
- Generated API layer is isolated from feature logic.
- Feature components consume view models from facades.
- Centralized request concerns through interceptors.
- Strict TypeScript and Angular template checks enabled.

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Run dev server:

```bash
npm start
```

3. Build production bundle:

```bash
npm run build:prod
```

4. Run tests:

```bash
npm run test
```

5. Run lint checks:

```bash
npm run lint
```

## OpenAPI Client Generation

OpenAPI source:

- docs/PilotApi_v1.yaml

Generation config:

- ng-openapi-gen.json

Regenerate client when spec changes:

```bash
npm run api:generate
```

Generated output location:

- src/app/api/generated

Do not hand-edit generated files. Extend behavior in:

- src/app/api/facades
- src/app/api/mappers
- src/app/features/*/services

## Environment Configuration

Typed environment values are defined through:

- src/app/core/config/app-config.ts
- src/environments/environment.development.ts
- src/environments/environment.ts

Values include:

- apiBaseUrl
- apiVersion
- requestTimeoutMs
- production

## Testing Strategy

- Unit tests for shared utilities/components and core services.
- Facade-level tests for API mapping and feature state behavior.
- Integration-style HTTP test for generated-client adapter using HttpTestingController.

## Scripts

- npm start: start development server
- npm run build:prod: production build
- npm run test: run tests once
- npm run lint: lint workspace
- npm run format: format code
- npm run format:check: verify formatting
- npm run api:generate: regenerate typed API client