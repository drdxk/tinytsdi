# tinytsdi: Minimalistic TypeScript Dependency Injection library (design doc v2)

Minimalist type-aware Dependency Injection library for TypeScript. Main goal:
facilitate testing. No support for decorations, runtime reflection, hierarchy or
`AsyncLocalStorage` (at least for now). No special handling for cycles (will
hang). "Native" support for async.

## Table of Contents

- [Quick start](#quick-start)
- [API](#api)
  - [Functions](#functions)
  - [`Injector`](#injector)
  - [`Token<T>`](#tokent)
  - [`type InjectFn`](#type-injectfn)
  - [`type InjectionId<T>`](#injectionidt)
  - [`type InjectScope`](#type-injectscope)
  - [`GenericInjectionId`](#genericinjectionid)
  - [`Provider<T>`](#providert)
- [Async](#async)
- [Error handling](#error-handling)

## Quick start {#quick-start}

Provide values before they are used:

```typescript
import {register, inject, Token} from 'tinytsdi';
import {CONFIG, Config} from './config';

register([
  // {provide: MyService, useClass: MyService, scope: 'singleton'},
  MyService,

  // Value provider.
  {provide: CONFIG, useValue: config},

  // Class provider.
  {
    provide: StateMachine,
    useClass: MyStateMachine,
    scope: 'transient',
  },

  // Factory provider.
  {
    provide: DB,
    useFactory: (inject: InjectFn) => {
      const config = inject(CONFIG);
      const db = new DatabaseConstructor(config.dbFilename);
      for (const pragma of config.dbPragmas || []) {
        db.pragma(pragma);
      }
      return db;
    },
    scope: 'singleton',
  },
  {provide: DB_LOGGER, useExisting: Logger},
]);
```

Consume dependencies using `inject()`.

```typescript
class MyService {
  private readonly config = inject(CONFIG);
  private readonly logger = inject(Logger);
}

function listDirectory(absolutePath?: string = inject(LIST_PATH)) {
  const entries = fs.readdirSync(absolutePath);
  // ...
}
```

Substitute dependencies in tests:

```typescript
import {
  newTestInjector,
  setTestInjector,
  removeTestInjector,
} from 'tinytsdi';

describe('SUT', () => {
  let testInjector: Injector;
  beforeAll(() => {
    // Option A: replace the global injector with a clean one.
    newTestInjector(); /* fromCurrent = false, allowOverrides = false */
    // Option B: replace the global injector, but keep registered providers.
    newTestInjector(
      /* fromCurrent */ = true,
      /* allowOverrides */ = true
    );
    // option C: BYO injector.
    setTestInjector(myTestInjectorFromElsewhere);
  });
  afterAll(() => {
    // Restores the previous injector, no need to track.
    removeTestInjector();
  });
});
```

**BEST PRACTICE**: Explicitly provide all the dependencies in tests, i.e. create
a test injector. This makes sure tests are isolated and are not using any
non-intended dependencies.

## API

### Functions

#### `register<T>(providers: Provider<T>|Provider<T>[], allowOverrides?: boolean): void`

Same as `getInjector().register()`.

#### `inject(id: InjectionId<T>, default?: T): T`

Same as `getInjector().inject()`.

#### `getInjector(): Injector`

Return current global injector instance. Created lazily on the first call to
`register()` or `inject()`.

### `Injector` {#injector}

Main class for managing dependencies, each instance provides its own
registration and caching space.

#### `constructor(defaultAllowOverrides = false)`

#### `register<T>(providers: Provider<T>|Provider<unknown>[], allowOverrides?: boolean): void`

_throws_: `AlreadyProvidedError`, `UnknownProviderError`

Registers a provider. If `allowOverrides` is explicitly set to false or
instance's `defaultAllowOverrides` is false, it's an error
(`AlreadyProvidedError`) to register a provider for an `InjectionId` that was
already registered, in other words:

```typescript
const throwOnOverride = !(allowOverrides !== undefined
  ? allowOverrides
  : this.defaultAllowOverrides);
```

#### `inject<T>(id: InjectionId<T>, default?: T): T`

_throws_: `NotProvidedError`

Resolves values for the given `id`. If a provider for the `id` is not
registered, returns `default` if set, throws `NotProvidedError` otherwise.

#### Test methods:

These are normally would only be used in testing / on a testing injector.

- `static from(injector: Injector, copyCache = false): Injector`

  Creates a new `Injector` instance from an existing one, copying all providers.
  If `copyCache` is set to `true`, the cache of resolved dependencies is also
  copied.

- `invalidate(ids?: InjectionId<unknown>|InjectionId<unknown>[]): void`

  _throws_: `NotProvidedError`, `NeverCachedError`

  Clears the cache of resolved dependencies, but keeps the providers registered.
  I.e. any subsequent `inject()` will create new instances. If `ids` is
  provided, only those dependencies will be cleared from the cache. When one of
  `ids` corresponds to a provider's value that is never cached
  `NeverCachedError` is thrown.

- `unregister(ids: InjectionId<unknown>|InjectionId<unknown>[]): void`

  _throws_: `NotProvidedError`

  Unregisters providers for the given `ids` and removes any cached values. If an
  `InjectionId` is not registered, `NotProvidedError` is thrown. If the `ids`
  are not provided, all providers are unregistered - this operation amounts to
  resetting the injector.

- `hasProviderFor(id: InjectionId<unknown>): boolean`

- `isCached(id: InjectionId<unknown>): boolean`

  Checks if the injector has a cached value for the given `InjectionId`.

  _throws_: `NeverCachedError` (any `transient` provider is never cached).

### `Token<T>` {#tokent}

Type-safe unique key for dependencies.

- `new Token<T>(name?: string)`. The name is optional and only used in error
  messages.

### `type InjectFn`

`typeof inject` used for "parameter injection" in factory functions and class
constructors.

### `type InjectionId<T>` {#injectionidt}

A valid injection key type, either a `Constructor<T>` with no arguments / single
`InjectFn` argument or a `Token<T>`.

### `type InjectScope = 'singleton' | 'transient'`

Defines the scope of a provider. A `singleton` provider resolves once and its
resolved value is cached for the lifetime of the injector (or an `invalidate()`
or an `unregister()` call). A `transient` provider is run every resolution time
and its resolved value is never cached.

When this type is present in a provider it **MUST** be explicitly specified to
avoid ambiguity.

### `GenericInjectionId` {#genericinjectionid}

Type alias for `InjectionId<unknown>`.

### `Provider<T>` {#providert}

Type for objects that define how to create instances of dependencies. Providers
are used to register dependencies with the injector. A provider associates an
`InjectionId<T>` with a concrete instance of `T` by instructing the injector how
to create it.

Following types of providers are supported:

#### Constructor provider (shorthand)

Any class with no constructor arguments or a single argument of type `InjectFn`
can be used as its own `InjectionId<T>` and provider. Same as `ClassProvider<T>`
with `scope: 'singleton'`.

_**NOTE**_: Constructor is always passed an `InjectFn` as the sole argument, but
it's okay to ignore it.

```typescript
register(MyService);
```

#### `ClassProvider<T>`

Associates constructor with an `InjectionId<T>`. Class constructor must not
accept any arguments or accept a single argument of `InjectFn` type.

_**NOTE**_: Constructor is always passed an `InjectFn` as the sole argument, but
it's okay to ignore it.

```typescript
provide({
  provide: ServiceInjectionId, // InjectionId<T>
  // must implement T
  useClass: MyService,
  // InjectionScope, **REQUIRED** must be explicitly set
  scope: 'singleton',
});
```

### `FactoryProvider<T>`

Associates the result of a factory function of `T` with `InjectionId<T>`. The
function must accept no arguments or a single argument of type `InjectFn`.

```typescript
provide({
  provide: CURRENT_MAX, // InjectionId<T>
  // Must return T
  useFactory: (inject: InjectFn) => {
    const a = inject(AToken);
    const b = inject(BToken);
    return Math.max(a, b);
  },
  // InjectionScope, **REQUIRED** must be explicitly set
  scope: 'transient',
});
```

### `ValueProvider<T>`

Associates a concrete static value with an `InjectionId<T>`. Never cached (since
lookup is always O(1)).

```typescript
provide({provide: VALUE_TOKEN, useValue: 'Hello, World!'});
```

### `ExistingProvider<T>`

Associates a new `InjectionId<T>` with another `InjectionId<T>`.

```typescript
provide({
  provide: NEW_TOKEN,
  useExisting: OLD_TOKEN,
});
```

### `Provider<T>`

A union of all Provider types for typing convenience.

## Async

tinytsdi interface is fully synchronous. However, value and factory providers
can provide _any_ values, including promises.

```typescript
const ASYNC = new Token<Promise<string>>('async');
register({
  provide: ASYNC,
  useFactory: () => {
    return new Promise()((resolve) => {
      setTimeout(() => resolve('Hello, Async World!'), 1000);
    });
  },
  scope: 'transient',
});
const asyncValue = resolve(ASYNC).then((value) => {
  console.log(value); // 'Hello, Async World!'
});
```

or more realistically:

```typescript
const MODULE = new Token<Promise<SomeModuleInterface>>('ModuleElsewhere');
register({
  provide: MODULE,
  useFactory: async (inject: InjectFn) => {
    // Dynamically import the module (fetch something, establish a connection etc.)
    const module = await import(inject(MODULE_URL));
    return module;
  },
  scope: 'singleton',
});

async function myFunction(
  modulePromise: Promise<SomeModuleInterface> = inject(MODULE)
) {
  try {
    const module = await modulePromise; // typed as SomeModuleInterface
    // Use the resolved module...
  } catch (error) {
    // Handle loading errors here.
  }
}
```

Since `scope: 'singleton'` values are cached, any rejected promise will be
cached as well. If this is not desired, consider using `'transient'` scope in
combination with a local memoization techniques, or using
`injector.invalidate(id)` in `catch` blocks to remove the undesired cached
value.

## Error handling

Any error thrown during dependency resolution (i.e. from factory function or
class constructors) will be rethrown as is.
