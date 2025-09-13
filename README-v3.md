# tinytsdi

Minimalistic (yet _useful_ and _elegant_) TypeScript Dependency Injection library. No decorators,
runtime reflection or complex terminology - just a simple, type-safe dependency management with a
default global container.

AsyncLocalStorage containers and more documentation coming soon!

_Currently, most of the development happens off GitHub, which mostly sees squashed release commits.
Lmk if you want to contribute!_

## Coming Soon

- `hijackGlobalContext()` to allow custom containers via library functions
- Hierarchical containers (`node` (`ALS`), `express`, `fastify`, `react`, in that order of
  likelihood of being _soon_)
- More documentation: generated API reference, examples, more text

## Quick Start

### Installation

```shell
$ npm install tinytsdi
```

### Basic Usage

#### Imports

`Injector` class can be used directly:

```typescript
import {Injector} from 'tinytsdi';

const injector = new Injector();
```

Or through a very simple global "container" provided by the library:

```typescript
import {register, inject, Token} from 'tinytsdi';
```

#### Injection IDs

Injection ID is a type-bound identifier of a dependency.Define typed Injection IDs using `Token`
class:

```typescript
const CONFIG = new Token<Config>('config');
const LOGGER = new Token<Logger>('logger');
// The argument is optional, but recommended
// It is used in error messages
const PORT = new Token<number>();
```

Alternatively, constructors can be used as their own injection IDs (`class MyService` can be both a
service and its injection ID). This is not recommended as it complicates testing, specifically
providing fake / mock implementations in a type safe manner.

#### Providers

_Provider_ associates an injection ID with concrete implementation. In other words, it tells
injector how to _resolve_ a dependency for the given ID: _"when this ID is requested, return
...(this value, an instance of this class, etc.)"_. Provider can also give instructions to injector
(such as whether to cache the resolved value).

Providers need to be registered before an injection takes place:

```typescript
register([
  // Value provider
  // "When CONFIG is injected, return this static value"
  {provide: CONFIG, useValue: {apiUrl: 'https://api.example.com'}},

  // Factory provider - cached by default
  // "When LOGGER is injected, call this function and use the result"
  {
    provide: LOGGER,
    useFactory: (inject) => new ConsoleLogger(inject(CONFIG).logLevel),
  },

  // Factory provider with no caching
  // "Create a new logger instance every time this ID is injected"
  {
    provide: REQUEST_LOGGER,
    useFactory: (inject) => new RequestLogger(inject(CONFIG)),
    noCache: true, // "Don't cache - create new instance every time"
  },

  // Class provider - cached by default
  // "When MY_SERVICE is injected, create an instance of MyService"
  {
    provide: MY_SERVICE,
    useClass: MyService,
  },

  // Class provider with inject function passed to constructor
  // "When SERVICE_WITH_DEPS is injected, create an instance of ServiceWithDependencies,
  // pass inject function to its constructor"
  {
    provide: SERVICE_WITH_DEPS,
    useClass: ServiceWithDependencies,
    injectFn: true, // "Pass inject function to constructor"
  },

  // Class provider with no caching
  // "Create a new MyService instance every time this ID is injected"
  {
    provide: TRANSIENT_SERVICE,
    useClass: MyService,
    noCache: true, // "Don't cache - create new instance every time"
    injectFn: false, // "Don't pass inject function" (this is the default)
  },

  // Constructor shorthand
  // Same as {provide: MyService, useClass: MyService, injectFn: true} (always cached)
  MyService,
]);
```

#### Injecting Dependencies

Finally, `inject()` function resolves dependencies by their IDs:

```typescript
const config = inject(CONFIG); // Throws NotProvidedError if not registered
const optionalValue = inject(PORT, 3000); // Default value if not registered
const optionalService = inject(LOGGER, null); // Null if not registered
```

Which can be used anywhere a function call is allowed. Such as in classes:

```typescript
class MyService {
  private config = inject(CONFIG);

  doWork() {
    const logger = inject(LOGGER);
    logger.info('Working with config:', this.config.apiUrl);
  }
}
```

Or in function parameters:

_This is a good pattern to use as itcreates a good interface and allows for easier testing (without
the requirement of using injection)._

```typescript
function processData(config = inject(CONFIG)) {
  return fetch(config.apiUrl);
}
```

#### Constructor Injection Control

Class instances created by the injector can optionally receive `inject()` function as a constructor
argument. This behavior is controlled by the `injectFn` option in class providers:

```typescript
// Service that receives inject function
class ServiceWithDependencies {
  private config: Config;

  constructor(private inject: InjectFn) {
    // Now you can use this.inject() to resolve dependencies
    this.config = this.inject(CONFIG);
    console.log('Service initialized with config:', this.config.apiUrl);
  }
}

// Service with no-argument constructor
class SimpleService {
  getValue() {
    return 'simple service';
  }
}

// Register both services
register([
  {
    provide: SERVICE_WITH_DEPS,
    useClass: ServiceWithDependencies,
    injectFn: true, // ← Constructor will receive inject function
  },
  {
    provide: SIMPLE_SERVICE,
    useClass: SimpleService,
    injectFn: false, // ← Constructor will not receive inject function (default)
  },
]);
```

