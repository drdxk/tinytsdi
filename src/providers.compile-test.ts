/**
 * Compile-time type tests for Provider types
 *
 * This file contains type assignments that verify TypeScript compilation behavior for provider
 * types. It should be included in typecheck but not in runtime builds.
 *
 * Positive tests: Should compile without errors Negative tests: Should fail compilation (marked
 * with `@ts-expect-error`)
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/require-await */

import {Token} from './types.js';

import type {
  ClassProvider,
  ExistingProvider,
  FactoryProvider,
  Provider,
  ValueProvider,
} from './providers.js';
import type {InjectFn} from './types.js';

// Test classes for provider tests
class TestServiceNoArgs {
  readonly providerNoArgsFlag = 'provider-test';
  constructor() {}
  getProviderInfo(): string {
    return 'ProviderTestServiceNoArgs';
  }
}

class TestServiceWithInject {
  readonly providerInjectFlag = ['inject', 'provider'];
  constructor(private inject: InjectFn) {
    void this.inject;
  }
  getProviderInjector(): InjectFn {
    return this.inject;
  }
}

class TestServiceWithArgs {
  readonly providerArgsFlag = {hasArgs: true, count: 2};
  constructor(
    public arg1: string,
    public arg2: number
  ) {}
  getProviderArgs(): {arg1: string; arg2: number} {
    return {arg1: this.arg1, arg2: this.arg2};
  }
}

class ServiceWithRequiredArg {
  constructor(public requiredArg: string) {}
  getArg() {
    return this.requiredArg;
  }
}

class ServiceAllOptionalParams {
  constructor(
    public name?: string,
    public count?: number,
    public enabled?: boolean
  ) {}
  getName() {
    return this.name || 'unnamed';
  }
}

const testToken = new Token<string>('test');
const serviceToken = new Token<TestServiceNoArgs>('service');
// === ValueProvider<T> Type Tests ===

// Positive: Valid ValueProvider
const validValueProvider: ValueProvider<string> = {
  provide: testToken,
  useValue: 'test value',
};

// Positive: ValueProvider with class as InjectionId
const validValueProviderWithClass: ValueProvider<TestServiceNoArgs> = {
  provide: TestServiceNoArgs,
  useValue: new TestServiceNoArgs(),
};

// Negative: Incompatible value type should fail
const invalidValueProvider: ValueProvider<string> = {
  provide: testToken,
  // @ts-expect-error - number not assignable to string value
  useValue: 42,
};

// === ClassProvider<T> Type Tests ===

// Positive: Valid ClassProvider with no-args constructor
const validClassProvider: ClassProvider<TestServiceNoArgs> = {
  provide: serviceToken,
  useClass: TestServiceNoArgs,
};

// Positive: Valid ClassProvider with InjectFn constructor
const validClassProviderWithInject: ClassProvider<TestServiceWithInject> = {
  provide: TestServiceWithInject,
  useClass: TestServiceWithInject,
  noCache: true,
  injectFn: true,
};

// Positive: Valid ClassProvider with explicit noCache: false (default behavior)
const validClassProviderCached: ClassProvider<TestServiceNoArgs> = {
  provide: serviceToken,
  useClass: TestServiceNoArgs,
  noCache: false,
};

// Negative: Constructor with incompatible args should fail
const invalidClassProvider: ClassProvider<TestServiceWithArgs> = {
  provide: TestServiceWithArgs,
  // @ts-expect-error - Constructor with non-InjectFn args not allowed
  useClass: TestServiceWithArgs,
};

// @ts-expect-error - Constructor needs InjectFn but injectFn is false
const falseInjectFnClassProvider: ClassProvider<TestServiceWithInject> = {
  provide: TestServiceWithInject,
  useClass: TestServiceWithInject,
  injectFn: false,
};

// @ts-expect-error - Constructor needs InjectFn but injectFn is false
const undefinedInjectFnClassProvider: ClassProvider<TestServiceWithInject> = {
  provide: TestServiceWithInject,
  useClass: TestServiceWithInject,
};

// === InjectFn Option Compile-Time Type Tests ===

// Test classes for injectFn option tests
class ServiceRequiringInject {
  constructor(private inject: InjectFn) {}
  getData() {
    return this.inject(testToken, 'default');
  }
}

class ServiceNoArgsOnly {
  readonly data = 'no-args';
  constructor() {}
  getData() {
    return this.data;
  }
}

class ServiceWithOptionalParams {
  constructor(
    public config?: string,
    public debug?: boolean
  ) {}
  getConfig() {
    return this.config || 'default';
  }
}

class ServiceMixedArgs {
  constructor(
    private inject: InjectFn,
    public config: string
  ) {}
  getData() {
    return this.inject(testToken, 'default') + this.config;
  }
}

