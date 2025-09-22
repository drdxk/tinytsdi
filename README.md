# tinytsdi Monorepo

Minimalistic TypeScript Dependency Injection library and related tooling, managed as a monorepo
using Turborepo and pnpm workspaces.

[→ `tinytsdi` documentation](./packages/tinytsdi/README.md)

## Structure

```
docs/                  # Project TODOs and design notes
packages/
   config-eslint/     # Shared ESLint config
   config-typescript/ # Shared TypeScript config
   e2e-core/          # End-to-end tests
   tinytsdi/          # Main DI library
```

## Packages

- [`packages/tinytsdi`](./packages/tinytsdi/README.md): Minimalistic DI library for TypeScript

## Scripts

All scripts are managed via Turborepo and available at the root:

- `build`: build all packages
- `check`: run typecheck, lint, and test:run
- `dev`: run dev/watch tasks
- `e2e`: run end-to-end tests
- `fix`: run formatters and autofixes
- `fox`: fix then check (convenience)
- `lint`: run linters
- `test`: interactive tests (watch)
- `test:run`: test in CI/once mode
- `typecheck`: type-check all packages
- `pub`: publish packages (after build)
- `root:check`: same as `root:lint`
- `root:fix`: format markdown files
- `root:fox`: format then check markdown
- `root:lint`: lint markdown files

Normal dev flow is:

1. `dev` to run dev tasks in watch mode
1. modify code, update documentation
1. `check` to verify everything is fine

## Contribution

Feel free to open issues. Most development happens off GitHub at the moment.

## Documentation

- [project TODO](./docs/design/todo.md)

## License

ISC © Dmytro Kossa
