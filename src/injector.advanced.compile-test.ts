/** Compile-time tests for advanced Injector methods */

/* eslint-disable @typescript-eslint/no-unused-vars */

import {Injector} from './injector.js';
import {Token} from './types.js';

import type {InjectFn} from './types.js';

// Test classes for injection
class TestService {
  readonly serviceType = 'test' as const;
  constructor(private inject: InjectFn) {
    void this.inject;
  }
}

class SimpleService {
  readonly serviceType = 'simple' as const;
}

const sourceInjector = new Injector();
const stringToken = new Token<string>('string');
const numberToken = new Token<number>('number');

// Register some providers in source injector
sourceInjector.register({provide: stringToken, useValue: 'test'});
sourceInjector.register({provide: numberToken, useValue: 42});
sourceInjector.register(TestService);

// Test: Injector.from() returns Injector type
const newInjector: Injector = Injector.from(sourceInjector);

// Test: Injector.from() with copyCache parameter
const newInjectorWithCache: Injector = Injector.from(sourceInjector, true);
const newInjectorWithoutCache: Injector = Injector.from(sourceInjector, false);

// Test: Copied injector preserves type safety
const str: string = newInjector.inject(stringToken);
const num: number = newInjector.inject(numberToken);
const service: TestService = newInjector.inject(TestService);

// Test: Copied injector supports same operations as original
newInjector.register({provide: new Token<boolean>('bool'), useValue: true});

// Test: copyCache parameter type checking
// @ts-expect-error - copyCache must be boolean
const invalidCopyCache = Injector.from(sourceInjector, 'invalid');

// @ts-expect-error - copyCache must be boolean
const invalidCopyCache2 = Injector.from(sourceInjector, 123);

// Test: from() requires Injector parameter
// @ts-expect-error - First parameter must be Injector
const invalidSource = Injector.from({});

// @ts-expect-error - First parameter must be Injector
const invalidSource2 = Injector.from(null);

// Test: from() preserves defaultAllowOverrides setting
const sourceWithOverrides = new Injector(true);
const copiedWithOverrides: Injector = Injector.from(sourceWithOverrides);

// Test: Copied injector maintains type safety for all provider types
const factoryToken = new Token<{value: string}>('factory');
const classToken = new Token<SimpleService>('class');
const aliasToken = new Token<string>('alias');

sourceInjector.register([
  {
    provide: factoryToken,
    useFactory: (inject: InjectFn) => ({value: inject(stringToken)}),
  },
  {
    provide: classToken,
    useClass: SimpleService,
    noCache: true,
  },
  {
    provide: aliasToken,
    useExisting: stringToken,
  },
]);

const copiedInjector = Injector.from(sourceInjector);

// Test: All copied provider types maintain type safety
const factoryResult: {value: string} = copiedInjector.inject(factoryToken);
const classResult: SimpleService = copiedInjector.inject(classToken);
const aliasResult: string = copiedInjector.inject(aliasToken);

// Test: Copied injector type inference works correctly
const inferredInjector = Injector.from(sourceInjector);
const inferredString: string = inferredInjector.inject(stringToken);

// Test: Multiple from() calls work correctly
const secondCopy = Injector.from(newInjector);
const thirdCopy = Injector.from(secondCopy, true);

// Test: from() with complex type hierarchies
interface ServiceInterface {
  getValue(): string;
}

class ConcreteService implements ServiceInterface {
  constructor(private inject: InjectFn) {}

  getValue(): string {
    return this.inject(stringToken);
  }
}

const interfaceToken = new Token<ServiceInterface>('interface');
sourceInjector.register({
  provide: interfaceToken,
  useClass: ConcreteService,
});

const interfaceCopy = Injector.from(sourceInjector);
const interfaceResult: ServiceInterface = interfaceCopy.inject(interfaceToken);

// Test: hasProviderFor() returns boolean
const hasProvider: boolean = sourceInjector.hasProviderFor(stringToken);
const hasConstructorProvider: boolean = sourceInjector.hasProviderFor(TestService);

// Test: hasCachedValue() returns boolean
const hasCached: boolean = sourceInjector.hasCachedValue(stringToken);

// Test: Type checking for hasProviderFor parameter
// @ts-expect-error - hasProviderFor requires valid injection ID
const invalidHasProvider = sourceInjector.hasProviderFor({});

// @ts-expect-error - hasProviderFor requires valid injection ID
const invalidHasProvider2 = sourceInjector.hasProviderFor(null);

// Test: Type checking for hasCachedValue parameter
// @ts-expect-error - hasCachedValue requires valid injection ID
const invalidHasCached = sourceInjector.hasCachedValue({});

// @ts-expect-error - hasCachedValue requires valid injection ID
const invalidHasCached2 = sourceInjector.hasCachedValue(null);

// Test: Both methods work with any injection ID type
const tokenHasProvider: boolean = sourceInjector.hasProviderFor(stringToken);
const classHasProvider: boolean = sourceInjector.hasProviderFor(TestService);
const tokenHasCached: boolean = sourceInjector.hasCachedValue(stringToken);
const classHasCached: boolean = sourceInjector.hasCachedValue(TestService);

// Test: invalidate() method signatures
sourceInjector.invalidate(); // No parameters - clears all cache
sourceInjector.invalidate(stringToken); // Single ID
sourceInjector.invalidate([stringToken, numberToken]); // Array of IDs

// Test: unregister() method signatures
sourceInjector.unregister(); // No parameters - removes all providers
sourceInjector.unregister(stringToken); // Single ID
sourceInjector.unregister([stringToken, numberToken]); // Array of IDs

// Test: Type checking for invalidate parameter
// @ts-expect-error - invalidate requires valid injection ID or array
const invalidInvalidate = sourceInjector.invalidate({});

// @ts-expect-error - invalidate requires valid injection ID or array
const invalidInvalidate2 = sourceInjector.invalidate('invalid');

// Test: Type checking for unregister parameter
// @ts-expect-error - unregister requires valid injection ID or array
const invalidUnregister = sourceInjector.unregister({});

// @ts-expect-error - unregister requires valid injection ID or array
const invalidUnregister2 = sourceInjector.unregister('invalid');

// Test: Both methods return void
const invalidateResult: void = sourceInjector.invalidate();
const unregisterResult: void = sourceInjector.unregister();

// Suppress unused variable warnings
void newInjector;
void newInjectorWithCache;
void newInjectorWithoutCache;
void str;
void num;
void service;
void copiedWithOverrides;
void factoryResult;
void classResult;
void aliasResult;
void inferredString;
void secondCopy;
void thirdCopy;
void interfaceResult;
void hasProvider;
void hasConstructorProvider;
void hasCached;
void tokenHasProvider;
void classHasProvider;
void tokenHasCached;
void classHasCached;
void invalidateResult;
void unregisterResult;
