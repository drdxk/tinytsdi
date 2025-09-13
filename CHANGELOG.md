# Changelog

## [3.0.0] - WIP

### Breaking Changes

- **BREAKING**: Replaced `scope` property with optional `noCache` boolean in `ClassProvider<T>` and
  `FactoryProvider<T>`
  - `scope: 'singleton'` → remove property (now the default)
  - `scope: 'transient'` → `noCache: true`
- **BREAKING**: Removed `InjectScope` type (`'singleton' | 'transient'`)
  - Remove any imports or references to `InjectScope` type
- **BREAKING**: Class providers no longer automatically pass inject function to constructors by
  default
  - Previous behavior: All class constructors received inject function as first parameter
  - New behavior: Constructors receive inject function only when `injectFn: true` is explicitly set
  - Migration: Add `injectFn: true` to existing class providers whose constructors expect inject
    function
- **BREAKING**: `Injector` constructor now uses options object instead of positional arguments
  - `new Injector(defaultAllowOverrides, parent)` →
    `new Injector({ defaultAllowOverrides, parent })`
  - `new Injector(true)` → `new Injector({ defaultAllowOverrides: true })`
  - `new Injector(false, parent)` → `new Injector({ parent })`
  - `new Injector()` continues to work unchanged
- **BREAKING**: `Injector.from()` static method now uses options object instead of positional
  arguments
  - `Injector.from(source, copyCache, copyParent)` →
    `Injector.from(source, { copyCache, noParent: !copyParent })`
  - `Injector.from(injector, true)` → `Injector.from(injector, { copyCache: true })`
  - `Injector.from(injector, false, false)` → `Injector.from(injector, { noParent: true })`
  - `Injector.from(injector)` continues to work unchanged
- **BREAKING**: `newTestInjector()` now uses options object instead of positional arguments
  - `newTestInjector(fromCurrent, allowOverrides)` →
    `newTestInjector({ fromCurrent, defaultAllowOverrides })`
  - `newTestInjector(true)` → `newTestInjector({ fromCurrent: true })`
  - `newTestInjector(false, true)` → `newTestInjector({ defaultAllowOverrides: true })`
  - `newTestInjector(true, true)` →
    `newTestInjector({ fromCurrent: { defaultAllowOverrides: true } })`
  - `newTestInjector()` continues to work unchanged
  - **Type:**
    `TestInjectorOptions = { fromCurrent: FromOptions | true } | { fromCurrent?: false, defaultAllowOverrides?: boolean }`
    - Passing `true` is equivalent to `{ fromCurrent: true }` (copy providers from global injector)
    - Passing `false` is equivalent to `{}` (create new injector with defaults)
  - `newTestInjector()` continues to work unchanged

### Added

- Optional `noCache?: boolean` property for explicit control over caching behavior
- Optional `injectFn?: boolean` property in class providers to control whether constructors receive
  the inject function
  - `injectFn: true` - Constructor receives inject function as first parameter (required for
    constructors that expect it)
  - `injectFn: false` or omitted - Constructor called with no arguments (default behavior)
- `InjectorOptions` interface for configuring injector creation
  - `defaultAllowOverrides?: boolean` - Allow provider overrides by default
  - `parent?: Injector` - Parent injector for hierarchical injection
- `FromOptions` interface for configuring injector copying with `Injector.from()`
  - `copyCache?: boolean` - Copy cached values from source injector (default: false)
  - `noParent?: boolean` - Exclude parent injector relationship (default: false)
  - `defaultAllowOverrides?: boolean` - Override setting for new injector
- `TestInjectorOptions` interface for configuring test injector creation
  - `{ fromCurrent: FromOptions | true }` - Copy providers from current global injector (optionally
    with options)
  - `{ fromCurrent?: false, defaultAllowOverrides?: boolean }` - Create new injector, optionally
    allowing provider overrides

### Changed

- Cached behavior is now the default for class and factory providers

## [2.1.0] - 2025-08-30

### Added

- Hierarchical injectors with `from()` method to create child injectors.

### Changed

- Migrated to pnpm for package management.
- Vite is now the default build tool.

## [2.0.0] - 2025-07-05

### Breaking Changes

- **BREAKING**: `newTestInjector()` now automatically sets the newly created injector as the current
  test injector
- **BREAKING**: Proper package exports (CJS, ESM, Types)

### Added

- CommonJS support for compatibility
- Proper dual package support (ESM/CJS) with correct exports configuration
- Types declarations included.

### Changed

- Updated TypeScript configuration to extend from `tsconfig.build.json`
- Removed unnecessary TypeScript compiler options
- Improved build system with separate configurations for types, ESM, and CJS

## [1.0.1] - 2025-07-01

### Fixed

- Fixed repository link in package.json
- Refined file inclusion patterns in package.json

## [1.0.0] - 2025-07-01

### Added

- Initial release of tinytsdi - Minimalistic TypeScript Dependency Injection library
- Core dependency injection functionality with type safety
- Support for singleton and transient scoping
- Testing utilities for easy dependency mocking
- Constructor, factory, value, and existing provider types
- Async dependency support
