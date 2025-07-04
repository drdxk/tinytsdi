# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a minimalist TypeScript Dependency Injection (DI) library called `tinytsdi`. The library is designed to facilitate testing with type-safe dependency injection, focusing on simplicity without decorators, runtime reflection, or hierarchy support.

## Development Commands

### Testing
- `npm test` - Run tests in watch mode with Vitest
- `npm run test:run` - Run tests once
- `npm run test:watch` - Run tests in watch mode (same as `npm test`)
- `npm run test:ui` - Run tests with Vitest UI
- `npm run test:coverage` - Generate test coverage report

### Code Quality
- `npm run typecheck` - Run TypeScript compiler type checking (no emit)
- `npm run lint` - Run ESLint and Prettier checks
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run format` - Format code with Prettier

## Architecture (Based on Design Document)

The library implements a simple but powerful dependency injection system with the following core concepts:

### Core API Functions
- `register(providers, allowOverrides?)` - Register providers with the global injector
- `inject(id, default?)` - Resolve dependencies from the global injector
- `getInjector()` - Get the current global injector instance

### Core Types
- `Injector` - Main class for managing dependencies and caching
- `Token<T>` - Type-safe unique keys for dependencies
- `InjectionId<T>` - Union type for tokens or constructors
- `InjectFn` - Type alias for `typeof inject` used in factory functions
- `InjectScope` - Either `'singleton'` or `'transient'`

### Provider Types
- **Constructor Provider** (shorthand) - Classes with no args or single `InjectFn` arg
- **ClassProvider<T>** - Associates constructor with injection ID, requires explicit scope
- **FactoryProvider<T>** - Uses factory function, requires explicit scope
- **ValueProvider<T>** - Provides static values, never cached
- **ExistingProvider<T>** - Aliases one injection ID to another

### Key Design Principles
- **Type Safety**: Heavily uses TypeScript's type system for compile-time safety
- **Testing Focus**: Easy to create test injectors and override dependencies
- **Simplicity**: No decorators, reflection, or complex hierarchy
- **Async Support**: Providers can return promises for async dependencies
- **Scoping**: Singleton (cached) vs transient (always new) resolution

### Dependency Injection Patterns
- **Parameter Injection**: Functions can accept injected dependencies as default parameters
- **Service Locator**: Classes can call `inject()` directly in their methods
- **Constructor Injection**: Classes receive `InjectFn` as constructor parameter

### Testing Support
- `newTestInjector(fromCurrent?, allowOverrides?)` - Create test injector
- `setTestInjector(injector)` - Set custom test injector
- `removeTestInjector()` - Restore previous injector
- `injector.invalidate()` - Clear cached dependencies
- `injector.unregister()` - Remove providers

## Key Files

- `src/index.ts` - Main library implementation
- `TODO.v2..md` - Complete design document and API specification
- `tsconfig.json` - Strict TypeScript configuration with ES2022 target
- `vitest.config.ts` - Test configuration with type checking enabled
- `eslint.config.js` - ESLint configuration with TypeScript and Prettier integration

## Development Notes

- The project uses ES modules exclusively (`"type": "module"`)
- No build step required - library is used directly from TypeScript source
- Test files should be named `*.test.ts` or `*.spec.ts` in the `src/` directory
- The library is production-ready (version 1.0.0)
- Implementation is complete and follows the design document specifications

## Code Style Guidelines

### TypeScript Style Guide

Use best practices closely aligned with Google TypeScript style guide, with some modifications for our project.

#### File structure

Follow the file structure convention. Files should generally follow this structure:

- `@fileoverview` if present, should be at the top of the file. Followed by a blank line.

- Imports, if present, grouped as follows:
  - Node.js built-in modules (e.g., `fs`, `path`)
  - Third-party libraries (e.g., `express`, `lodash`)
  - Local imports (e.g., `./myModule`, `../utils`)
- Each import group should be separated by a blank line.
- Each import should be on a separate line.
- Imports group is followed by a blank line.

- Constants and types should be declared before functions and classes.

- Exported symbols in logical order:
  - Exported constants
  - Exported types/interfaces
  - Exported functions
  - Exported classes

- Non-exported symbols, in logical order (usually call order).

- Each top level symbol is separated by a blank line.

#### Functions

- Prefer `function` keyword for top-level function declarations.

#### JSDoc

- Use `@fileoverview` for file-level documentation in complex / long files.
- Use JSDoc comments for exported symbols, unless they are obviously self-explanatory (via semantic naming).
- Omit `@param` and `@returns` descriptions if semantic naming + typing provides sufficient context.
- When a function of `@fileoverview` comment, including comment characters fits on a single line, use a single-line comment. Otherwise, use a multi-line comment.

#### Tests

- Use `vitest` for testing with TypeScript support.
- Use `describe` and `it` blocks to organize tests.
- Use `expect` assertions for testing values.
- Descriptions for `describe` should be noun-like (e.g., "a route", "a unit") and for `it` should be descriptive (e.g., "does X" instead of "should do X").
- Include edge cases and error handling in tests.