class ComplexServiceNoArgs {
  private readonly config = {initialized: true, timestamp: Date.now()};
  constructor() {
    // Complex initialization logic but no parameters
  }
  getConfig() {
    return this.config;
  }
}

// Positive: No injectFn property (uses default) with no-args constructor
const validInjectFnDefault: ClassProvider<ServiceNoArgsOnly> = {
  provide: new Token<ServiceNoArgsOnly>('service-implicit-default'),
  useClass: ServiceNoArgsOnly,
};

// Positive: injectFn: true with constructor requiring InjectFn
const validInjectFnTrue: ClassProvider<ServiceRequiringInject> = {
  provide: new Token<ServiceRequiringInject>('service-with-inject'),
  useClass: ServiceRequiringInject,
  injectFn: true,
};

// Positive: injectFn: false with no-args constructor
const validInjectFnFalse: ClassProvider<ServiceNoArgsOnly> = {
  provide: new Token<ServiceNoArgsOnly>('service-no-args'),
  useClass: ServiceNoArgsOnly,
  injectFn: false,
};

// Positive: injectFn: false explicitly set with various no-args constructors
const validExplicitFalse: ClassProvider<ServiceNoArgsOnly> = {
  provide: new Token<ServiceNoArgsOnly>('explicit-false'),
  useClass: ServiceNoArgsOnly,
  injectFn: false,
  noCache: true, // Can still use other options
};

// Positive: Class with complex initialization but no constructor args needed
const validComplexNoArgs: ClassProvider<ComplexServiceNoArgs> = {
  provide: new Token<ComplexServiceNoArgs>('complex-service'),
  useClass: ComplexServiceNoArgs,
  injectFn: false,
};

// Positive: Constructor with optional parameters and injectFn: false
const validOptionalParams: ClassProvider<ServiceWithOptionalParams> = {
  provide: new Token<ServiceWithOptionalParams>('service-optional'),
  useClass: ServiceWithOptionalParams,
  injectFn: false,
};

// Positive: Constructor with only optional parameters (can be called with no args)
const validAllOptionalParams: ClassProvider<ServiceAllOptionalParams> = {
  provide: new Token<ServiceAllOptionalParams>('all-optional'),
  useClass: ServiceAllOptionalParams,
  injectFn: false,
};

// Positive: Mix of required and optional - should still work with injectFn: false because no required args
class ServiceOnlyOptional {
  constructor(public config?: {debug: boolean}) {}
  isDebug() {
    return this.config?.debug || false;
  }
}

// Positive: Constructor with only optional parameters and injectFn: false
const validMixedOptional: ClassProvider<ServiceOnlyOptional> = {
  provide: new Token<ServiceOnlyOptional>('mixed-optional'),
  useClass: ServiceOnlyOptional,
  injectFn: false,
};

// @ts-expect-error - Constructor requires InjectFn but injectFn is false
const invalidFalseWithInject: ClassProvider<ServiceRequiringInject> = {
  provide: new Token<ServiceRequiringInject>('invalid-false-inject'),
  useClass: ServiceRequiringInject,
  injectFn: false,
};

// Negative: Constructor with required non-InjectFn arg should fail with injectFn: false
const invalidRequiredArg: ClassProvider<ServiceWithRequiredArg> = {
  provide: new Token<ServiceWithRequiredArg>('invalid-required'),
  // @ts-expect-error - Constructor has required non-InjectFn parameter
  useClass: ServiceWithRequiredArg,
  injectFn: false,
};

// Negative: Constructor with required non-InjectFn arg should fail with injectFn: true
const invalidRequiredArgTrue: ClassProvider<ServiceWithRequiredArg> = {
  provide: new Token<ServiceWithRequiredArg>('invalid-required-true'),
  // @ts-expect-error - Constructor parameter is not InjectFn
  useClass: ServiceWithRequiredArg,
  injectFn: true,
};

// Negative: Mixed args constructor should fail with injectFn: true
const invalidMixedArgsTrue: ClassProvider<ServiceMixedArgs> = {
  provide: new Token<ServiceMixedArgs>('invalid-mixed-true'),
  // @ts-expect-error - Constructor has non-InjectFn required parameters
  useClass: ServiceMixedArgs,
  injectFn: true,
};

// Negative: Mixed args constructor should fail with injectFn: false
const invalidMixedArgsFalse: ClassProvider<ServiceMixedArgs> = {
  provide: new Token<ServiceMixedArgs>('invalid-mixed-false'),
  // @ts-expect-error - Constructor has required parameters
  useClass: ServiceMixedArgs,
  injectFn: false,
};

// Negative: Invalid noCache option should fail
const invalidNoCacheClassProvider: ClassProvider<TestServiceNoArgs> = {
  provide: serviceToken,
  useClass: TestServiceNoArgs,
  // @ts-expect-error - 'invalid' not a valid value for noCache
  noCache: 'invalid',
};

