# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

## Project Overview

This is a minimalist TypeScript Dependency Injection (DI) library called `tinytsdi`. The library is
designed to facilitate testing with type-safe dependency injection, focusing on simplicity without
decorators or runtime reflection, and includes hierarchical injector support.

## Development Commands

### Testing

- `pnpm test` - Run tests in watch mode with Vitest
- `pnpm run test:run` - Run tests once

### Code Quality

- `pnpm check` - Run all quality checks typecheck + lint + test at once
- `pnpm typecheck` - Run TypeScript compiler type checking (no emit)
- `pnpm lint` - Run ESLint and Prettier checks
- `pnpm lint:fix` - Auto-fix ESLint issues
- `pnpm format` - Format code with Prettier

## Architecture (Based on Design Document)

The library implements a simple but powerful dependency injection system with the following core
concepts:

### Core API Functions

- `register(providers, allowOverrides?)` - Register providers with the global injector
- `inject(id, default?)` - Resolve dependencies from the global injector
- `getInjector()` - Get the current global injector instance

### Hierarchical Injector Methods

- `injector.fork()` - Create child injector with current injector as parent
- `Injector.from(injector, copyCache?, copyParent?)` - Copy injector with optional parent
  preservation

### Core Types

- `Injector` - Main class for managing dependencies and caching
- `Token<T>` - Type-safe unique keys for dependencies
- `InjectionId<T>` - Union type for tokens or constructors
- `InjectFn` - Type alias for `typeof inject` used in factory functions

### Provider Types

- **Constructor Provider** (shorthand) - Classes with no args or single `InjectFn` arg
- **ClassProvider<T>** - Associates constructor with injection ID, optional `injectFn` and `noCache`
  properties
- **FactoryProvider<T>** - Uses factory function, optional `noCache` property
- **ValueProvider<T>** - Provides static values, never cached
- **ExistingProvider<T>** - Aliases one injection ID to another

### Key Design Principles

- **Type Safety**: Heavily uses TypeScript's type system for compile-time safety
- **Testing Focus**: Easy to create test injectors and override dependencies
- **Simplicity**: No decorators or runtime reflection
- **Hierarchical Support**: Child injectors can inherit from and override parent providers
- **Async Support**: Providers can return promises for async dependencies
- **Caching Control**: Optional `noCache` property controls singleton (cached) vs transient (always
  new) resolution

### Dependency Injection Patterns

- **Parameter Injection**: Functions can accept injected dependencies as default parameters
- **Service Locator**: Classes can call `inject()` directly in their methods
- **Constructor Injection**: Classes can optionally receive `InjectFn` as constructor parameter when
  `injectFn: true` is set

### Testing Support

- `newTestInjector(options?: InjectorOptions)` - Create test injector
- `setTestInjector(injector)` - Set custom test injector
- `removeTestInjector()` - Restore previous injector
- `injector.invalidate()` - Clear cached dependencies
- `injector.unregister()` - Remove providers

## Key Files

- `src/index.ts` - Main library implementation
- `docs/design/v3_ideas.md` - v3.0.0 feature ideas and implementation status
- `tsconfig.json` - Strict TypeScript configuration with ES2022 target
- `vitest.config.ts` - Test configuration with type checking enabled
- `eslint.config.js` - ESLint configuration with TypeScript and Prettier integration

## Development Notes

- The project uses ES modules exclusively (`"type": "module"`)
- Unit test files should be named `*.test.ts` in the `src/test/` directory

## Code Style Guidelines

### TypeScript Style Guide

Use best practices closely aligned with Google TypeScript style guide.

#### File structure

Follow the file structure convention. Files should generally follow this structure:

- `JSDoc description` if present, should be at the top of the file. Followed by a blank line.

- Imports, if present, grouped as defined by the `eslint` rules.

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

- Use JSDoc file-level documentation in complex / long files.
- Use JSDoc comments for exported symbols, unless they are obviously self-explanatory (via semantic
  naming).
- Omit `@param` and `@returns` descriptions if semantic naming + typing provides sufficient context.

#### Tests

- Use `vitest` for testing with TypeScript support.
- Use `describe` and `it` blocks to organize tests.
- Use `expect` assertions for testing values.
- Descriptions for `describe` should be noun-like (e.g., "a route", "a unit") and for `it` should be
  descriptive (e.g., "does X" instead of "should do X").
- Include edge cases and error handling in tests.
