## Next releases:

#### Next goal overview

- `install()` allows to create own "DI container" using library methods, since global `inject()` and
  `register()` simply call `getInjector()[method])()`.
  - API:
  - `install(container: Container, mode: InstallMode = InstallMode.THROW)`
    - where `Container` has `getInjector()` and `deleteInjector()` methods.
    - `InstallMode` is an enum `THROW, OVERRIDE, STACK`:
      - `THROW` default, throws if another container is already installed
        (`ContainerAlreadyInstalledError`)
      - `OVERRIDE` overrides the existing injector (pop the current injector, add the new one)
      - `STACK` adds the container on top of the stack.
  - `uninstall()` removes current container (popping it from the stack)
- Container is expected to have its own `init()` / configuration function - where it does the
  install and configuration.
- Container can expose additional methods; all that matter is that global `inject()` and
  `register()` work correctly.

Existing mapping:

- In `global.ts` store `container` if installed.
- `install()` sets the container, checking if one is already installed. Check `allowOverride` flag,
  throw `ContainerAlreadyInstalledError` if not allowed.
- `uninstall()` sets `container = undefined` (does NOT clear `injector` or `testInjector` to
  preserve current functionality).
- `init()` -> not modified in v3.2, continues to work with default injector only.
- `getInjector()` -> check if `testInjector` exists (return it), then check if `container` exists
  (return `container.getInjector()`), otherwise proceed with current default behavior.
- `deleteInjector()` -> check if `container` exists (call `container.deleteInjector()`), otherwise
  proceed with current default behavior.
- `newTestInjector()`, `setTestInjector()`, `removeTestInjector()` -> not modified in v3.2, no
  interaction with custom containers.

Test container:

- `import {installTestContainer} from 'tinytsdi/tc'`
- `installTestContainer(mode)` - calls `install()` with a test container, passing through `mode`

How default container might look like (implicit):

- `import {installDefaultContainer} from 'tinytsdi/dc'`
- `installDefaultContainer()` - calls `install()`, code is the same as currently except for doesn't
  have testing methods.

Before v4:

- Document the fact that this means that other global functions will not work (they will be marked
  as deprecated as of v3.4).

### v3.2. Global: add `install()` and `uninstall()` API functions

#### Step 1: Define Container interface and error class

**Files to modify:** `src/global.ts`

- Add `Container` interface with:
  - `getInjector(): Injector`
  - `deleteInjector(): void`

**Files to modify:** `src/errors.ts`

- Add `ContainerAlreadyInstalledError` class

#### Step 2: Add container management to global.ts

**Files to modify:** `src/global.ts`

- Add module-level variable: `let container: Container | undefined`
- Implement `install(container: Container, allowOverride: boolean = false)`
  - Check if `container` already exists
  - Throw `ContainerAlreadyInstalledError` if exists and `allowOverride === false`
  - Set the `container` variable
- Implement `uninstall()`
  - Set `container = undefined`

#### Step 3: Modify getInjector() and deleteInjector()

**Files to modify:** `src/global.ts`

- Update `getInjector()`:
  - If `container` exists, return `container.getInjector()`
  - If `testInjector` exists, return it (current behavior)
  - Otherwise, lazy-create default injector (current behavior)
- Update `deleteInjector()`:
  - If `container` exists, call `container.deleteInjector()`
  - Otherwise, set `injector = undefined` (current behavior)

#### Step 4: Export new APIs

**Files to modify:** `src/index.ts`

- Export `install` and `uninstall` from `global.ts`
- Export `Container` type from `global.ts`
- Export `ContainerAlreadyInstalledError` from `errors.ts`

#### Step 5: Compile tests

**Files to modify:** `src/compile-test/global.ct.ts`

- Add new `describe` block for `install()` function
- Verify `install()` accepts objects implementing `Container` interface
- Verify `install()` parameter types (container and optional allowOverride boolean)

#### Step 6: Unit tests

**Files to create:** `src/test/global.container.test.ts`

Test coverage:

- `install()` sets a container successfully
- `install()` throws `ContainerAlreadyInstalledError` when called twice without `allowOverride`
- `install()` allows override when `allowOverride = true`
- `uninstall()` removes the container
- `uninstall()` does NOT clear `injector` or `testInjector` variables
- `getInjector()` uses container's injector when installed
- `getInjector()` checks container AFTER testInjector but BEFORE default injector
- `deleteInjector()` delegates to container's `deleteInjector()` when installed
- Verify test injector still takes precedence over container injector
- Verify fallback to default injector when no container installed

#### Step 7: E2E tests

**Files to create:** `packages/e2e-core/src/global.container.e2e.test.ts`

Test coverage:

- Create a simple custom container implementation
- Install it and verify `inject()` and `register()` work correctly
- Verify container lifecycle (install → use → uninstall → reinstall)
- Verify existing global API functions still work with custom container

#### Step 8: Documentation updates

**Files to modify:**

