---
description: Unit test creation and maintenance standards for Angular (Vitest + TestBed) test work in this repository.
applyTo: "src/**/*.spec.ts,src/**/testing/**/*.ts"
---

# Unit Test Instructions: Angular (Vitest)

## Purpose and Scope
These instructions define how GitHub Copilot should create and maintain unit tests in this repository.

Scope restriction:
- These instructions apply only to creating and maintaining unit tests (`*.spec.ts`) and their direct test support files (files under `testing/` directories).
- These instructions do not apply to production feature development, refactoring, or infrastructure tasks.

Hard constraints:
- Do not modify any production source file (any non-spec, non-`testing/` file under `src/`) while building or updating unit tests.
- Use the Angular CLI unit-test builder (`@angular/build:unit-test`) with Vitest as the test runner. Do not introduce Karma, Jasmine, or Jest.
- Use Angular testing utilities (`TestBed`, `ComponentFixture`, `HttpTestingController`, `RouterTestingHarness`, etc.) from `@angular/core/testing`, `@angular/common/http/testing`, and `@angular/router/testing`.
- Test files (`*.spec.ts` and `testing/` files) must be excluded from the production build configuration (`tsconfig.app.json`) and included in the spec configuration (`tsconfig.spec.json`).
- Each spec file tests exactly one production file, and each test support file exports one primary symbol (one class, function, or constant).
- Do not write tests for generated code in `src/app/api/generated/` (output of `ng-openapi-gen`). Test the facades, mappers, and providers that wrap it instead.

## How This Instructions File Is Used
When a request involves creating, updating, or validating unit tests, Copilot must:
1. Follow this file as the primary standard for spec file placement, naming, implementation style, and validation.
2. Generate any missing spec files and test cases required by these rules.
3. Validate test execution and fix spec/support-file issues until tests run successfully (without changing production files).
4. Keep all test artifacts aligned with these requirements over time.

## Spec File Placement Rules
Angular convention is to co-locate each spec file with the file it tests.

Rules:
- The spec file sits in the same directory as the file under test and has the same base name with a `.spec.ts` suffix.
  - Example: `src/app/core/services/logger.ts` -> `src/app/core/services/logger.spec.ts`.
  - Example: `src/app/features/home/components/home/home.ts` -> `src/app/features/home/components/home/home.spec.ts`.
- Do not create a separate test project or a parallel test directory tree.

## Test Support File Rules
Reusable test support code lives in a `testing/` directory placed beside (or above) the code that uses it, at the narrowest level that covers all consumers.

Requirements:
- `testing/` directories may contain:
  - Test doubles (stubs, fakes, spies) for services, guards, interceptors, and other injectables.
  - TestBed setup helpers (for example, `src/app/api/facades/testing/setup-facade-testbed.ts`).
  - Test data builders and fixture factories.
- Name support files by function in kebab-case (for example, `fake-logger.service.ts`, `category.builder.ts`, `setup-facade-testbed.ts`).
- Static test resources (for example, JSON fixtures) belong in a `testing/resources/` subdirectory and are imported, not fetched at runtime.
- Support files must never be imported by production code.

## Coverage Requirements: Files
Each production TypeScript file containing testable logic must have a matching spec file. This includes components, directives, pipes, services, guards, resolvers, interceptors, facades, mappers, and utility functions.

Rules:
- If a matching spec file does not exist, create it.
- Pure type/model files (interfaces, type aliases, constant-only config) and route definition files do not require spec files unless they contain logic.
- Validate the created spec by running the tests.

## Coverage Requirements: Members
Each public method, property, signal, `input()`, `output()`, `model()`, computed value, and exported function must have one or more matching test cases.

Rules:
- If a matching test case does not exist, create it.
- Tests must cover every logic path, including edge cases, error paths, and empty/null/undefined inputs.
- Test `private` and `protected` members indirectly through the public API or rendered template; never access them via bracket notation or `as any`.
- Validate tests after creating or updating test cases.

