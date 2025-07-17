/**
 * Compile-time tests for global inject function
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

import {inject, register} from './global.js';
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

const stringToken = new Token<string>('string');
const numberToken = new Token<number>('number');
const serviceToken = new Token<TestServiceWithNoArgs>('service');

// Register some providers
register({provide: stringToken, useValue: 'test'});
register({provide: numberToken, useValue: 42});
register(TestServiceWithNoArgs);

// Test: inject() returns correct types
const str: string = inject(stringToken);
const num: number = inject(numberToken);
const service: TestServiceWithNoArgs = inject(TestServiceWithNoArgs);

// Test: inject() with default values preserves types
const strWithDefault: string = inject(stringToken, 'default');
const numWithDefault: number = inject(numberToken, 0);

// Test: inject() with wrong default type should fail
// @ts-expect-error - Default value type must match token type
const strWithWrongDefault = inject(stringToken, 123);

// @ts-expect-error - Default value type must match token type
const numWithWrongDefault = inject(numberToken, 'wrong');

// Test: inject() with unregistered token and no default should work (runtime will fail)
const unregistered: string = inject(new Token<string>('unregistered'));

// Test: inject() return type matches token type exactly
const tokenResult: TestServiceWithNoArgs = inject(serviceToken);

// @ts-expect-error - Cannot assign to wrong type
const wrongType: TestServiceWithInject = inject(serviceToken);

// Test: Class constructor injection works with proper types
const classResult: TestServiceWithNoArgs = inject(TestServiceWithNoArgs);

// @ts-expect-error - Cannot inject class with invalid constructor
register(TestServiceInvalidConstructor);

// Test: Factory function type safety
const factoryToken = new Token<{value: string}>('factory');

register({
  provide: factoryToken,
  useFactory: (inject: InjectFn) => ({
    value: inject(stringToken),
  }),
  scope: 'singleton',
});

const factoryResult: {value: string} = inject(factoryToken);

// Test: Factory function must return correct type
// @ts-expect-error - Factory must return string, not number
register({
  provide: new Token<string>('factory-str'),
  useFactory: (): number => 42,
  scope: 'singleton',
});

// Test: Class provider type checking
const classProviderToken = new Token<TestServiceWithNoArgs>('class-provider');

register({
  provide: classProviderToken,
  useClass: TestServiceWithNoArgs,
  scope: 'singleton',
});

// @ts-expect-error - useClass must be compatible with provide type
register({
  provide: stringToken,
  useClass: TestServiceWithNoArgs,
  scope: 'singleton',
});

// Test: Existing provider type checking
const aliasToken = new Token<string>('alias');

register({
  provide: aliasToken,
  useExisting: stringToken, // OK - both are string tokens
});

// @ts-expect-error - useExisting must be compatible with provide type
register({
  provide: stringToken,
  useExisting: numberToken,
});

// Test: Value provider type checking
const valueToken = new Token<boolean>('boolean');

register({
  provide: valueToken,
  useValue: true, // OK - boolean value for boolean token
});

register({
  provide: valueToken,
  // @ts-expect-error - useValue must match provide type
  useValue: 'not a boolean',
});

// Test: inject() method signature overloads
const maybeString: string = inject(stringToken, 'fallback');
const definitelyString: string = inject(stringToken);

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
register(ServiceA);
register(ServiceB);

// @ts-expect-error - ServiceC has invalid constructor signature
register(ServiceC);

// Test injection results have correct types
const serviceA: ServiceA = inject(ServiceA);
const serviceB: ServiceB = inject(ServiceB);

// @ts-expect-error - Cannot assign ServiceA to ServiceB
const wrongAssignment: ServiceB = inject(ServiceA);

// Suppress unused variable warnings
void str;
void num;
void service;
void strWithDefault;
void numWithDefault;
void unregistered;
void tokenResult;
void classResult;
void factoryResult;
void maybeString;
void definitelyString;
void serviceA;
void serviceB;