- `CHANGELOG.md` - Document new APIs under v3.2

#### Step 9: README examples

**Files to modify:**

- `README.md` - Add section on custom containers with example implementation showing how to create
  and use a custom container

### v3.3. Create test container module

#### Step 1: Create test container module

**Files to create:** `src/tc.ts`

- Module-level variable: `let injector: Injector | undefined`
- Function `getInjector(): Injector`
  - If `injector` is undefined, create new `Injector({ tag: TAG_SINK })`
  - Return `injector`
- Function `deleteInjector(): void`
  - Set `injector = undefined`
- Function `newInjector(options?: InjectorOptions): Injector`
  - Merge options with defaults: `{ tag: TAG_SINK, ...options }`
  - Create new `Injector` with merged options
  - Call `setInjector(newInjectorInstance)`
  - Return the injector
- Function `setInjector(injectorInstance: Injector): Injector`
  - Set `injector = injectorInstance`
  - Return the injector
- Function `removeInjector(): void`
  - Set `injector = undefined`
- Function `initTestContainer(allowOverride: boolean = false): void`
  - Call `install({ getInjector, deleteInjector }, allowOverride)` from `global.ts`

#### Step 2: Compile tests

**Files to create:** `src/compile-test/tc.ct.ts`

- Import from `'../tc'`
- Verify `newInjector()` parameter types (optional options) and return type `Injector`
- Verify `setInjector()` parameter type `Injector` and return type `Injector`
- Verify `removeInjector()` has no parameters and returns void
- Verify `initTestContainer()` parameter type (optional allowOverride boolean) and returns void
- Verify `getInjector()` returns `Injector`
- Verify `deleteInjector()` returns void

#### Step 3: Unit tests

**Files to create:** `src/test/tc.test.ts`

Test coverage:

- Import from `'../tc'`
- `getInjector()` creates injector lazily with `TAG_SINK` when undefined
- `getInjector()` returns same instance on multiple calls
- `deleteInjector()` clears the injector
- `getInjector()` recreates injector with `TAG_SINK` after `deleteInjector()`
- `newInjector()` creates new injector with `TAG_SINK` by default
- `newInjector()` calls `setInjector()` internally
- `newInjector()` returns the created injector
- `newInjector()` allows custom tag in options
- `newInjector()` allows custom `defaultAllowOverrides` in options
- `newInjector()` allows custom `parent` in options
- `newInjector()` replaces existing injector
- `setInjector()` sets the module injector
- `setInjector()` returns the injector
- `removeInjector()` clears the injector
- `initTestContainer()` installs a container successfully
- `initTestContainer()` throws `ContainerAlreadyInstalledError` when called twice without
  `allowOverride`
- `initTestContainer()` allows override when `allowOverride = true`
- Verify global `inject()` and `register()` work with installed test container
- After `initTestContainer()`, calling `uninstall()` removes container
- After `uninstall()`, module `injector` variable is still set (not cleared)
- Can call `initTestContainer()` again after `uninstall()`

#### Step 4: Export tc module as separate entry point

**Files to modify:** `package.json` (in `packages/tinytsdi/`)

- Add exports configuration for `./tc`:
  ```json
  "exports": {
    ".": {
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js"
    },
    "./tc": {
      "import": "./dist/esm/tc.js",
      "require": "./dist/cjs/tc.js"
    }
  }
  ```

**Files to modify:** `src/index.ts`

- Do NOT export anything from `tc.ts` - it's a separate entry point

**Note:** Verify build process handles multiple entry points correctly

#### Step 5: E2E tests for tc module

**Files to create:** `packages/e2e-core/src/tc.e2e.test.ts`

Test coverage:

- Import from `'tinytsdi/tc'` (actual built package import path)
- Test `newInjector()`, `setInjector()`, `removeInjector()` functions work correctly
- Test `getInjector()` and `deleteInjector()` functions work correctly
- Use `initTestContainer()` to set up test isolation between tests
- Verify providers registered in test container don't leak across tests
- Verify `TAG_SINK` behavior: providers with `at` property are registered locally
- Verify lifecycle: `initTestContainer()` → register/inject → `uninstall()` → `initTestContainer()`
  again
- Verify test container with custom parent injector works correctly

#### Step 6: Add deprecation notices

**Files to modify:** `src/global.ts`

Add JSDoc `@deprecated` tags with migration guidance:

- `newTestInjector()`:

  ````typescript
  /**
   * @deprecated Use `newInjector()` from 'tinytsdi/tc' instead. Will be removed in v4.0.0.
   *
   *   Migration example:
   *
   *   ```typescript
   *   // Before:
   *   import {newTestInjector} from 'tinytsdi';
   *   newTestInjector(options);
   *
   *   // After:
   *   import {initTestContainer, newInjector} from 'tinytsdi/tc';
   *   initTestContainer();
   *   newInjector(options); // if you need to set options
   *   ```
   */
  ````

