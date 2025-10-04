## Next releases:

### v3.1. Support hierarchy-aware providers with tags

#### Overview

`InjectorOptions` has `tag: string|Symbol` property, defaulting to `root` if no parent and `null`
otherwise. Internally, tag is storied as a `Symbol`, strings converted with `Symbol.for()`.

Providers have `at?: string|Symbol` option, which if specified, will register the provider only if
the injector has the matching tag. If not, will pass to parent, and so on. If no matching injector
is found, throw an error.

- Special tag for `root` assigned by default.
- Special tag for `sink` for testing: injector tagged with sink ignores `at` option and register the
  provider itself.

- Add tag to constructor options and `fork`
- Add tag to `newTestInjector()`

#### Plan

**1. ✅ Core Infrastructure (`src/types.ts`):**

- Add `TAG_ROOT = Symbol.for('root')` and `TAG_SINK = Symbol.for('sink')` constants
- Add `TagValue = string | symbol` type
- Add `normalizeTag(tag: TagValue): symbol` utility function
- Update compile tests (`src/compile-test/types.ct.ts`):
  - Test `TagValue` accepts both string and symbol types, rejects invalid types
  - Test `TAG_ROOT` and `TAG_SINK` constants have correct symbol types
  - Test `normalizeTag` function signature accepts `TagValue` and returns symbol
  - Test type compatibility between string/symbol inputs and symbol outputs
- Update runtime tests (`src/test/types.test.ts`):
  - Test `normalizeTag` function with string and symbol inputs, verify correct symbol output

**2. ✅ Provider Extensions (`src/providers.ts`):**

- Add `at?: TagValue` property to: `ValueProvider<T>`, `ClassProviderWithInjectFn<T>`,
  `ClassProviderNoArgs<T>`, `FactoryProvider<T>`, `ExistingProvider<T>`
- Note: Constructor shorthand providers do NOT get `at` property (maintains simplicity)
- Update compile tests for each provider type:
  - `providers.value.ct.ts`: Test `at` property accepts string/symbol values, rejects invalid types,
    maintains Provider<T> assignability
  - `providers.class.ct.ts`: Test `at` property works with both `injectFn` variants and `noCache`
    option combinations
  - `providers.factory.ct.ts`: Test `at` property works with both no-args and InjectFn factories,
    compatible with `noCache` option
  - `providers.existing.ct.ts`: Test `at` property maintains type compatibility between source and
    target tokens
- Update runtime predicate tests (`src/test/providers.test.ts`):
  - Add test cases for each provider type with `at` property to ensure predicate functions work
    correctly
  - Test combinations of `at` with existing options (`noCache`, `injectFn`) don't break predicate
    logic
- Update `CHANGELOG.md` draft entry for v3.1.0.

**3. ✅ Injector Changes, constructor (`src/injector.ts`):**

- Extend `InjectorOptions` with `tag?: TagValue` property
- Add private `tag: symbol | null` field to Injector class
- Constructor if no tag is specified: assign `TAG_ROOT` if no parent, `null` if has parent
  - if tag is specified: store normalized tag with `normalizeTag()`
- Add `getTag(): symbol | null` method
- Add `getParent(): Injector | null` method as a drive-by
- Update compile tests (`src/compile-test/injector.constructor.ct.ts`):
  - Test `tag` property accepts string values, symbol values, and `undefined` (not specified)
  - Test `tag` property rejects invalid types (numbers, objects, arrays, etc.)
  - Test `tag` property works in combination with existing options (`defaultAllowOverrides`,
    `parent`)
  - Test `TAG_ROOT` and `TAG_SINK` constants are assignable to `tag` property
- Update runtime tests (`src/test/injector.create.test.ts`):
  - Test constructor assigns `TAG_ROOT` when no parent, `null` when has parent
  - Test explicit tag assignment (string and symbol values)
  - Test `getTag()` method returns correct tag values
  - Test `getParent()` method returns correct parent reference
  - Update `CHANGELOG.md` draft entry for v3.1.0.

**4. ✅ Injector Changes, registration (`src/injector.ts`):**

- Add `NoMatchingTagError` class to `src/errors.ts` for when no injector with matching tag found in
  hierarchy
- Update `register()` method in `createInjectorProvider()`:
  - If provider has `at` property: normalize tag with `normalizeTag()`
  - If normalized tag matches current injector's tag OR current injector's tag is `TAG_SINK`:
    register locally
  - If no match and parent exists: call `parent.register()` with the provider
  - If no match and no parent: throw `NoMatchingTagError`
  - If provider has no `at` property: register locally (existing behavior)
- Update compile tests (`src/compile-test/injector.register.ct.ts`):
  - Add `at` property tests within existing provider type sections (`ValueProvider`,
    `ClassProvider`, `FactoryProvider`, `ExistingProvider`)
  - Add tests in "registering multiple providers" section for mixed arrays (some with `at`, some
    without)
- Update runtime tests (`src/test/injector.register.test.ts`):
  - Add new `describe('at property targeting')` section with basic single-injector tests:
    - Root injector (`TAG_ROOT`) successfully registers providers with `at: 'root'`
    - Sink injector (`TAG_SINK`) ignores `at` property and registers all providers locally
    - Injector with custom tag successfully registers providers with matching `at` tag
    - Unmatched tag throws `NoMatchingTagError` when no parent exists
- Update hierarchy tests (`src/test/injector.hierarchy.test.ts`):
  - Add new `describe('at property targeting')` section for comprehensive multi-injector hierarchy
    tests:
    - Provider targeting specific tagged injectors in hierarchy (parent/grandparent)
    - Multiple tagged injectors in same hierarchy
    - Provider delegation up hierarchy until matching tag found
    - Error cases when no matching tag exists in entire hierarchy
    - Combination with existing hierarchy features (cache behavior, overrides, etc.)
    - Testing with arrays of mixed providers (some with `at`, some without)