When `injectFn: false` (or omitted), the class constructor is called with no arguments. When
`injectFn: true`, the constructor receives the inject function as its first parameter.

### Testing

One of the benefits of [IOC](https://en.wikipedia.org/wiki/Inversion_of_control) is improved
testability. The default container comes with a few utilities to isolate tests and specify
dependencies in test scenarios.

```typescript
import {newTestInjector, setTestInjector, removeTestInjector} from 'tinytsdi';

describe('MyService', () => {
  beforeEach(() => {
    // Create isolated test injector
    newTestInjector({ fromCurrent: true, defaultAllowOverrides: true });

    // Override dependencies for testing
    register({provide: CONFIG, useValue: {apiUrl: 'http://test.local'}});
    register({provide: LOGGER, useValue: mockLogger});
  });

  afterEach(() => {
    removeTestInjector(); // Restore original injector
  });

  it('should work with test dependencies', () => {
    const service = inject(MyService);
    // service now uses test config and mock logger
  });
});
```

## API Reference

See JSDoc comments in the source code for detailed API documentation! Generated doc is coming soon!

### Global Container

- **`register(providerOrProvidersArray, allowOverrides?)`** - Register providers with the global
  injector
- **`inject(id, defaultValue?)`** - Resolve dependency using the global injector
- **`getInjector()`** - Get the current global injector instance

> **IMPORTANT**: global container only allows accessing single root injector. It is not aware of
> child injectors.

#### Testing Utilities

```typescript
// Configuration
init({defaultAllowOverrides: boolean, noTestInjector: boolean});

// Test injector management
newTestInjector(options?: TestInjectorOptions);  // Create a new test injector
setTestInjector(injector);                       // Set the injector as the test injector
removeTestInjector();                            // Restore previous non-test global injector

// TestInjectorOptions interface
interface TestInjectorOptions {
  fromCurrent?: boolean;            // Copy providers from current global injector
}
```
  defaultAllowOverrides?: boolean;  // Allow provider overrides by default

#### Test Injector Examples

```typescript
// Create empty test injector
newTestInjector();

// Create test injector that allows overrides of registered providers
newTestInjector({ defaultAllowOverrides: true });

// Copy providers from current global injector
newTestInjector({ fromCurrent: true });

// Copy providers from current global injector and allow overrides
newTestInjector({ fromCurrent: true, defaultAllowOverrides: true });
```

### Provider Types

#### Value Provider

```typescript
register({provide: TOKEN, useValue: staticValue});
```

#### Class Provider

```typescript
register({
  provide: SERVICE_TOKEN,
  useClass: MyServiceImpl,
  noCache?: boolean, // Optional - defaults to false (cached)
});
```

#### Constructor Provider (Shorthand)

```typescript
class MyService {
  constructor(private inject?: InjectFn) {} // inject parameter is optional
}

register(MyService); // Equivalent to {provide: MyService, useClass: MyService, injectFn: true} (always cached)
```

#### Factory Provider

```typescript
register({
  provide: TOKEN,
  useFactory: (inject) => createComplexObject(inject(DEPENDENCY)),
  noCache?: boolean, // Optional - defaults to false (cached)
});
```

#### Existing Provider (Alias)

_"When `NEW_TOKEN` is injected, resolve `OLD_TOKEN` and return its value."_

```typescript
register({provide: NEW_TOKEN, useExisting: OLD_TOKEN});
```

### Injector Class

```typescript
// Basic usage
const injector = new Injector();

// With options
const injector = new Injector({
  defaultAllowOverrides: false,  // Optional, defaults to false
  parent: null                   // Optional, defaults to null
});

// Core methods
injector.register(providers, allowOverrides?);
injector.inject(id, defaultValue?);

// Advanced methods (primarily for testing)
injector.hasProviderFor(id);           // Check if provider exists
injector.hasCachedValue(id);          // Check if value is cached (throws for noCache providers)
injector.invalidate(ids?);            // Clear cache (for specific IDs)
injector.unregister(ids?);            // Remove providers and cache (reset the injector)

// Static methods
Injector.from(source, copyCache = false, copyParent = true);  // Create a copy of the injector
injector.fork();                      // Create child injector with current injector as parent
```

### Types

```typescript
type Token<T>           // Type-safe dependency key
type InjectionId<T>     // Token<T> | Constructor<T>
type InjectFn           // typeof inject
```

## Key Features

### Type Safety

- Full TypeScript support with compile-time type checking
- Type-safe tokens prevent injection of wrong types
- Constructor parameter validation

### Caching Behavior

- **Cached (default)**: Instance cached after first resolution for reuse
- **No Cache (`noCache: true`)**: New instance created on every injection
- **Value providers**: Static values (never cached, always O(1) lookup)

### Hierarchical Injectors

```typescript
const parent = new Injector();
parent.register({provide: CONFIG, useValue: {env: 'top'}});
parent.register({provide: LOGGER, useValue: prodLogger});

const child = parent.fork(); // Child inherits parent's providers
// can register own providers
child.register({provide: SERVICE, useClass: ChildService});
// and override parent providers
child.register({provide: CONFIG, useValue: {env: 'child'}});

// Together:
child.inject(LOGGER); // Returns prodLogger (from parent)
child.inject(CONFIG); // Returns {env: 'child'} (overridden provider)
child.inject(SERVICE); // Returns instance of ChildService (own provider)

// Alternatively, parent can be passed to constructor:
const child = new Injector({parent});
```

### Testing Support

- Test injector isolation
- Provider overriding
- Cache invalidation
- Injector copying

### Async Support

```typescript
const ASYNC_SERVICE = new Token<Promise<Service>>('async-service');

register({
  provide: ASYNC_SERVICE,
  useFactory: async (inject) => {
    const config = inject(CONFIG);
    return await createService(config);
  },
});

// Use with await
const service = await inject(ASYNC_SERVICE);
```

## Error Handling

The library throws specific errors for different scenarios:

- **`AlreadyProvidedError`** - Provider already registered (when overrides disabled)
- **`NotProvidedError`** - No provider found for the given ID
- **`NeverCachedError`** - Attempting cache operations on noCache providers
- **`UnknownProviderError`** - Unsupported provider type
- **`AlreadyInitializedError`** - Multiple `init()` calls
- **`TestInjectorNotAllowedError`** - Test functions disabled via config

## Best Practices

1. **Use tokens**: `const SERVICE = new Token<ServiceInterface>('service')`
2. **Test isolation**: Use `newTestInjector()` for clean test environments
3. **Parameter injection**: Use parameter default values when possible
4. **Constructor injection**: Keep constructors simple, use `inject()` in methods when needed

## Current Limitations

- No circular dependency detection (will hang)

## Permanent Limitations

aka "this is by design" of _minimialistic_ DI

- No decorators, reflection metadata or runtime reflection
- Synchronous API (async values supported via promises)

## Breaking Changes from v2.x

### `scope` replaced with `noCache`

**Old API (v2.x):**

```typescript
register({
  provide: TOKEN,
  useFactory: () => createService(),
  scope: 'singleton', // Required property
});

register({
  provide: TOKEN,
  useFactory: () => createService(),
  scope: 'transient', // Required property
});
```

**New API (v3.x):**

```typescript
register({
  provide: TOKEN,
  useFactory: () => createService(),
  // Cached by default - no property needed
});

register({
  provide: TOKEN,
  useFactory: () => createService(),
  noCache: true, // Explicit opt-in for no caching
});
```

### Injector constructor now uses options object

**Old API (v2.x):**

```typescript
// Positional arguments
const injector = new Injector(
  /* defaultAllowOverrides= */ allowOverrides,
  /* parent= */ parentInjector
);
```

**New API (v3.x):**

```typescript
// Options object (all properties optional)
const injector = new Injector({defaultAllowOverrides: true, parent: parentInjector});
const injector = new Injector({defaultAllowOverrides: true});
const injector = new Injector({parent: parentInjector});
const injector = new Injector(); // All defaults
```

### newTestInjector() now uses options object

**Old API (v2.x):**

```typescript
// Positional arguments
newTestInjector(fromCurrent, allowOverrides);
newTestInjector(true, true);
newTestInjector(false, true);
newTestInjector(true);
```

**New API (v3.x):**

```typescript
// Options object (all properties optional)
newTestInjector({ fromCurrent: true, defaultAllowOverrides: true });
newTestInjector({ defaultAllowOverrides: true });
newTestInjector({ fromCurrent: true });
newTestInjector(); // All defaults - no change needed
```

### Migration Guide

#### Provider Changes

- **Remove `scope: 'singleton'`** - This is now the default behavior
- **Replace `scope: 'transient'`** with **`noCache: true`**
- **Remove `InjectScope` type imports** - No longer exists

#### Constructor Changes

- **Replace positional arguments** with **options object**:
  - `new Injector(true)` → `new Injector({ defaultAllowOverrides: true })`
  - `new Injector(false, parent)` → `new Injector({ parent })`
  - `new Injector()` → No change needed

#### Test Injector Changes

- **Replace positional arguments** with **options object**:
  - `newTestInjector(true, true)` → `newTestInjector({ fromCurrent: true, defaultAllowOverrides: true })`
  - `newTestInjector(false, true)` → `newTestInjector({ defaultAllowOverrides: true })`
  - `newTestInjector(true)` → `newTestInjector({ fromCurrent: true })`
  - `newTestInjector()` → No change needed
- **Note**: Second parameter renamed from `allowOverrides` to `defaultAllowOverrides`
