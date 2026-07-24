# PilotUiAngular Architecture Guide

Date: 2026-07-23

## Purpose

This document explains how the application is organized, how data and UI logic flow through the system, and why key implementation decisions were made.

## Application Goals

- Provide a production-ready Angular SPA for a backend defined by OpenAPI.
- Keep generated API code isolated from feature logic.
- Centralize cross-cutting concerns such as auth, loading, and error handling.
- Use predictable feature state and testable facades.

## High-Level Structure

The project is organized by responsibility and feature boundaries.

- `src/app/core`
  - App-wide configuration, guards, interceptors, and error handling.
- `src/app/shared`
  - Reusable UI components, directives, and pipes.
- `src/app/api`
  - Generated OpenAPI client code plus handwritten providers/facades/mappers.
- `src/app/features`
  - User-facing features such as Home, API Explorer, and Resources.
- `src/environments`
  - Environment values consumed through typed app config.

## Routing and Feature Loading

Routes are declared in `src/app/app.routes.ts` and loaded lazily per feature.

- `/` -> Home feature
- `/explorer` -> API Explorer diagnostics feature
- `/resources/*` -> Dedicated resource pages (categories, customers, products, etc.)

All top-level routes are guarded with `authGuard` to keep navigation policy centralized.

## Runtime Composition

`src/app/app.config.ts` composes the app with standalone providers.

- `provideRouter(routes)` for route setup
- `provideHttpClient(withInterceptors(...))` for request pipeline
- `provideAppEnvironment(environment)` for typed runtime config
- `provideApiClient()` to bind generated client base URL from config
- `GlobalErrorHandler` for uncaught app errors

### Interceptor Chain

Interceptors are configured in a specific order:

1. `authInterceptor`
2. `loadingInterceptor`
3. `errorHandlingInterceptor`

This keeps token concerns, UI loading state, and transport/domain error translation separated.

## API Layer Design

OpenAPI-generated code lives in `src/app/api/generated` and should not be edited by hand.

Handwritten wrappers in `src/app/api/facades` provide:

- stable feature-facing methods (`getAll`, `getById`, `add`, `update`, `delete`)
- cache behavior via a shared base facade (`shareReplay` pattern)
- minimal translation between generated operations and feature needs

Benefits:

- generated code can be safely regenerated
- feature code depends on stable facade contracts, not generated internals
- endpoint naming noise is hidden from UI and feature services

## Feature Logic Patterns

### 1. Home Feature (reference pattern)

`HomeFacade` uses signals + RxJS for a predictable read model.

- signal state stores list data and UI state
- computed view model derives filtered/sorted/paged output
- RxJS stream debounces search input and cancels stale requests

This pattern demonstrates how async and UI state are combined cleanly.

### 2. API Explorer Feature (diagnostics-first)

API Explorer is intentionally generic and payload-driven.

- focuses on endpoint diagnostics and manual JSON request payloads
- uses resource services optimized for exploratory operations

This feature is intentionally less opinionated in presentation to support troubleshooting.

### 3. Resource Pages Feature (domain-focused UX)

Dedicated resource pages use per-resource VM facades in:

- `src/app/features/resources/services/vm/*`

Key elements:

- `BaseResourceCrudVmFacade<TDto>`
  - common CRUD flow orchestration
  - computed search/sort/paging
  - request/error/loading state transitions
  - page-entry lifecycle via `onPageEnter()`
- concrete facades (categories, customers, orders, products, etc.)
  - domain-tailored sample payload templates
  - route/page defaults (primary id, search seed, page size)
  - domain-specific selected-item presentation mappers
  - domain-specific mutation result mappers
- `ResourceVmRegistryService`
  - resolves the correct facade from route `resourceKey`

Outcome:

- dedicated pages no longer rely on generic JSON details
- each resource controls its own page defaults and display semantics

## UI State and Data Flow

For dedicated resource pages, the flow is:

1. Route activates with a `resourceKey`.
2. `ResourcePageComponent` asks `ResourceVmRegistryService` for a facade.
3. Facade `onPageEnter()` applies defaults and optional auto-load.
4. User actions call facade methods (`reload`, `fetchById`, `createSample`, etc.).
5. Facade updates signal state.
6. Template renders computed VM output and detail sections.

This keeps components thin and makes behavior highly testable.

## Presentation Mapping Strategy

Resource VMs output two kinds of detail sections:

- `fields`: label/value cards
- `table`: tabular metrics

Each resource facade can override:

- `mapSelectedItemSections(value)`
- `mapMutationResultSections(value)`

A base fallback exists, but resource-specific overrides provide clearer business context.

## Error Handling Strategy

Error handling is layered:

- transport and API errors are normalized in core error handling/interceptors
- facades keep friendly message text in VM state
- views show local error blocks for operation context
- global handler catches uncaught failures

This provides both local clarity and global safety.

## Testing Strategy

Current tests cover:

- shared UI building blocks and utilities
- core services, guards, and interceptors
- API facades with `HttpTestingController`
- app shell and feature-level behavior

A shared facade test utility reduces duplication:

- common TestBed setup
- common request assertion helpers (`expectGet`, `expectPost`, `expectPut`, `expectDelete`)

## Key Implementation Choices and Rationale

1. Standalone Angular APIs
- Reduces NgModule overhead and keeps composition explicit.

2. OpenAPI code generation
- Prevents hand-maintained endpoint drift and keeps DTO contracts typed.

3. Facade boundary between features and generated client
- Protects feature code from regeneration churn and operation naming details.

4. Signals + computed VM for feature state
- Improves readability, deterministic derivations, and template performance.

5. Resource-specific VM facades for dedicated pages
- Moves behavior/presentation ownership to domain services.
- Avoids generic JSON-heavy UI for end-user resource pages.

6. Separate diagnostics explorer from dedicated pages
- Keeps troubleshooting flexibility without polluting feature UX.

## Trade-offs

- Maintaining both diagnostics services and resource VM facades introduces parallel abstractions.
- Client-side search/sort/paging is simple and responsive, but may not scale to very large datasets without server-driven pagination/filtering.
- Domain-specific presentation mappers require incremental updates as API schemas evolve.

## Operational Commands

- `npm run api:generate`
- `npm run lint`
- `npm run test`
- `npm run build:prod`

## Extension Guidance

When adding a new resource:

1. Ensure OpenAPI includes the resource and regenerate clients.
2. Add/extend API facade methods in `src/app/api/facades`.
3. Create a new resource VM facade under `src/app/features/resources/services/vm`.
4. Provide page defaults, sample payload templates, and presentation mappers.
5. Register it in `ResourceVmRegistryService`.
6. Add a route in `resources.routes.ts` and navigation entry.
7. Add facade tests and any VM/page tests needed.
