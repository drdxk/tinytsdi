/**
 * @fileoverview Compile-time type tests for global register function
 *
 * This file contains type assignments that verify TypeScript compilation behavior
 * for the global register function. It should be included in typecheck but not in runtime builds.
 *
 * Positive tests: Should compile without errors
 * Negative tests: Should fail compilation (marked with @ts-expect-error)
 */

import {Token} from './types.js';
import type {InjectFn} from './types.js';
import {register} from './global.js';

// Test classes with unique identities to avoid structural typing issues
class TestServiceNoArgs {
  readonly noArgsMarker = true;
  constructor() {}
  getNoArgsInfo(): string {
    return 'TestServiceNoArgs';
  }
}

class TestServiceWithInject {
  readonly injectMarker = 'hasInject';
  constructor(private inject: InjectFn) {
    void this.inject;
  }
  getInjectFn(): InjectFn {
    return this.inject;
  }
}

class TestServiceWithArgs {
  readonly argsMarker = 42;
  constructor(
    public arg1: string,
    public arg2: number
  ) {}
  getArgsData(): {arg1: string; arg2: number} {
    return {arg1: this.arg1, arg2: this.arg2};
  }
}

const stringToken = new Token<string>('string');
const numberToken = new Token<number>('number');
const serviceToken = new Token<TestServiceNoArgs>('service');

// === ValueProvider Tests ===

// Positive: Valid value providers
register({provide: stringToken, useValue: 'test string'});
register({provide: numberToken, useValue: 42});
register({provide: serviceToken, useValue: new TestServiceNoArgs()});

// Negative: Type mismatches in value providers
// @ts-expect-error - number not assignable to string
register({provide: stringToken, useValue: 42});

// @ts-expect-error - string not assignable to number
register({provide: numberToken, useValue: 'not a number'});

// @ts-expect-error - TestServiceWithInject not assignable to TestServiceNoArgs
register({provide: serviceToken, useValue: new TestServiceWithInject(() => 'test')});

// === ClassProvider Tests ===

// Positive: Valid class providers with matching types
register({
  provide: serviceToken,
  useClass: TestServiceNoArgs,
  scope: 'singleton',
});

register({
  provide: TestServiceWithInject,
  useClass: TestServiceWithInject,
  scope: 'transient',
});

// Negative: Type mismatches in class providers
// @ts-expect-error - TestServiceNoArgs does not produce number
register({
  provide: numberToken,
  useClass: TestServiceNoArgs,
  scope: 'singleton',
});

// @ts-expect-error - TestServiceWithInject does not produce string
register({
  provide: stringToken,
  useClass: TestServiceWithInject,
  scope: 'singleton',
});

// @ts-expect-error - TestServiceWithArgs has invalid constructor
register({
  provide: TestServiceWithArgs,
  useClass: TestServiceWithArgs,
  scope: 'singleton',
});

// @ts-expect-error - missing scope
register({
  provide: serviceToken,
  useClass: TestServiceNoArgs,
});

// @ts-expect-error - invalid scope value
register({
  provide: serviceToken,
  useClass: TestServiceNoArgs,
  scope: 'invalid',
});

// === FactoryProvider Tests ===

// Positive: Valid factory providers
register({
  provide: stringToken,
  useFactory: () => 'factory string',
  scope: 'singleton',
});

register({
  provide: numberToken,
  useFactory: (inject: InjectFn) => {
    const str = inject(stringToken, 'default');
    return str.length;
  },
  scope: 'transient',
});

register({
  provide: serviceToken,
  useFactory: () => new TestServiceNoArgs(),
  scope: 'singleton',
});

// Negative: Type mismatches in factory providers
// @ts-expect-error - factory must return string, not number
register({
  provide: stringToken,
  useFactory: () => 42,
  scope: 'singleton',
});

// @ts-expect-error - factory must return number, not string
register({
  provide: numberToken,
  useFactory: () => 'not a number',
  scope: 'transient',
});

// @ts-expect-error - missing scope
register({
  provide: stringToken,
  useFactory: () => 'test',
});

// === ExistingProvider Tests ===

// Positive: Valid existing providers
register({
  provide: new Token<string>('alias'),
  useExisting: stringToken,
});

register({
  provide: new Token<TestServiceNoArgs>('service-alias'),
  useExisting: serviceToken,
});

// Negative: Type mismatches in existing providers
// @ts-expect-error - numberToken not assignable to string token
register({
  provide: stringToken,
  useExisting: numberToken,
});

// @ts-expect-error - serviceToken not assignable to number token
register({
  provide: numberToken,
  useExisting: serviceToken,
});

// === Constructor Provider Shorthand Tests ===

// Positive: Valid constructor providers
register(TestServiceNoArgs);
register(TestServiceWithInject);

// Negative: Invalid constructor providers
// @ts-expect-error - TestServiceWithArgs has invalid constructor signature
register(TestServiceWithArgs);

// === Invalid Provider Types Tests ===

// Negative: Non-provider values should fail
// @ts-expect-error - string not assignable to provider
register('invalid provider');

// @ts-expect-error - number not assignable to provider
register(42);

// @ts-expect-error - plain object not assignable to provider
register({invalidProperty: 'test'});

// @ts-expect-error - null not assignable to provider
register(null);

// @ts-expect-error - undefined not assignable to provider
register(undefined);

// === allowOverrides Parameter Tests ===

// Positive: Valid allowOverrides values
register({provide: stringToken, useValue: 'test'}, true);
register({provide: stringToken, useValue: 'test'}, false);

// Negative: Invalid allowOverrides values
// @ts-expect-error - string not assignable to boolean
register({provide: stringToken, useValue: 'test'}, 'invalid');

// @ts-expect-error - number not assignable to boolean
register({provide: stringToken, useValue: 'test'}, 1);

// === Array Provider Register Tests ===

// Positive: Valid arrays of providers
register([
  {provide: stringToken, useValue: 'test'},
  {provide: numberToken, useValue: 42},
]);

register([
  {provide: serviceToken, useValue: new TestServiceNoArgs()},
  TestServiceWithInject,
  {
    provide: new Token<string>('factory'),
    useFactory: () => 'from factory',
    scope: 'singleton',
  },
]);

// Positive: Empty array should work
register([]);

// Positive: Single item array should work
register([{provide: stringToken, useValue: 'single'}]);

// Positive: allowOverrides with arrays
register(
  [
    {provide: stringToken, useValue: 'override1'},
    {provide: numberToken, useValue: 999},
  ],
  true
);

// Negative: Invalid arrays should fail
// @ts-expect-error - array of strings not assignable to provider array
register(['invalid', 'providers']);

// @ts-expect-error - array with non-provider objects should fail
register([{provide: stringToken, useValue: 'valid'}, {invalidProperty: 'not a provider'}]);

// @ts-expect-error - mixed valid and invalid items should fail
register([{provide: stringToken, useValue: 'valid'}, 'invalid provider']);
