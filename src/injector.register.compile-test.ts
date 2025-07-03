/**
 * @fileoverview Compile-time type tests for Injector class
 *
 * This file contains type assignments that verify TypeScript compilation behavior
 * for the Injector class. It should be included in typecheck but not in runtime builds.
 *
 * Positive tests: Should compile without errors
 * Negative tests: Should fail compilation (marked with @ts-expect-error)
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

import {Token} from './types.js';
import type {InjectFn} from './types.js';
import {Injector} from './injector.js';

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

// === Injector Constructor Tests ===

// Positive: Valid constructor calls
const defaultInjector: Injector = new Injector();
const explicitFalseInjector: Injector = new Injector(false);
const explicitTrueInjector: Injector = new Injector(true);

// Negative: Invalid constructor arguments
// @ts-expect-error - string not assignable to boolean
const invalidInjector: Injector = new Injector('invalid');

// === Single Provider Register Tests ===

const injector = new Injector();

// === ValueProvider Tests ===

// Positive: Valid value providers
injector.register({provide: stringToken, useValue: 'test string'});
injector.register({provide: numberToken, useValue: 42});
injector.register({provide: serviceToken, useValue: new TestServiceNoArgs()});

// Negative: Type mismatches in value providers
// @ts-expect-error - number not assignable to string
injector.register({provide: stringToken, useValue: 42});

// @ts-expect-error - string not assignable to number
injector.register({provide: numberToken, useValue: 'not a number'});

// @ts-expect-error - TestServiceWithInject not assignable to TestServiceNoArgs
injector.register({provide: serviceToken, useValue: new TestServiceWithInject(() => 'test')});

// === ClassProvider Tests ===

// Positive: Valid class providers with matching types
injector.register({
  provide: serviceToken,
  useClass: TestServiceNoArgs,
  scope: 'singleton',
});

injector.register({
  provide: TestServiceWithInject,
  useClass: TestServiceWithInject,
  scope: 'transient',
});

// Negative: Type mismatches in class providers
// @ts-expect-error - TestServiceNoArgs does not produce number
injector.register({
  provide: numberToken,
  useClass: TestServiceNoArgs,
  scope: 'singleton',
});

// @ts-expect-error - TestServiceNoArgs does not produce number
injector.register({
  provide: stringToken,
  useClass: TestServiceWithInject,
  scope: 'singleton',
});

// @ts-expect-error - TestServiceNoArgs does not produce number
injector.register({
  provide: TestServiceWithArgs,
  useClass: TestServiceWithArgs,
  scope: 'singleton',
});

// @ts-expect-error - missing scope
injector.register({
  provide: serviceToken,
  useClass: TestServiceNoArgs,
});

// @ts-expect-error - TestServiceNoArgs does not produce number
injector.register({
  provide: serviceToken,
  useClass: TestServiceNoArgs,
  scope: 'invalid',
});

// === FactoryProvider Tests ===

// Positive: Valid factory providers
injector.register({
  provide: stringToken,
  useFactory: () => 'factory string',
  scope: 'singleton',
});

injector.register({
  provide: numberToken,
  useFactory: (inject: InjectFn) => {
    const str = inject(stringToken, 'default');
    return str.length;
  },
  scope: 'transient',
});

injector.register({
  provide: serviceToken,
  useFactory: () => new TestServiceNoArgs(),
  scope: 'singleton',
});

// Negative: Type mismatches in factory providers
// @ts-expect-error - TestServiceNoArgs does not produce number
injector.register({
  provide: stringToken,
  useFactory: () => 42,
  scope: 'singleton',
});

// @ts-expect-error - TestServiceNoArgs does not produce number
injector.register({
  provide: numberToken,
  useFactory: () => 'not a number',
  scope: 'transient',
});

// @ts-expect-error - missing scope
injector.register({
  provide: stringToken,
  useFactory: () => 'test',
});

// === ExistingProvider Tests ===

// Positive: Valid existing providers
injector.register({
  provide: new Token<string>('alias'),
  useExisting: stringToken,
});

injector.register({
  provide: new Token<TestServiceNoArgs>('service-alias'),
  useExisting: serviceToken,
});

// Negative: Type mismatches in existing providers
// @ts-expect-error - TestServiceNoArgs does not produce number
injector.register({
  provide: stringToken,
  useExisting: numberToken,
});

// @ts-expect-error - TestServiceNoArgs does not produce number
injector.register({
  provide: numberToken,
  useExisting: serviceToken,
});

// === Constructor Provider Shorthand Tests ===

// Positive: Valid constructor providers
injector.register(TestServiceNoArgs);
injector.register(TestServiceWithInject);

// Negative: Invalid constructor providers
// @ts-expect-error - TestServiceWithArgs has invalid constructor signature
injector.register(TestServiceWithArgs);

// === Invalid Provider Types Tests ===

// Negative: Non-provider values should fail
// @ts-expect-error - string not assignable to provider
injector.register('invalid provider');

// @ts-expect-error - number not assignable to provider
injector.register(42);

// @ts-expect-error - plain object not assignable to provider
injector.register({invalidProperty: 'test'});

// @ts-expect-error - null not assignable to provider
injector.register(null);

// @ts-expect-error - undefined not assignable to provider
injector.register(undefined);

// === allowOverrides Parameter Tests ===

// Positive: Valid allowOverrides values
injector.register({provide: stringToken, useValue: 'test'}, true);
injector.register({provide: stringToken, useValue: 'test'}, false);

// Negative: Invalid allowOverrides values
// @ts-expect-error - string not assignable to boolean
injector.register({provide: stringToken, useValue: 'test'}, 'invalid');

// @ts-expect-error - number not assignable to boolean
injector.register({provide: stringToken, useValue: 'test'}, 1);

// === Array Provider Register Tests ===

// Positive: Valid arrays of providers
injector.register([
  {provide: stringToken, useValue: 'test'},
  {provide: numberToken, useValue: 42},
]);

injector.register([
  {provide: serviceToken, useValue: new TestServiceNoArgs()},
  TestServiceWithInject,
  {
    provide: new Token<string>('factory'),
    useFactory: () => 'from factory',
    scope: 'singleton',
  },
]);

// Positive: Empty array should work
injector.register([]);

// Positive: Single item array should work
injector.register([{provide: stringToken, useValue: 'single'}]);

// Positive: allowOverrides with arrays
injector.register(
  [
    {provide: stringToken, useValue: 'override1'},
    {provide: numberToken, useValue: 999},
  ],
  true
);

// Negative: Invalid arrays should fail
// @ts-expect-error - array of strings not assignable to provider array
injector.register(['invalid', 'providers']);

// @ts-expect-error - array with non-provider objects should fail
injector.register([{provide: stringToken, useValue: 'valid'}, {invalidProperty: 'not a provider'}]);

// @ts-expect-error - mixed valid and invalid items should fail
injector.register([{provide: stringToken, useValue: 'valid'}, 'invalid provider']);

// Suppress unused variable warnings
void defaultInjector;
void explicitFalseInjector;
void explicitTrueInjector;
