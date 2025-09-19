# tinytsdi Monorepo

Minimalistic TypeScript Dependency Injection library and related tooling, managed as a monorepo
using Turborepo and pnpm workspaces.

[→ `tinytsdi` documentation](./packages/tinytsdi/README.md)

## Structure

```
apps/           # Example applications (currently empty)
docs/           # Design docs and ideas
packages/       # Core library and future packages
  tinytsdi/     # Main DI library
```

## Getting Started

1. **Install dependencies:**
   ```bash
   pnpm install
   ```
2. **Build all packages:**
   ```bash
   pnpm build
   ```
3. **Run checks and tests:**
   ```bash
   pnpm check
   ```
4. **Fix, format, and check:**
   ```bash
   pnpm fox
   ```
5. **Dev mode (watchers):**
   ```bash
   pnpm dev
   ```

## Packages

- [`packages/tinytsdi`](./packages/tinytsdi/README.md): Minimalistic DI library for TypeScript

## Scripts

All scripts are managed via Turborepo and available at the root:

- build: build all packages
- check: run typecheck, lint, and test:run
- dev: run watchers (typecheck:watch + test)
- fix: run formatters and autofixes
- fox: fix then check (convenience)
- lint: run linters
- test: interactive tests (watch)
- test:run: test in CI/once mode
- typecheck: type-check all packages
- pub: publish packages (after build)

## Contribution

Feel free to open issues or PRs. Most development happens off GitHub, but contributions are welcome!

## Documentation

- [project TODO](./docs/design/todo.md)

## License

ISC © Dmytro Kossa
