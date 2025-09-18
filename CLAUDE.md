# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## Project Overview

A minimalist TypeScript Dependency Injection library called `tinytsdi`. Focuses on type-safe
dependency injection for testing without decorators or runtime reflection.

## Development Commands

- `pnpm check` - Run all quality checks (typecheck + lint + test)
- `pnpm test:run` - Run tests once
- `pnpm typecheck` - TypeScript type checking

## Key Architecture

- **Global API**: `register()`, `inject()`, `getInjector()`
- **Injector Methods**: `injector.copy()`, `injector.fork()`
- **Provider Types**: Constructor (shorthand), Class, Factory, Value, Existing
- **Testing**: `newTestInjector()`, `setTestInjector()`, `removeTestInjector()`

## Development Notes

- ES modules only (`"type": "module"`)
- Tests in `src/test/*.test.ts`
- Use `vitest` for testing with `describe`/`it` blocks
- Prefer `function` keyword for top-level declarations
