# CLAUDE.md

## Project Structure

- `packages/tinytsdi/` - Main DI library
- `packages/config-eslint/` - Shared ESLint configuration
- `packages/config-typescript/` - Shared TypeScript configuration
- `packages/e2e-core/` - End-to-end tests for the core library

## Development Notes

- Tests: `packages/tinytsdi/src/test/*.test.ts` (vitest with describe/it blocks)
- Compile tests: `packages/tinytsdi/src/compile-test/*.ct.ts` (type-only verification)
- E2E tests: `packages/e2e-core/src/*.e2e.test.ts`
- Prefer `function` keyword for top-level declarations
- Uses pnpm workspaces with catalog dependencies for version management
- Use pnpm commands to manage dependencies
- Turborepo handles task orchestration and caching
- Prefer to run commands from root (e.g., `pnpm test` not `cd packages/tinytsdi && pnpm test`)
- See README.md for each respective package for specifics
- Remind to keep documentation (README.md, TODO.md, CHANGELOG.md) up to date with any changes
