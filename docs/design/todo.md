## Next releases:

### Next goal overview

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

Implementation:

- Add `container.ts` with `install()` and `uninstall()` methods and associated types (`Container`,
  `InstallMode`).
  - also `getContainer(): Container | null` that will be used by the `global`.
  - Also `uninstallAll()` that clears the stack.
- Container stack is stored in a module local `stack: Container[]` variable.
- `global.ts`:
  - `getInjector()`, `deleteInjector()` - first check if `getContainer()` return a container,
    - if so, pass the call through to the currently installed container.
    - if not, install the default container, then call `getContainer()`. If the second
      `getContainer()` does not return a container, throw `ThisShouldNeverHappenTMError`.
    - `getOrCreateContainer()` local function does this and guarantees to return a `Container`.

Implementation phases:

- v3.2: `container.ts` implementation; `getInjector()`, `deleteInjector()` simply check
  `getContainer()`, if it returns null, continue with the current flow (check test injector, check
  or create default injector).
  - `install`, `uninstall`, `uninstallAll`, `Container`, `InstallMode` are re-exported from
    `/index`.
- v3.3: `containers/test.ts` (test container) implementation (available as a standalone, mark
  current test methods as deprecated to be removed in v4); exported as `/tc` in the distro. write
  tests and e2e tests.
- v3.3.1: convert current test global methods to install / uninstall and use the test container. all
  existing tests should pass unmodified.
- v3.4: `containers/default.ts` (default container) implementation (not available from anywhere).
  write tests.
- v 3.4.1: convert existing global container to use the default one under the hood
  (`getOrCreateContainer()` described above). mark `init` as deprecated in favor of something that
  configures the default container (likely with `InjectorOptions`).
- eventually v4: drop deprecated methods, delete tests.

Existing mapping for default / test containers:

- `init()`:
  - v3.4.1: mark as deprecated in favor of `init(InjectorOptions)` (almost compatible, so maybe only
    mark `testInjectorAllowed` as deprecated)?
  - v3.4.1: `installDefaultContainer(options)`

- `resetInitForTestOnly`:
  - v3.4.1: mark as deprecated to be deleted, or maybe keep around as default container's uninstall
    call.

- `getInjector()`:
  - v3.2: check `getContainer` first, if null proceed as current.
  - v3.3.1: remove special handling for test container.
  - v3.4.1: calls `getOrCreateContainer().getInjector()`.

- `deleteInjector()`:
  - v3.2: check `getContainer` first, if null proceed as current.
  - v3.4.1: if `getContainer` return nulls exit silently, otherwise call
    `container.deleteInjector()`.

- `newTestInjector()`:
  - v3.3.1: `checkTestInjectorAllowed` should also check if current contain is a test one. If not,
    it should initialize test container (using stack). Then call test container's `newTestInjector`.
  - v3.3.1: mark as deprecated in the favor of the above.
  - v4: delete

- `setTestInjector()`:
  - same as `newTestInjector()`.

- `removeTestInjector()`:
  - similar to `newTestInjector()`
  - v3.3.1: if the current container is the test container, uninstall it.
  - v4: delete

Q: How to check if the current container is X (only needed internally)?

- compare `getContainer().getInjecor` (functions, not injectors) ?

Test container:

- `import {installTestContainer} from 'tinytsdi/tc'`
- `installTestContainer(mode)` - calls `install()` with a test container, passing through `mode`

Default container might look like (implicit):

- `import {installDefaultContainer} from 'tinytsdi/dc'`
- `installDefaultContainer()` - calls `install()`, code is the same as currently except for doesn't
  have testing methods.

### v3.2. Add container infrastructure with `install()` / `uninstall()` API

#### Step 1: Define types, error class, and container module

**Files to create:** `src/container.ts`

- Define `Container` interface with:
  - `getInjector(): Injector`
  - `deleteInjector(): void`
- Define `InstallMode` enum with values:
  - `THROW` - Throw error if container already installed (default)
  - `OVERRIDE` - Pop current container and push new one
  - `STACK` - Push new container on top of stack
- Add module-level variable: `const stack: Container[] = []`
- Implement `getContainer(): Container | null`
  - Return `stack[stack.length - 1]` if stack not empty, otherwise `null`
