# Copilot Instructions: Repository-Wide Guidance

## Purpose
This file contains cross-cutting guidance for this Angular application. Follow current Angular best practices (see https://angular.dev) even where existing code predates them.

## Unit Test Instructions
Detailed unit test creation and maintenance rules are defined in `.github/instructions/unit-tests.instructions.md`.

When the task is unit-test related, follow that scoped file-instructions document for:
- Angular CLI `@angular/build:unit-test` builder with Vitest and `TestBed` requirements.
- Co-located `*.spec.ts` placement and `testing/` support-file mapping.
- Coverage, naming, and structure conventions.
- Validation workflow and supporting test assets.

## Angular Best Practices

### Architecture
- Use standalone components, directives, and pipes only. Do not create `NgModule`s. Do not set `standalone: true` explicitly (it is the default).
- Organize by feature (`features/<name>/`) with shared code in `shared/` and app-wide singletons in `core/`. Keep one concept per file.
- Lazy-load feature routes with `loadComponent` / `loadChildren`. Use functional guards, resolvers, and interceptors.
- Provide app-wide services with `providedIn: 'root'` or in `app.config.ts` using `provide*` functions; use `InjectionToken`s for configuration.
- Treat generated code (`src/app/api/generated/`) as read-only; regenerate it with `npm run api:generate` and wrap it in facades, mappers, and providers.

### Components and templates
- Set `changeDetection: ChangeDetectionStrategy.OnPush` on every component.
- Use `input()`, `input.required()`, `output()`, and `model()` instead of `@Input`, `@Output`, and two-way decorators. Use `viewChild()`, `viewChildren()`, `contentChild()`, and `contentChildren()` signal queries instead of decorator queries.
- Put host bindings and listeners in the `host` object of the decorator; do not use `@HostBinding` or `@HostListener`.
- Use built-in control flow (`@if`, `@for` with a `track` expression, `@switch`, `@defer`) instead of `*ngIf`, `*ngFor`, and `*ngSwitch`.
- Use `[class.x]` / `[class]` and `[style.x]` / `[style]` bindings instead of `ngClass` and `ngStyle`.
- Use `NgOptimizedImage` for static images (not for inline base64 images).
- Keep templates simple: no complex logic or function calls that do real work; move derived values to `computed()`. Do not assume globals (for example `new Date()`) are available in templates. Use the `async` pipe or signals to consume Observables in templates.
- Prefer inline templates for small components and external `templateUrl` / `styleUrl` files for larger ones, using paths relative to the component file.
- Use the Angular template/forms APIs correctly: prefer Reactive Forms (or Signal Forms where stable) with typed controls over template-driven forms.
- Meet accessibility requirements: pass AXE checks and WCAG AA, including focus management, color contrast, and ARIA attributes.

### State and reactivity
- Use signals for local and shared state. Use `computed()` for derived state and `linkedSignal()` for state derived from other state that can also be written. Use `update()` or `set()` on signals; never `mutate()`.
- Keep state transformations pure and predictable. Prefer `computed()` and `linkedSignal()` over `effect()`; use `effect()` only for side effects that cannot be expressed declaratively.
- Use `resource()` / `httpResource()` for signal-based async data where appropriate; use RxJS for event streams and complex asynchronous composition. Clean up subscriptions with `takeUntilDestroyed()` or the `async` pipe.

### TypeScript and dependency injection
- Enable and respect strict type checking (`strict`, `strictTemplates`). Prefer type inference when the type is obvious; avoid `any` (use `unknown` when the type is uncertain).
- Use the `inject()` function instead of constructor parameter injection.
- Use `readonly` for properties initialized by Angular (inputs, outputs, queries, injected services) and for values that never change. Use `protected` for members used only by the template, and `private` for internal members.
- Follow the current Angular style guide for naming: kebab-case file names that match the primary symbol, a `.spec.ts` suffix for tests, and meaningful, consistent class names.
- Services have a single responsibility. Components should delegate data access and business logic to services/facades.

### Security and performance
- Never bypass Angular sanitization (`bypassSecurityTrust*`) without a documented, reviewed justification. Never store secrets in source control or the client bundle.
- Prefer zoneless change detection (the default in current Angular versions); do not depend on `zone.js` behavior.
- Keep bundles within the configured budgets; use `@defer` and lazy routes for non-critical UI.

## Tooling and Validation
- Install with `npm ci`; build with `npm run build` / `npm run build:prod`; lint with `npm run lint`; test with `npm test`; format with `npm run format` (check with `npm run format:check`).
- Use the Angular CLI (`ng generate ...`) to scaffold new artifacts so they follow current defaults.
- Resolve lint, format, and strict-type errors in changed files before considering a task complete.

## Global Guardrails
- Keep instructions scoped to the task at hand.
- Avoid changing unrelated files.
- Preserve existing repository structure and conventions unless the task requires an update.
