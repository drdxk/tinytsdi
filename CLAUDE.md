# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## Project Overview

A minimalist TypeScript Dependency Injection library called `tinytsdi`. Focuses on type-safe
dependency injection for testing without decorators or runtime reflection.

This is a monorepo managed with Turborepo and pnpm workspaces containing:

- `packages/tinytsdi/` - Main DI library
- `packages/config-eslint/` - Shared ESLint configuration
- `packages/config-typescript/` - Shared TypeScript configuration
- `packages/e2e-core/` - End-to-end tests for the core library

## Development Commands

**Root level (runs across all packages via Turborepo):**

- `pnpm check` - Run all quality checks (typecheck + lint + test:run + e2e)
- `pnpm build` - Build all packages
- `pnpm dev` - Run watchers (typecheck:watch + test in watch mode)
- `pnpm test` - Interactive tests (watch mode)
- `pnpm test:run` - Run tests once (CI mode)
- `pnpm typecheck` - TypeScript type checking
- `pnpm lint` - Run linters (eslint + prettier)
- `pnpm fix` - Run formatters and autofixes
- `pnpm fox` - Fix then check (convenience command)
- `pnpm e2e` - Run end-to-end tests

**Package level (in packages/tinytsdi/):**

- `pnpm test:run` - Run vitest tests once
- `pnpm test` - Run vitest in watch mode
- `pnpm typecheck` - TypeScript checking with tsc --noEmit
- `pnpm typecheck:watch` - TypeScript checking in watch mode
- `pnpm build` - Build the library (removes dist/ and runs vite build)

## Key Architecture

**Core Module Structure:**

- `src/index.ts` - Main exports
- `src/injector.ts` - Injector class implementation
- `src/global.ts` - Global container API
- `src/providers.ts` - Provider type definitions and logic
- `src/token.ts` - Token creation and management
- `src/types.ts` - Public TypeScript types
- `src/types_internal.ts` - Internal type definitions
- `src/constants.ts` - Shared constants
- `src/errors.ts` - Custom error classes

**Global API**: `register()`, `inject()`, `getInjector()` **Injector Methods**: `injector.copy()`,
`injector.fork()` **Provider Types**: Constructor (shorthand), Class, Factory, Value, Existing
**Testing**: `newTestInjector()`, `setTestInjector()`, `removeTestInjector()`

## Development Notes

- Dual build output: ES modules (main) + CommonJS (dist/cjs/, dist/esm/)
- Tests: `packages/tinytsdi/src/test/*.test.ts` (vitest with describe/it blocks)
- Compile tests: `packages/tinytsdi/src/compile-test/*.ct.ts` (type-only verification)
- E2E tests: `packages/e2e-core/src/*.e2e.test.ts`
- Prefer `function` keyword for top-level declarations
- Uses pnpm workspaces with catalog dependencies for version management
- Turborepo handles task orchestration and caching

**Quick debugging:**

- Type errors → `pnpm typecheck` (or `typecheck:watch` for live feedback)
- Test failures → `pnpm test` for watch mode, `pnpm test:run` for CI mode
- Lint issues → `pnpm fox` (fixes then checks)
