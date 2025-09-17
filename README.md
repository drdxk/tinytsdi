# tinytsdi Monorepo

Minimalistic TypeScript Dependency Injection library and related tooling, managed as a monorepo using Turborepo and pnpm workspaces.

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

## Packages

- [`packages/tinytsdi`](./packages/tinytsdi/README.md): Minimalistic DI library for TypeScript

## Scripts

All scripts are managed via Turborepo and available at the root:
- `build`, `test`, `lint`, `fix`, `typecheck`, `pub`

## Contribution

Feel free to open issues or PRs. Most development happens off GitHub, but contributions are welcome!

## Documentation (somewhat outdated)

- [Design Docs](./docs/design/original%20design%20doc.md)
- [v3 Ideas](./docs/design/v3_ideas.md)

## License

ISC © Dmytro Kossa
