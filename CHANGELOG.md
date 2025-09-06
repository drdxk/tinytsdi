# Changelog

## [3.0.0] - WIP

### Breaking Changes

- **BREAKING**: Replaced `scope` property with optional `noCache` boolean in `ClassProvider<T>` and `FactoryProvider<T>`
  - `scope: 'singleton'` → remove property (now the default)
  - `scope: 'transient'` → `noCache: true`
- **BREAKING**: Removed `InjectScope` type (`'singleton' | 'transient'`)
  - Remove any imports or references to `InjectScope` type

### Added

- Optional `noCache?: boolean` property for explicit control over caching behavior

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

- **BREAKING**: `newTestInjector()` now automatically sets the newly created
  injector as the current test injector
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

- Initial release of tinytsdi - Minimalistic TypeScript Dependency Injection
  library
- Core dependency injection functionality with type safety
- Support for singleton and transient scoping
- Testing utilities for easy dependency mocking
- Constructor, factory, value, and existing provider types
- Async dependency support