// === FactoryProvider<T> Type Tests ===

// Positive: Valid FactoryProvider with no-args factory
const validFactoryProvider: FactoryProvider<string> = {
  provide: testToken,
  useFactory: () => 'factory result',
};

// Positive: Valid FactoryProvider with InjectFn factory
const validFactoryProviderWithInject: FactoryProvider<string> = {
  provide: testToken,
  useFactory: (inject: InjectFn) => {
    const value = inject(testToken, 'default');
    return `processed: ${value}`;
  },
  noCache: true,
};

// Positive: Valid FactoryProvider with explicit noCache: false (default behavior)
const validFactoryProviderCached: FactoryProvider<string> = {
  provide: testToken,
  useFactory: () => 'cached factory result',
  noCache: false,
};

// Positive: Factory with explicit typing should work for both signatures
const explicitNoArgsFactory: FactoryProvider<number> = {
  provide: new Token<number>('num'),
  useFactory: (): number => 42,
};

const explicitInjectFactory: FactoryProvider<number> = {
  provide: new Token<number>('num'),
  useFactory: (inject: InjectFn): number => {
    void inject;
    return 42;
  },
  noCache: true,
};

// Negative: Factory returning wrong type should fail
const invalidFactoryProvider: FactoryProvider<string> = {
  provide: testToken,
  // @ts-expect-error - number not assignable to string
  useFactory: () => 42,
};

// === ExistingProvider<T> Type Tests ===

// Positive: Valid ExistingProvider with same types
const sourceToken = new Token<string>('source');
const targetToken = new Token<string>('target');
const validExistingProvider: ExistingProvider<string> = {
  provide: targetToken,
  useExisting: sourceToken,
};

// Positive: ExistingProvider with classes
const validExistingProviderWithClass: ExistingProvider<TestServiceNoArgs> = {
  provide: serviceToken,
  useExisting: TestServiceNoArgs,
};

// Negative: Incompatible types should fail
const numberToken = new Token<number>('number');
const invalidExistingProvider: ExistingProvider<string> = {
  provide: testToken,
  // @ts-expect-error - Token<number> not assignable to InjectionId<string>
  useExisting: numberToken,
};

// === Provider<T> Union Type Tests ===

// Positive: All provider types should be assignable to Provider<T>
const providerFromValue: Provider<string> = validValueProvider;
const providerFromClass: Provider<TestServiceNoArgs> = validClassProvider;
const providerFromFactory: Provider<string> = validFactoryProvider;
const providerFromExisting: Provider<string> = validExistingProvider;
const providerFromConstructor: Provider<TestServiceNoArgs> = TestServiceNoArgs;

// Positive: InjectableConstructor should be assignable to Provider<T>
const providerFromInjectableConstructor: Provider<TestServiceWithInject> = TestServiceWithInject;

// Negative: Non-injectable constructor should fail
// @ts-expect-error - Constructor with non-InjectFn args not assignable to Provider<T>
const invalidProviderFromConstructor: Provider<TestServiceWithArgs> = TestServiceWithArgs;

// === Complex Provider Type Tests ===

// Positive: Provider with async factory
const asyncProvider: Provider<Promise<string>> = {
  provide: new Token<Promise<string>>('async'),
  useFactory: async () => 'async result',
};

// Positive: Provider with generic types
const genericToken = new Token<Array<string>>('generic');
const genericProvider: Provider<Array<string>> = {
  provide: genericToken,
  useFactory: () => ['item1', 'item2'],
  noCache: true,
};

// Suppress unused variable warnings
void asyncProvider;
void explicitInjectFactory;
void explicitNoArgsFactory;
void falseInjectFnClassProvider;
void genericProvider;
void invalidClassProvider;
void invalidExistingProvider;
void invalidFactoryProvider;
void invalidFalseWithInject;
void invalidMixedArgsFalse;
void invalidMixedArgsTrue;
void invalidNoCacheClassProvider;
void invalidRequiredArg;
void invalidRequiredArgTrue;
void invalidValueProvider;
void providerFromClass;
void providerFromConstructor;
void providerFromExisting;
void providerFromFactory;
void providerFromInjectableConstructor;
void providerFromValue;
void undefinedInjectFnClassProvider;
void validAllOptionalParams;
void validClassProvider;
void validClassProviderCached;
void validClassProviderWithInject;
void validComplexNoArgs;
void validExistingProvider;
void validExistingProviderWithClass;
void validExplicitFalse;
void validFactoryProvider;
void validFactoryProviderCached;
void validFactoryProviderWithInject;
void validInjectFnDefault;
void validInjectFnFalse;
void validInjectFnTrue;
void validMixedOptional;
void validOptionalParams;
void validValueProvider;
void validValueProviderWithClass;