- Update `CHANGELOG.md` draft entry for v3.1.0.

**5. ✅ Injector Changes, copy() method (`src/injector.ts`):**

- Extend `CopyOptions` interface with `tag?: TagValue | null` property
- Update `copy()` method: use `options.tag` if specified, otherwise copy current tag.
- Update compile tests (`src/compile-test/injector.meta.ct.ts`):
  - Add tests in existing `describe('copy()')` section for `tag` property
  - Test `tag` property accepts `TagValue` types (string/symbol) and rejects invalid types
  - Test `tag` property works with other copy options (`copyCache`, `defaultAllowOverrides`,
    `parent`)
  - Follow existing pattern: positive cases, then @ts-expect-error negative cases
- Update runtime tests (`src/test/injector.create.test.ts`):
  - Test `copy()` preserves original injector's tag by default
  - Test `copy()` with explicit tag
  - Test tag behavior combined with other copy options
- Update `CHANGELOG.md` draft entry for v3.1.0.

**6. ✅ Injector Changes, fork() method (`src/injector.ts`):**

- Create `ForkOptions` interface with `tag?: TagValue | null` and `defaultAllowOverrides?: boolean`
  properties
- Update `fork()` method signature from `fork()` to `fork(options?: ForkOptions)`
- Update `fork()` method: assign `null` tag by default, allow override with `options.tag`
- Add compile tests (`src/compile-test/injector.meta.ct.ts`):
  - Add new `describe('fork()')` section following the existing copy() pattern
  - Test `ForkOptions` interface accepts `tag` and `defaultAllowOverrides` properties
  - Test `ForkOptions` properties accept correct types and reject invalid types
  - Test `fork()` method accepts `ForkOptions` and rejects invalid option types
- Update runtime tests (`src/test/injector.hierarchy.test.ts`):
  - Update existing `fork()` tests in "fork method" section to use new `ForkOptions` signature
  - Add tag-specific tests in existing "fork method" section:
    - Test `fork()` creates child with `null` tag by default
    - Test `fork()` with explicit tag option
    - Test `fork()` with combined options (`tag` and `defaultAllowOverrides`)
- Update `CHANGELOG.md` draft entry for v3.1.0.

**7. ✅ Address TODOs in code**

**8. ✅ Global API (`src/global.ts`):**

- Update `newTestInjector(options?: InjectorOptions)` to default tag to `TAG_SINK` if not specified
- Document that test injectors use `TAG_SINK` by default for predictable testing behavior
- Pass through explicit tag option when provided
- Update runtime tests (`src/test/global.test.ts`):
  - Test `newTestInjector()` creates injector with `TAG_SINK` by default
  - Test `newTestInjector()` with explicit tag option override
  - Test that sink behavior works correctly (ignores `at` properties on providers)
  - Test integration with existing test injector functionality
- Update e2e tests (`packages/e2e-core/src/global.e2e.test.ts`):
  - Test `newTestInjector()` creates injector with `TAG_SINK` by default
  - Test `newTestInjector()` with explicit tag option override
  - Test that sink behavior works correctly in real usage scenarios
  - Test integration with existing global API e2e functionality
- Update `CHANGELOG.md` draft entry for v3.1.0.

**9. ✅ E2E Testing:**

- Move existing hierarchy tests from `packages/e2e-core/src/injector.e2e.test.ts` to new file
  `packages/e2e-core/src/hierarchy.e2e.test.ts`:
  - Move "hierarchical injection" describe block (lines 159-195)
  - Move "multi-level hierarchy" describe block (lines 197-235)
- Add new `describe('provider targeting')` section in `hierarchy.e2e.test.ts` with 3 focused tests:
  - Test 1: "supports tag-based provider targeting across hierarchy" - Real-world 3-level scenario
    (root → app → request) with providers targeting different layers using `at` property
  - Test 2: "works with all provider types using at property" - Verify class, factory, value, and
    existing providers all work correctly with `at` targeting, including caching behavior across
    hierarchy
  - Test 3: "throws NoMatchingTagError when targeting non-existent tag" - Error handling in
    multi-level hierarchy when no matching tag exists
- Keep remaining tests in `injector.e2e.test.ts` (providers support, default value, errors)

**10. Documentation Updates:**

Update `README.md` to document new `at` property for providers, `tag` option for injectors, Injector
constructor and affected methods.

`README.md` changes should include:

- In the Providers section, explain the new `at` property for provider objects, including usage and
  behavior.
- In the Injector section, document the new `tag` option in `InjectorOptions`, `getTag()`, and
  tag-related methods.
- Add a new subsection under Hierarchical Injectors describing tag-based provider registration,
  including examples for `at`, `TAG_ROOT`, `TAG_SINK`, and how providers are targeted in injector
  hierarchies.
- In the Testing section, mention that test injectors use the `TAG_SINK` tag by default and how this
  affects provider registration.
- Update API reference to include new/changed methods and options related to tags.

### v3.2. Global: add `hijackGlobalContext` API function

- `hijackGlobalContext(getInjector: () => Injector)` allows to create own "DI container" using
  library methods, since global `inject()` and `register()` simply call `getInjector()[method])()`.
- Document the fact that this means that other global functions will not work.
- maybe add options to hijack `deleteInjector` as the second argument.
- Put non-hijacked functions in error mode (i.e. `if hijacked throw`).
- `restoreGlobalContext()` to restore the original global context.

## Not scheduled yet:

### 0. Implement testing mode as a hijacked global context, i.e. create a test container, think how to map existing flows onto this

- mark test global functions as deprecated from then on, to be delted in v4.

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
