/** Compile-time tests for Injector inject method */

/* eslint-disable @typescript-eslint/no-unused-vars */

import {Injector} from './injector.js';
import {Token} from './types.js';

import type {InjectFn} from './types.js';

// Test classes for injection
class TestServiceWithNoArgs {
  readonly serviceType = 'no-args' as const;
}

class TestServiceWithInject {
  readonly serviceType = 'with-inject' as const;
  constructor(private inject: InjectFn) {
    void this.inject;
  }
}

class TestServiceInvalidConstructor {
  readonly serviceType = 'invalid' as const;
  // @ts-expect-error - Constructor with wrong parameter type should not be injectable
  constructor(private someOtherParam: string) {}
}

const injector = new Injector();
const stringToken = new Token<string>('string');
const numberToken = new Token<number>('number');
const serviceToken = new Token<TestServiceWithNoArgs>('service');

// Register some providers
injector.register({provide: stringToken, useValue: 'test'});
injector.register({provide: numberToken, useValue: 42});
injector.register(TestServiceWithNoArgs);

// Test: inject() returns correct types
const str: string = injector.inject(stringToken);
const num: number = injector.inject(numberToken);
const service: TestServiceWithNoArgs = injector.inject(TestServiceWithNoArgs);

// Test: inject() with default values preserves types
const strWithDefault: string = injector.inject(stringToken, 'default');
const numWithDefault: number = injector.inject(numberToken, 0);

// Test: inject() allows overriding return type with null
const strWithNullOverride: string | null = injector.inject(stringToken, null);
const numWithNullOverride: number | null = injector.inject(numberToken, null);
const serviceWithNullOverride: TestServiceWithNoArgs | null = injector.inject(
  TestServiceWithNoArgs,
  null
);

// Test: inject() with wrong default type should fail
// @ts-expect-error - Default value type must match token type
const strWithWrongDefault = injector.inject(stringToken, 123);

// @ts-expect-error - Default value type must match token type
const numWithWrongDefault = injector.inject(numberToken, 'wrong');

// @ts-expect-error - Default value type must match token type
const serviceWithWrongOverride = injector.inject(TestServiceWithNoArgs, {random: 'object'});

// Test: inject() with unregistered token and no default should work (runtime will fail)
const unregistered: string = injector.inject(new Token<string>('unregistered'));

// Test: inject() return type matches token type exactly
const tokenResult: TestServiceWithNoArgs = injector.inject(serviceToken);

// @ts-expect-error - Cannot assign to wrong type
const wrongType: TestServiceWithInject = injector.inject(serviceToken);

// Test: Class constructor injection works with proper types
const classResult: TestServiceWithNoArgs = injector.inject(TestServiceWithNoArgs);

// @ts-expect-error - Cannot inject class with invalid constructor
injector.register(TestServiceInvalidConstructor);

// Test: Factory function type safety
const factoryToken = new Token<{value: string}>('factory');

injector.register({
  provide: factoryToken,
  useFactory: (inject: InjectFn) => ({
    value: inject(stringToken),
  }),
});

const factoryResult: {value: string} = injector.inject(factoryToken);

// Test: Factory function must return correct type
// @ts-expect-error - Factory must return string, not number
injector.register({
  provide: new Token<string>('factory-str'),
  useFactory: (): number => 42,
});

// Test: Class provider type checking
const classProviderToken = new Token<TestServiceWithNoArgs>('class-provider');

injector.register({
  provide: classProviderToken,
  useClass: TestServiceWithNoArgs,
});

// @ts-expect-error - useClass must be compatible with provide type
injector.register({
  provide: stringToken,
  useClass: TestServiceWithNoArgs,
});

// Test: Existing provider type checking
const aliasToken = new Token<string>('alias');

injector.register({
  provide: aliasToken,
  useExisting: stringToken, // OK - both are string tokens
});

// @ts-expect-error - useExisting must be compatible with provide type
injector.register({
  provide: stringToken,
  useExisting: numberToken,
});

// Test: Value provider type checking
const valueToken = new Token<boolean>('boolean');

injector.register({
  provide: valueToken,
  useValue: true, // OK - boolean value for boolean token
});

injector.register({
  provide: valueToken,
  // @ts-expect-error - useValue must match provide type
  useValue: 'not a boolean',
});

// Test: inject() method signature overloads
const maybeString: string = injector.inject(stringToken, 'fallback');
const definitelyString: string = injector.inject(stringToken);

// Test: Constructor injection type safety
class ServiceA {
  readonly type = 'A' as const;
}

class ServiceB {
  readonly type = 'B' as const;
  constructor(private inject: InjectFn) {
    void this.inject;
  }
}

class ServiceC {
  readonly type = 'C' as const;
  constructor(dep: ServiceA) {
    // Invalid - should use InjectFn
    void dep;
  }
}

// Valid registrations
injector.register(ServiceA);
injector.register(ServiceB);

// @ts-expect-error - ServiceC has invalid constructor signature
injector.register(ServiceC);

// Test injection results have correct types
const serviceA: ServiceA = injector.inject(ServiceA);
const serviceB: ServiceB = injector.inject(ServiceB);

// @ts-expect-error - Cannot assign ServiceA to ServiceB
const wrongAssignment: ServiceB = injector.inject(ServiceA);

// Suppress unused variable warnings
void str;
void num;
void service;
void serviceWithNullOverride;
void strWithDefault;
void strWithNullOverride;
void numWithDefault;
void numWithNullOverride;
void unregistered;
void tokenResult;
void classResult;
void factoryResult;
void maybeString;
void definitelyString;
void serviceA;
void serviceB;
