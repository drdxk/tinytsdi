# tinytsdi

Minimalist TypeScript Dependency Injection library focused on testing and type
safety. No decorators, runtime reflection, or complex hierarchy - just simple,
type-safe dependency management.

## Quick Start

### Installation

```bash
npm install tinytsdi
```

### Basic Usage

```typescript
import {register, inject, Token} from 'tinytsdi';

// Define tokens
const CONFIG = new Token<Config>('config');
const LOGGER = new Token<Logger>('logger');

// Register dependencies
register([
  // Constructor shorthand (singleton by default)
  MyService,

  // Value provider
  {provide: CONFIG, useValue: {apiUrl: 'https://api.example.com'}},

  // Factory provider
  {
    provide: LOGGER,
    useFactory: (inject) => new ConsoleLogger(inject(CONFIG).logLevel),
    scope: 'singleton',
  },
]);

// Use dependencies
class MyService {
  private config = inject(CONFIG);
  private logger = inject(LOGGER);

  doWork() {
    this.logger.info('Working with config:', this.config.apiUrl);
  }
}

// Or in functions with default parameters
function processData(config = inject(CONFIG)) {
  return fetch(config.apiUrl);
}
```

### Testing

```typescript
import {newTestInjector, setTestInjector, removeTestInjector} from 'tinytsdi';

describe('MyService', () => {
  beforeEach(() => {
    // Create isolated test injector
    const testInjector = newTestInjector(true, true); // fromCurrent=true, allowOverrides=true
    setTestInjector(testInjector);

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

### Core Functions

- **`register(providers, allowOverrides?)`** - Register providers with global
  injector
- **`inject(id, defaultValue?)`** - Resolve dependency from global injector
- **`getInjector()`** - Get current global injector instance

### Provider Types

#### Constructor Provider (Shorthand)

```typescript
class MyService {
  constructor(private inject?: InjectFn) {} // inject parameter is optional
}

register(MyService); // Equivalent to {provide: MyService, useClass: MyService, scope: 'singleton'}
```

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

#### Factory Provider

```typescript
register({
  provide: TOKEN,
  useFactory: (inject) => createComplexObject(inject(DEPENDENCY)),
  scope: 'singleton' | 'transient', // Required
});
```

#### Existing Provider (Alias)

```typescript
register({provide: NEW_TOKEN, useExisting: OLD_TOKEN});
```

### Injector Class

```typescript
const injector = new Injector(allowOverrides = false);

// Core methods
injector.register(providers, allowOverrides?);
injector.inject(id, defaultValue?);

// Advanced methods (primarily for testing)
injector.hasProviderFor(id);           // Check if provider exists
injector.hasCachedValue(id);          // Check if value is cached (throws for transient)
injector.invalidate(ids?);            // Clear cache for specific IDs or all
injector.unregister(ids?);            // Remove providers and cache
Injector.from(source, copyCache?);    // Create copy of injector
```

### Test Utilities

```typescript
// Configuration
init({defaultAllowOverrides: boolean, noTestInjector: boolean});

// Test injector management
newTestInjector(fromCurrent?, allowOverrides?);  // Create test injector
setTestInjector(injector);                       // Set active test injector
removeTestInjector();                            // Restore previous injector
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
- **`NotProvidedError`** - No provider found for injection ID
- **`NeverCachedError`** - Attempting cache operations on transient providers
- **`UnknownProviderError`** - Unsupported provider type
- **`AlreadyInitializedError`** - Multiple `init()` calls
- **`TestInjectorNotAllowedError`** - Test functions disabled via config

## Best Practices

1. **Use tokens for interfaces**:
   `const SERVICE = new Token<ServiceInterface>('service')`
2. **Test isolation**: Use `newTestInjector()` for clean test environments
3. **Parameter injection**: Use default parameters for optional dependencies
4. **Constructor injection**: Keep constructors simple, use `inject()` in
   methods when needed

## Limitations

- No decorator support
- No runtime reflection
- No circular dependency detection (will hang)
- No hierarchical injectors
- Synchronous API (async values supported via promises)
