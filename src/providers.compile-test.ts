/**
 * @fileoverview Compile-time type tests for Provider types
 *
 * This file contains type assignments that verify TypeScript compilation behavior
 * for provider types. It should be included in typecheck but not in runtime builds.
 *
 * Positive tests: Should compile without errors
 * Negative tests: Should fail compilation (marked with @ts-expect-error)
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/require-await */

import {Token} from './types.js';
import type {InjectFn} from './types.js';
import type {
  ValueProvider,
  ClassProvider,
  FactoryProvider,
  ExistingProvider,
  Provider,
} from './providers.js';

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
  scope: 'singleton',
};

// Positive: Valid ClassProvider with InjectFn constructor
const validClassProviderWithInject: ClassProvider<TestServiceWithInject> = {
  provide: TestServiceWithInject,
  useClass: TestServiceWithInject,
  scope: 'transient',
};

// Negative: Constructor with incompatible args should fail
const invalidClassProvider: ClassProvider<TestServiceWithArgs> = {
  provide: TestServiceWithArgs,
  // @ts-expect-error - Constructor with non-InjectFn args not allowed
  useClass: TestServiceWithArgs,
  scope: 'singleton',
};

// Negative: Missing scope should fail
// @ts-expect-error - scope is required
const missingScopeClassProvider: ClassProvider<TestServiceNoArgs> = {
  provide: serviceToken,
  useClass: TestServiceNoArgs,
};

// Negative: Invalid scope should fail
const invalidScopeClassProvider: ClassProvider<TestServiceNoArgs> = {
  provide: serviceToken,
  useClass: TestServiceNoArgs,
  // @ts-expect-error - 'invalid' not assignable to InjectScope
  scope: 'invalid',
};

// === FactoryProvider<T> Type Tests ===

// Positive: Valid FactoryProvider with no-args factory
const validFactoryProvider: FactoryProvider<string> = {
  provide: testToken,
  useFactory: () => 'factory result',
  scope: 'singleton',
};

// Positive: Valid FactoryProvider with InjectFn factory
const validFactoryProviderWithInject: FactoryProvider<string> = {
  provide: testToken,
  useFactory: (inject: InjectFn) => {
    const value = inject(testToken, 'default');
    return `processed: ${value}`;
  },
  scope: 'transient',
};

// Positive: Factory with explicit typing should work for both signatures
const explicitNoArgsFactory: FactoryProvider<number> = {
  provide: new Token<number>('num'),
  useFactory: (): number => 42,
  scope: 'singleton',
};

const explicitInjectFactory: FactoryProvider<number> = {
  provide: new Token<number>('num'),
  useFactory: (inject: InjectFn): number => {
    void inject;
    return 42;
  },
  scope: 'transient',
};

// Negative: Factory returning wrong type should fail
const invalidFactoryProvider: FactoryProvider<string> = {
  provide: testToken,
  // @ts-expect-error - number not assignable to string
  useFactory: () => 42,
  scope: 'singleton',
};

// Negative: Missing scope should fail
// @ts-expect-error - scope is required
const missingScopeFactoryProvider: FactoryProvider<string> = {
  provide: testToken,
  useFactory: () => 'result',
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
  scope: 'singleton',
};

// Positive: Provider with generic types
const genericToken = new Token<Array<string>>('generic');
const genericProvider: Provider<Array<string>> = {
  provide: genericToken,
  useFactory: () => ['item1', 'item2'],
  scope: 'transient',
};

// Suppress unused variable warnings
void validValueProvider;
void validValueProviderWithClass;
void validClassProvider;
void validClassProviderWithInject;
void validFactoryProvider;
void validFactoryProviderWithInject;
void explicitNoArgsFactory;
void explicitInjectFactory;
void validExistingProvider;
void validExistingProviderWithClass;
void providerFromValue;
void providerFromClass;
void providerFromFactory;
void providerFromExisting;
void providerFromConstructor;
void providerFromInjectableConstructor;
void asyncProvider;
void genericProvider;
void invalidValueProvider;
void invalidClassProvider;
void invalidScopeClassProvider;
void invalidFactoryProvider;
void invalidExistingProvider;