## Spec Structure and Naming Conventions
Structure:
- One top-level `describe` per spec file, named after the symbol under test (for example, `describe('LoggerService', ...)`, `describe('authInterceptor', ...)`).
- One nested `describe` per member under test (for example, `describe('getCategories', ...)`).
- `it` descriptions state the expected behavior and start with a verb in present tense (for example, `it('returns an empty list when the API responds with no items', ...)`).
- Include a creation smoke test (for example, `it('creates the component', ...)`) for injectables and components. It supplements, and never replaces, behavior tests.

Test cases must:
- Follow the Arrange, Act, Assert pattern, with the three sections visually separated by a blank line.
- Be independent of execution order and of each other.

Variable rules:
- Prefer local `const` variables inside each test.
- Shared state declared with `let` inside a `describe` is allowed only for the TestBed-provided subject and test infrastructure (for example, `fixture`, `component`, `service`, `httpMock`), and must be reassigned in `beforeEach`.
- Do not use underscore prefixes on variables.
- Use `SCREAMING_SNAKE_CASE` only for module-level constants (for example, `const DOMAIN_URL = '/api/...';`).

## Angular Testing Practices
TestBed configuration:
- Configure with standalone components and functional providers: `imports: [MyComponent]`, `providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]`. Do not use `HttpClientTestingModule` or `RouterTestingModule`.
- Replace dependencies with doubles via `{ provide: Token, useValue: double }`. Use `TestBed.overrideComponent` only when a component-level provider must be replaced.
- Do not use `NO_ERRORS_SCHEMA` or `CUSTOM_ELEMENTS_SCHEMA` to hide unknown elements; render real child components, or replace them with `TestBed.overrideComponent(..., { set: { imports: [...] } })` using a minimal stand-in.
- Use `TestBed.inject()` to obtain services; use `inject()` (inside an injection context) rather than constructor injection in test helper classes.
- Do not call `TestBed.configureTestingModule()` after `TestBed.createComponent()` or `TestBed.inject()` in the same test. Configure once, then create. `TestBed` resets automatically between tests; do not add manual `TestBed.resetTestingModule()` calls.
- Run functional guards, resolvers, and interceptors inside `TestBed.runInInjectionContext()`.
- Test routing with `RouterTestingHarness` and `provideRouter(routes)`; assert on the navigated component and `Router` URL rather than spying on `Router.navigate` internals.

Components:
- Test through the rendered DOM as a user would: query with `fixture.nativeElement` / `fixture.debugElement`, interact via DOM events, then assert on rendered output. Prefer queries by role, label, or text; use `data-testid` attributes only when no accessible query is practical. Do not query by styling classes.
- Set signal inputs (including `input.required()` and `model()`) with `fixture.componentRef.setInput('name', value)`, before the first change detection pass. Do not assign to input properties directly, and do not reach into component internals to set state. This also works for `OnPush` components.
- Applications are zoneless (the default in current Angular versions): do not import or rely on `zone.js`, `fakeAsync`, `tick`, `flush`, `waitForAsync`, or `ComponentFixtureAutoDetect`. Await `fixture.whenStable()` after interactions or state changes; call `fixture.detectChanges()` only where a synchronous, explicit render is required.
- Outside of a component fixture, use `TestBed.tick()` to flush effects and pending change detection (for services using `effect()`, `computed()`, `linkedSignal()`, `resource()`, or `httpResource()`).
- Test `@defer` blocks with `fixture.getDeferBlocks()` and `DeferBlockBehavior`/`DeferBlockState` rather than waiting on real triggers.
- Test signals and computed values through the public API: set the writable signal or input, then assert the derived value or rendered output.
- Use component harnesses (`@angular/cdk/testing`) when a library provides them, and write harnesses for reusable shared components.

