# Changelog

## [3.1.0] - TBD

### Added

- Provider targeting with `at` property
  - All provider types (`ValueProvider`, `ClassProvider`, `FactoryProvider`, `ExistingProvider`) now support optional `at?: TagValue` property
  - Providers with `at` property will only register on injectors with matching tags
  - Providers without `at` property register on the current injector (existing behavior)
- Tag type and constants
  - `TagValue` type for string or symbol tag values
  - `TAG_ROOT` constant - automatically added for any injector without parent that doesn't
    explicitly specify one
  - `TAG_SINK` constant - sink injector ignores `at` property of providers and registers all
    incoming providers

## [3.0.0] - 2025.09.21

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
  - `new Injector(defaultAllowOverrides, parent)` → `new Injector({defaultAllowOverrides, parent})`
  - `new Injector(true)` → `new Injector({defaultAllowOverrides: true})`
  - `new Injector(false, parent)` → `new Injector({parent})`
  - `new Injector()` continues to work unchanged
- **BREAKING**: `Injector.from()` static method removed - use `injector.copy()` instance method
  instead
  - `Injector.from(source, copyCache, copyParent)` →
    `source.copy({copyCache, parent: copyParent ? undefined : null})`
  - `Injector.from(injector, true)` → `injector.copy({copyCache: true})`
  - `Injector.from(injector, false, false)` → `injector.copy({parent: null})`
  - `Injector.from(injector)` → `injector.copy()`
  - **Note**: `FromOptions` interface removed along with `Injector.from()`
- **BREAKING**: `newTestInjector()` simplified - removed `fromCurrent` functionality
  - v2.x: `newTestInjector(fromCurrent?, allowOverrides?)` - positional arguments
  - v3.x: `newTestInjector(options?: InjectorOptions)` - accepts only basic injector options
  - Migration from v2.x:
    - `newTestInjector(true, true)` →
      `const injector = getInjector().copy({defaultAllowOverrides: true}); setTestInjector(injector);`
    - `newTestInjector(false, true)` → `newTestInjector({defaultAllowOverrides: true})`
    - `newTestInjector(true)` → `setTestInjector(getInjector().copy());`
    - `newTestInjector()` → No change needed
- **BREAKING**: Renamed `Config` interface to `ContainerConfig`
  - Update any references of `Config` to `ContainerConfig`: `import type {Config}` →
    `import type {ContainerConfig}`

### Fixed

- Clear cached resolved value when a provider is overridden

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
- `CopyOptions` interface for configuring injector copying with `injector.copy()`
  - `copyCache?: boolean` - Copy cached values from source injector (default: false)
  - `parent?: Injector | null` - Parent injector for copy (default: current instance's parent)
  - `defaultAllowOverrides?: boolean` - Override setting for new injector (default: current
    instance's setting)
- `FromOptions` interface for configuring injector copying with `Injector.from()` (**deprecated**)
  - `copyCache?: boolean` - Copy cached values from source injector (default: false)
  - `noParent?: boolean` - Exclude parent injector relationship (default: false)
  - `defaultAllowOverrides?: boolean` - Override setting for new injector

### Changed

- Cached behavior is now the default for class and factory providers

## [2.1.0] - 2025.08.30

### Added

- Hierarchical injectors with `from()` method to create child injectors.

### Changed

- Migrated to pnpm for package management.
- Vite is now the default build tool.

## [2.0.0] - 2025.07.05

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

## [1.0.1] - 2025.07.01

### Fixed

- Fixed repository link in package.json
- Refined file inclusion patterns in package.json

## [1.0.0] - 2025.07.01

### Added

- Initial release of tinytsdi - Minimalistic TypeScript Dependency Injection library
- Core dependency injection functionality with type safety
- Support for singleton and transient scoping
- Testing utilities for easy dependency mocking
- Constructor, factory, value, and existing provider types
- Async dependency support
