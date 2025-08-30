# tinytsdi

Minimalistic (yet _useful_ and _elegant_) TypeScript Dependency Injection
library. No decorators, runtime reflection or complex terminology - just a
simple, type-safe dependency management with a default global container.

✅ **NEW in 2.1**: Hierarchical injectors are now supported!

AsyncLocalStorage containers and more documentation coming soon!

_Currently, most of the development happens off GitHub, which mostly sees
squashed release commits. Lmk if you want to contribute!_

## Coming Soon

- `scope` will be renamed and made optional
- provider controls whether constructor of a class gets injected an `InjectFn`
- `hijackGlobalContext()` to allow custom containers via library functions
- Hierarchical containers (`node` (`ALS`), `express`, `fastify`, `react`, in
  that order of likelihood of being _soon_)
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

Injection ID is a type-bound identifier of a dependency.Define typed Injection
IDs using `Token` class:

```typescript
const CONFIG = new Token<Config>('config');
const LOGGER = new Token<Logger>('logger');
// The argument is optional, but recommended
// It is used in error messages
const PORT = new Token<number>();
```

Alternatively, constructors can be used as their own injection IDs
(`class MyService` can be both a service and its injection ID). This is not
recommended as it complicates testing, specifically providing fake / mock
implementations in a type safe manner.

#### Providers

_Provider_ associates an injection ID with concrete implementation. In other
words, it tells injector how to _resolve_ a dependency for the given ID: _"when
this ID is requested, return ...(this value, an instance of this class, etc.)"_.
Provider can also give instructions to injector (such as whether to cache the
resolved value).

Providers need to be registered before an injection takes place:

```typescript
register([
  // Value provider
  // "When CONFIG is injected, return this static value"
  {provide: CONFIG, useValue: {apiUrl: 'https://api.example.com'}},

  // Factory provider
  // "When LOGGER is injected, call this function and use the result"
  {
    provide: LOGGER,
    useFactory: (inject) => new ConsoleLogger(inject(CONFIG).logLevel),
    scope: 'singleton', // "Cache the result and use it for all future injections"
  },

  // Class provider
  // "When MY_SERVICE is injected, create an instance of MyService"
  {
    provide: MY_SERVICE,
    useClass: MyService,
    scope: 'transient', // "Create a new instance every time this ID is injected"
  },

  // Constructor shorthand
  // Same as {provide: MyService, useClass: MyService, scope: 'singleton'}
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

_This is a good pattern to use as itcreates a good interface and allows for
easier testing (without the requirement of using injection)._

```typescript
function processData(config = inject(CONFIG)) {
  return fetch(config.apiUrl);
}
```

Class instances created by the injector receive `inject()` function as a
constructor argument:

```typescript
class MyService {
  constructor(private inject: InjectFn) {
    // Now you can use this.inject() to resolve dependencies
    const config = this.inject(CONFIG);
    console.log('Service initialized with config:', config.apiUrl);
  }
```

### Testing

One of the benefits of [IOC](https://en.wikipedia.org/wiki/Inversion_of_control)
is improved testability. The default container comes with a few utilities to
isolate tests and specify dependencies in test scenarios.

```typescript
import {newTestInjector, setTestInjector, removeTestInjector} from 'tinytsdi';

describe('MyService', () => {
  beforeEach(() => {
    // Create isolated test injector
    newTestInjector(/* fromCurrent= */ true, /* allowOverrides= */ true);

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

See JSDoc comments in the source code for detailed API documentation! Generated
doc is coming soon!

### Global Container

- **`register(providerOrProvidersArray, allowOverrides?)`** - Register providers
  with the global injector
- **`inject(id, defaultValue?)`** - Resolve dependency using the global injector
- **`getInjector()`** - Get the current global injector instance

> **IMPORTANT**: global container only allows accessing single root injector. It
> is not aware of child injectors.

#### Testing Utilities

```typescript
// Configuration
init({defaultAllowOverrides: boolean, noTestInjector: boolean});

// Test injector management
newTestInjector(fromCurrent?, allowOverrides?);  // Create a new test injector
setTestInjector(injector);                       // Set the injector as the test injector
removeTestInjector();                            // Restore previous non-test global injector
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
  scope: 'singleton' | 'transient', // Required
});
```

#### Constructor Provider (Shorthand)

```typescript
class MyService {
  constructor(private inject?: InjectFn) {} // inject parameter is optional
}

register(MyService); // Equivalent to {provide: MyService, useClass: MyService, scope: 'singleton'}
```

#### Factory Provider

```typescript
register({
  provide: TOKEN,
  useFactory: (inject) => createComplexObject(inject(DEPENDENCY)),
  scope: 'singleton' | 'transient', // Required
});
```

#### Existing Provider (Alias)

_"When `NEW_TOKEN` is injected, resolve `OLD_TOKEN` and return its value."_

```typescript
register({provide: NEW_TOKEN, useExisting: OLD_TOKEN});
```

### Injector Class

```typescript
const injector = new Injector(allowOverrides = false, parent = null);

// Core methods
injector.register(providers, allowOverrides?);
injector.inject(id, defaultValue?);

// Advanced methods (primarily for testing)
injector.hasProviderFor(id);           // Check if provider exists
injector.hasCachedValue(id);          // Check if value is cached (throws for transient)
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
type InjectScope        // 'singleton' | 'transient'
```

## Key Features

### Type Safety

- Full TypeScript support with compile-time type checking
- Type-safe tokens prevent injection of wrong types
- Constructor parameter validation

### Scoping

- **Singleton**: Cached after first resolution (default for constructors)
- **Transient**: New instance on every injection (required explicit scope)
- **Value**: Static values (never cached, always O(1) lookup)

### Hierarchical Injectors

```typescript
const parent = new Injector();
parent.register({provide: CONFIG, useValue: {env: 'top'}});
parent.register({provide: LOGGER, useValue: prodLogger});

const child = parent.fork(); // Child inherits parent's providers
// can register own providers
child.register({provide: SERVICE, useClass: ChildService, scope: 'singleton'});
// and override parent providers
child.register({provide: CONFIG, useValue: {env: 'child'}});

// Together:
child.inject(LOGGER); // Returns prodLogger (from parent)
child.inject(CONFIG); // Returns {env: 'child'} (overridden provider)
child.inject(SERVICE); // Returns instance of ChildService (own provider)
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
  scope: 'singleton',
});

// Use with await
const service = await inject(ASYNC_SERVICE);
```

## Error Handling

The library throws specific errors for different scenarios:

- **`AlreadyProvidedError`** - Provider already registered (when overrides
  disabled)
- **`NotProvidedError`** - No provider found for the given ID
- **`NeverCachedError`** - Attempting cache operations on transient providers
- **`UnknownProviderError`** - Unsupported provider type
- **`AlreadyInitializedError`** - Multiple `init()` calls
- **`TestInjectorNotAllowedError`** - Test functions disabled via config

## Best Practices

1. **Use tokens**: `const SERVICE = new Token<ServiceInterface>('service')`
2. **Test isolation**: Use `newTestInjector()` for clean test environments
3. **Parameter injection**: Use parameter default values when possible
4. **Constructor injection**: Keep constructors simple, use `inject()` in
   methods when needed

## Current Limitations

- No hierarchical containers **coming soon**
  - Including a default `AsyncLocalStorage` container for Node!
  - And dedicated `express` and `fastify` containers!
  - And maybe a `react` container!
- No circular dependency detection (will hang)

## Permanent Limitations

aka "this is by design" of _minimialistic_ DI

- No decorators, reflection metadata or runtime reflection
- Synchronous API (async values supported via promises)