- Implement `install(container: Container, mode: InstallMode = InstallMode.THROW): void`
  - If `stack.length > 0` and `mode === InstallMode.THROW`:
    - Throw `ContainerAlreadyInstalledError`
  - If `mode === InstallMode.OVERRIDE` and stack not empty:
    - Call `stack.pop()`
  - Push `container` onto stack
- Implement `uninstall(): void`
  - Pop from stack (no-op if empty)

**Files to modify:** `src/errors.ts`

- Add `ContainerAlreadyInstalledError` class following existing pattern:
  - Extends `Error`
  - Sets `this.name = 'ContainerAlreadyInstalledError'`
  - Constructor with message about container already being installed

#### Step 2: Unit tests for container.ts

**Files to create:** `src/test/container.test.ts`

Test coverage for `container.ts` module:

- `getContainer()` returns null when stack is empty
- `install()` with default mode (THROW) adds container to stack
- `install()` with THROW mode throws `ContainerAlreadyInstalledError` when stack not empty
- `install()` with OVERRIDE mode replaces current container (pops old, pushes new)
- `install()` with OVERRIDE mode works when stack is empty (no pop, just push)
- `install()` with STACK mode adds container on top of existing stack
- `install()` with STACK mode works when stack is empty
- `uninstall()` removes top container from stack
- `uninstall()` is no-op when stack is empty (doesn't throw)
- `getContainer()` returns most recently installed container
- Multiple installs with STACK mode create proper stack (LIFO behavior on uninstall)
- Container methods (`getInjector`, `deleteInjector`) are callable on returned container
- Stack operations maintain correct order: install A, install B with STACK, uninstall → A is current

#### Step 3: Compile tests for container.ts

**Files to create:** `src/compile-test/container.ct.ts`

- Import from `'../container'`
- Verify `Container` interface structure (has `getInjector` and `deleteInjector` methods)
- Verify `install()` parameter types and accepts objects implementing `Container` interface
- Verify `uninstall()` signature (no parameters, returns void)
- Verify `getContainer()` returns `Container | null`

**Note:** Do NOT verify InstallMode enum values in compile tests

#### Step 4: Integrate container into global.ts

**Files to modify:** `src/global.ts`

- Import `getContainer` from `'./container'`
- Update `getInjector()`:
  - First check `getContainer()` - if not null, return `container.getInjector()`
  - Then check `testInjector` - if exists, return it (current behavior)
  - Otherwise, lazy-create default injector (current behavior)
- Update `deleteInjector()`:
  - First check `getContainer()` - if not null, call `container.deleteInjector()` and return
  - Otherwise, proceed with current behavior (check testInjector, clear injector)

**Note:** Container takes precedence over testInjector. Order is: container → testInjector → default

#### Step 5: Unit tests for global.ts container integration

**Files to modify:** `src/test/global.test.ts`

Add test coverage for global.ts integration with containers:

- `getInjector()` uses container's injector when installed
- `getInjector()` checks container BEFORE testInjector (container takes precedence)
- `getInjector()` falls back to testInjector when no container installed (current behavior)
- `getInjector()` falls back to default injector when neither container nor testInjector exist
- `deleteInjector()` delegates to container's `deleteInjector()` when installed
- `deleteInjector()` proceeds with normal flow when no container installed
- After `uninstall()`, global functions revert to previous behavior
- Stacked containers: top container takes precedence for `getInjector()`
- Order verification: container → testInjector → default
- After container is uninstalled, testInjector becomes active if it exists

#### Step 6: Export new APIs

**Files to modify:** `src/index.ts`

- Export `install`, `uninstall`, `getContainer` from `'./container'`
- Export `Container` type from `'./container'`
- Export `InstallMode` enum from `'./container'`
- Export `ContainerAlreadyInstalledError` from `'./errors'`

#### Step 7: E2E tests

**Files to create:** `packages/e2e-core/src/container.e2e.test.ts`

Test coverage:

- Create a simple custom container implementation with `getInjector()` and `deleteInjector()`
- Install with default mode (THROW) and verify `inject()` and `register()` work correctly
- Verify `ContainerAlreadyInstalledError` is thrown on second install without mode
- Verify container lifecycle: install → use → uninstall → reinstall
- Verify OVERRIDE mode: install container1 → install container2 with OVERRIDE → verify container2
  active → verify container1 no longer in stack
- Verify STACK mode: install container1 → install container2 with STACK → verify container2 active →
  uninstall → verify container1 active
- Verify existing global API functions (`inject()`, `register()`, `getInjector()`) work with custom
  containers
- Verify providers registered in one container are isolated from another container

#### Step 8: Documentation updates

**Files to modify:**

- `CHANGELOG.md` - Document new APIs under v3.2:
  - `install(container, mode)` function with all three InstallMode options
  - `uninstall()` function
  - `getContainer()` function
  - `Container` interface
  - `InstallMode` enum (THROW, OVERRIDE, STACK)
  - `ContainerAlreadyInstalledError` error class
  - Explain precedence order: container → testInjector → default
  - Explain use cases for each InstallMode

#### Step 9: README examples

**Files to modify:**

- `README.md` - Add "Custom Containers" section with:
  - Explanation of container concept and architecture
  - Basic custom container implementation example
  - Example using `install()` with default THROW mode
  - Example using OVERRIDE mode to replace containers
  - Example using STACK mode for hierarchical/nested containers
  - Example of `uninstall()` for cleanup
  - Explanation of when to use each InstallMode:
    - THROW: Single container applications, fail-fast on mistakes
    - OVERRIDE: Hot-swapping containers, testing different configurations
    - STACK: Nested scopes, temporary overrides with automatic restoration

### v3.3. Create test container module

#### Step 1: Create test container module

**Files to create:** `src/tc.ts`

- Import `install` from `'./container'`
- Import `InstallMode` from `'./container'`
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
- Function `initTestContainer(mode: InstallMode = InstallMode.STACK): void`
  - Call `install({ getInjector, deleteInjector }, mode)`

#### Step 2: Compile tests

**Files to create:** `src/compile-test/tc.ct.ts`

- Import from `'../tc'`
- Verify `newInjector()` parameter types (optional options) and return type `Injector`
- Verify `setInjector()` parameter type `Injector` and return type `Injector`
- Verify `removeInjector()` has no parameters and returns void
- Verify `initTestContainer()` parameter type (optional `InstallMode`) and returns void
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
- `initTestContainer()` installs a container successfully with default mode (STACK)
- `initTestContainer()` throws `ContainerAlreadyInstalledError` when called twice with THROW mode
- `initTestContainer()` allows override when mode is OVERRIDE
- `initTestContainer()` allows stacking when mode is STACK (default)
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

### v3.3.1. Migrate global test methods to use test container

#### Step 1: Implement helper to check if current container is test container

**Files to modify:** `src/tc.ts`

- Add internal function to check identity:
  - `export function isTestContainer(container: Container | null): boolean`
  - Return `container?.getInjector === getInjector` (compare function references)

#### Step 2: Update global test methods to delegate to test container

**Files to modify:** `src/global.ts`

- Import `isTestContainer`, `initTestContainer` from `'./tc'`
- Import `getContainer` from `'./container'`
- Import test container functions: `newInjector as tcNewInjector`, `setInjector as tcSetInjector`,
  `removeInjector as tcRemoveInjector`
- Update `newTestInjector(options?: InjectorOptions)`:
  - Call `checkTestInjectorAllowed()` (existing behavior)
  - If `!isTestContainer(getContainer())`, call `initTestContainer(InstallMode.STACK)`
  - Return `tcNewInjector(options)`
- Update `setTestInjector(injector: Injector)`:
  - Call `checkTestInjectorAllowed()` (existing behavior)
  - If `!isTestContainer(getContainer())`, call `initTestContainer(InstallMode.STACK)`
  - Return `tcSetInjector(injector)`
- Update `removeTestInjector()`:
  - If `isTestContainer(getContainer())`, call `uninstall()` from `'./container'`
  - Call `tcRemoveInjector()`

#### Step 3: Remove special testInjector handling in getInjector/deleteInjector

**Files to modify:** `src/global.ts`

- Update `getInjector()`:
  - Remove testInjector check (now handled by container)
  - Order becomes: container → default injector
- Update `deleteInjector()`:
  - Remove testInjector special handling
  - Order becomes: container → default injector

**Note:** This should be done carefully - the container check now covers test injector cases

#### Step 4: Verify existing tests pass

**Tests to verify:**

- All existing tests in `src/test/global.test.ts` should pass without modification
- All existing tests using global test methods should continue to work
- Test isolation should still work correctly

#### Step 5: Documentation updates

**Files to modify:**

- `CHANGELOG.md` - Document internal refactoring in v3.3.1 (user-facing behavior unchanged)
- Note that deprecated methods now delegate to test container internally

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