HTTP:
- Provide `provideHttpClient()` (with the same `withInterceptors(...)`/`withFetch()` features the code under test needs) followed by `provideHttpClientTesting()`.
- Use `HttpTestingController`: assert with `expectOne`/`match` (verify method, URL, params, headers, and body), respond with `flush` or `error`, and call `httpMock.verify()` in `afterEach`.
- Never perform real network calls.

Async and timing:
- Use Vitest fake timers (`vi.useFakeTimers()`, `vi.advanceTimersByTime()`) for timer-based behavior, and restore with `vi.useRealTimers()` in `afterEach`.
- Prefer `async`/`await` with `firstValueFrom` for Observables, or explicit subscriptions with assertions inside the test. Always unsubscribe or complete long-lived subscriptions created by a test.
- Never use arbitrary real-time waits (`setTimeout` sleeps); await `fixture.whenStable()`, a promise, or advance fake timers.

Doubles and spies:
- Use `vi.fn()` and `vi.spyOn()`; restore spies with `vi.restoreAllMocks()` in `afterEach` when they patch real objects. Create `vi.fn()` doubles per test (or in `beforeEach`) so call history never leaks between tests; use `vi.mocked()` for typed access to mocked functions.
- Type doubles with `Partial<T>` or `Pick<T, ...>` cast to the real token type rather than `any`.
- Prefer doubles of the facade/service layer over mocking `HttpClient` directly, except in tests of the facades and interceptors themselves.

## Validation and Error Correction
After creating or updating tests, verify all unit tests run successfully.

Requirements:
- Run `npm test` (which runs `ng test --watch=false`).
- Run `npm run lint` and `npm run format:check`; fix issues in spec and support files.
- Correct discovered spec/support-file errors, including TypeScript strict-mode and `strictTemplates` errors.
- Do not alter production files to make tests pass. If a production defect is found, report it instead of fixing it.

## Appendix A: Additional Best Practices and Recommendations
These recommendations supplement the required rules above.

1. Test design quality
- Keep each test focused on one behavior.
- Prefer one assertion theme per test.
- Use explicit input values to make intent obvious.
- Include happy-path, boundary, null/empty, invalid input, and error-path tests where applicable.
- Use `it.each` (or a loop of `it` calls) for table-driven cases instead of duplicating test bodies.

2. Deterministic tests
- Avoid reliance on current time, random values, `localStorage`/`sessionStorage`, `window.location`, network calls, and environment-specific behavior unless fully controlled by doubles, fake timers, or injected tokens.
- Use stable test data and controlled setup.

3. Readability and maintainability
- Keep Arrange, Act, Assert sections visually clear.
- Use descriptive variable names without underscore prefixes.
- Avoid unnecessary mocking; prefer simple, behavior-focused tests that assert observable outcomes (rendered DOM, emitted values, HTTP requests, returned results) over implementation details.
- Avoid `toBeTruthy()` except for creation smoke tests; assert specific values.

4. Doubles and resources
- Place reusable doubles and setup helpers in the nearest shared `testing/` directory.
- Keep one-off doubles local to the spec file.
- Keep test resources in `testing/resources/` and import them so they are type-checked and bundled predictably.

5. Coverage discipline
- Add tests for both positive and negative outcomes.
- Add regression tests when defects are found.
- Ensure new members are not left without matching tests.
- Use `ng test --coverage` (requires `@vitest/coverage-v8`) to identify untested branches.

6. File hygiene
- Keep one subject under test per spec file and one primary export per support file.
- Do not leave focused or skipped tests (`it.only`, `describe.only`, `it.skip`, `describe.skip`) in committed code.
- Keep imports ordered: Angular/third-party first, then relative imports, separated by a blank line.

7. Execution workflow recommendation
- Create or update tests incrementally per file.
- Run tests frequently during changes (for example, `ng test` in watch mode, or `ng test --include <path>` for a single spec).
- Resolve failures immediately before moving to the next file.