- `setTestInjector()`:

  ````typescript
  /**
   * @deprecated Use `setInjector()` from 'tinytsdi/tc' instead. Will be removed in v4.0.0.
   *
   *   Migration example:
   *
   *   ```typescript
   *   // Before:
   *   import {setTestInjector} from 'tinytsdi';
   *   setTestInjector(injector);
   *
   *   // After:
   *   import {initTestContainer, setInjector} from 'tinytsdi/tc';
   *   initTestContainer();
   *   setInjector(injector);
   *   ```
   */
  ````

- `removeTestInjector()`:
  ````typescript
  /**
   * @deprecated Use `removeInjector()` from 'tinytsdi/tc' instead. Will be removed in v4.0.0.
   *
   *   Migration example:
   *
   *   ```typescript
   *   // Before:
   *   import {removeTestInjector} from 'tinytsdi';
   *   removeTestInjector();
   *
   *   // After:
   *   import {removeInjector} from 'tinytsdi/tc';
   *   removeInjector();
   *   ```
   */
  ````

#### Step 7: Documentation updates

**Files to modify:**

- `CHANGELOG.md` - Document `tinytsdi/tc` module and all exported functions under v3.3
- `CHANGELOG.md` - Document deprecations with migration guide

#### Step 8: README examples

**Files to modify:**

- `README.md` - Add section on test containers with examples:
  - Import path: `import { initTestContainer } from 'tinytsdi/tc'`
  - Basic usage: `initTestContainer()` in test setup
  - Advanced usage: `newInjector()`, `setInjector()`, `removeInjector()`
  - Test isolation pattern with `beforeEach` and `afterEach`
  - Custom options example with `newInjector()`
- `README.md` - Update testing section to recommend `tinytsdi/tc` over deprecated global functions
- `README.md` - Add migration note for users upgrading from v3.2 or earlier

### v3.4. Create default container

- Same as above, but for default container in `src/dc.ts`, doesn't have testing methods, basically
  just `getInjector()` and `deleteInjector()`.
- Use `InjectorOptions` for initialization options.

### v.3.4.1. Use default container in global functions

- Modify `global.ts` to use default container if no container is installed, per mapping above. All
  existing tests should pass unmodified.

## Not scheduled yet:

### 1. `node-als` either as a submodule or separate script in the built directory

(NOT exported from index!):

- exports global conainer API that supports forking for async contexts:

```typescript
const als = new AsyncLocalStorage(); // Create this in a factory method.

// Same as global#getInjector().
export function getRootInjector(): Injector {
  // ...
}

// To be used to set up async context
export function runWithFork(fn: (injector: Injector) => void) {
  const injector = getRootInjector().fork();
  als.run(injector, () => {
    fn(injector);
  });
}

export function inject() {
  const injector = als.getStore() || getRootInjector();
  // ...
}

// alternatively with hijack:
hijackGlobalContext(() => als.getStore() || getRootInjector());

// same for register()

export function registerAtRoot() {
  // TThoughts: I sort of feel like this is the proper way of doing root registrations,
  // rather than having providers knowledgably about hierarchy, but lack foresight here.
  getRootInjector().register();
}

// test provider functionality shouldn't really change.
```

### 2. Based on that, express middleware (definitely a submodule):

```typescript
// app.use(requestInjector)
export function requestInjector(_req, _res, next) {
  runWithFork(() => {
    next();
  }
}


// const configureInjector = (injector: Injector) => {
//    injector.register(/* ... */);
// };
// app.use(requestInjectorAnd(configureInjector))
export function requestInjectorAnd(configFn: (injector: Injector) => void) {
  return (req, res, next) => {
    runWithFork((injector) => {
      configFn(injector);
      next();
    });
  };
}

// const providers = [{provide: REQUEST_ID, useValue: 123}];
// app.use(requestInjectorProviders(providers))
export function requestInjectorProviders(providers: Provider[]) {
  return (req, res, next) => {
    runWithFork((injector) => {
      injector.register(providers);
      next();
    });
  };
}

// or maybe let's just create options with both injector and providers?
```

Add example.

### 3. And a fastify plugin:

```typescript
import fp from 'fastify-plugin';

async function requestInjector(fastify, opts) {
  fastify.addHook('onRequest', (request, reply, done) => {
  runWithFork(() => {
    done();
  });
}

// not sure if needed
export default fp(requestInjector);
```

Test, add an example.

### 4. Add a browser example / test

Like within a react app running off vite or something. Maybe create a React context provider + a
hook that creates and returns a configured context provider.

## v-ANY:

### 0. Hierarchy support for meta methods

### 1. Add generated documentation

With `tsdoc-markdown` or probably more like `typedoc`+ `typedoc-plugin-markdown`.

### 2. Add human written documentation

- Terminology / concepts (NestJS might confuse people on what a provider is)
- Some guides on how to use the library in different contexts
- Include testing setups

### 3. Changesets if versioning management becomes a pain
