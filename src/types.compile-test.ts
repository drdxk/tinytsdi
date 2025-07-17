/**
 * Compile-time type tests for TSDI types
 *
 * This file contains type assignments that verify TypeScript compilation behavior.
 * It should be included in typecheck but not in runtime builds.
 *
 * Positive tests: Should compile without errors
 * Negative tests: Should fail compilation (marked with \@ts-expect-error)
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import {Token} from './types.js';

import type {
  Constructor,
  InjectFn,
  InjectScope,
  InjectableConstructor,
  InjectionId,
} from './types.js';

// Test class for constructor tests
class TestService {
  constructor(public value: string) {}
}

class TestServiceWithInject {
  constructor(private inject: InjectFn) {
    void this.inject; // Suppress unused parameter warning
  }
}

class TestServiceNoArgs {
  constructor() {}
}

class TestServiceWithArgs {
  constructor(
    public arg1: string,
    public arg2: number
  ) {}
}

// === InjectionId<T> Type Union Tests ===

// Positive: Token should be assignable to InjectionId
const stringToken = new Token<string>('test');
const tokenAsId: InjectionId<string> = stringToken;

// Positive: Constructor should be assignable to InjectionId
const serviceAsId: InjectionId<TestService> = TestService;

// Negative: Incompatible generic types should fail
// @ts-expect-error - Token<string> not assignable to InjectionId<number>
const wrongTokenType: InjectionId<number> = stringToken;

// @ts-expect-error - Constructor<TestService> not assignable to InjectionId<string>
const wrongConstructorType: InjectionId<string> = TestService;

// === InjectFn Parameter Variance Tests ===

// Positive: InjectFn should accept compatible id and defaultValue
const mockInject: InjectFn = () => 'mock' as any;
const injectedString: string = mockInject(stringToken, 'default');
const injectedService: TestService = mockInject(TestService, new TestService('default'));

// Positive: defaultValue should be optional
const injectedWithoutDefault: string = mockInject(stringToken);

// Negative: Incompatible defaultValue type should fail
// @ts-expect-error - number not assignable to string default
const wrongDefault: string = mockInject(stringToken, 42);

// Negative: Return type should match generic
// @ts-expect-error - string not assignable to number
const wrongReturnType: number = mockInject(stringToken, 'default');

// === Constructor<T> Type Constraints Tests ===

// Positive: Classes should be assignable to Constructor<T>
const validConstructor: Constructor<TestService> = TestService;
const validConstructorWithInject: Constructor<TestServiceWithInject> = TestServiceWithInject;

// Negative: Non-constructor values should fail
// @ts-expect-error - string not assignable to Constructor<T>
const notConstructor: Constructor<TestService> = 'not a constructor';

// @ts-expect-error - function not assignable to Constructor<T>
const notConstructorFn: Constructor<TestService> = () => new TestService('test');

// === InjectableConstructor<T> Type Constraints Tests ===

// Positive: Classes with no args should be assignable to InjectableConstructor<T>
const validInjectableNoArgs: InjectableConstructor<TestServiceNoArgs> = TestServiceNoArgs;

// Positive: Classes with InjectFn arg should be assignable to InjectableConstructor<T>
const validInjectableWithInject: InjectableConstructor<TestServiceWithInject> =
  TestServiceWithInject;

// Negative: Classes with other args should fail
// @ts-expect-error - Constructor with non-InjectFn args not assignable to InjectableConstructor<T>
const invalidInjectableWithArgs: InjectableConstructor<TestServiceWithArgs> = TestServiceWithArgs;

// Negative: Non-constructor values should fail
// @ts-expect-error - string not assignable to InjectableConstructor<T>
const notInjectableConstructor: InjectableConstructor<TestServiceNoArgs> = 'not a constructor';

// === Token<T> Generic Type Safety Tests ===

// Positive: Same generic type should be compatible
const stringToken1 = new Token<string>('first');
const stringToken2: Token<string> = stringToken1;

// Negative: Different generic types should fail
const numberToken = new Token<number>('number');
// @ts-expect-error - Token<string> not assignable to Token<number>
const incompatibleToken: Token<number> = stringToken1;

// @ts-expect-error - Token<number> not assignable to Token<string>
const incompatibleToken2: Token<string> = numberToken;

// === InjectScope Type Tests ===

// Positive: Valid scope values
const singletonScope: InjectScope = 'singleton';
const transientScope: InjectScope = 'transient';

// Negative: Invalid scope values should fail
// @ts-expect-error - 'invalid' not assignable to InjectScope
const invalidScope: InjectScope = 'invalid';

// @ts-expect-error - number not assignable to InjectScope
const numericScope: InjectScope = 1;

// === Complex Type Composition Tests ===

// Positive: Complex generic preservation
const complexToken = new Token<TestService>('service');
const complexId: InjectionId<TestService> = complexToken;
const complexInject: TestService = mockInject(complexId);

// Negative: Generic type propagation should be enforced
// @ts-expect-error - TestService not assignable to string
const wrongComplexType: string = mockInject(complexToken);

// === Array and Union Type Edge Cases ===

// Positive: Token with union types
const unionToken = new Token<string | number>('union');
const unionValue: string | number = mockInject(unionToken);

// Positive: Token with array types
const arrayToken = new Token<string[]>('array');
const arrayValue: string[] = mockInject(arrayToken);

// Negative: Incompatible union member assignment
// @ts-expect-error - string | number not assignable to string
const narrowUnion: string = mockInject(unionToken);

// Suppress unused variable warnings
void tokenAsId;
void serviceAsId;
void injectedString;
void injectedService;
void injectedWithoutDefault;
void validConstructor;
void validConstructorWithInject;
void validInjectableNoArgs;
void validInjectableWithInject;
void stringToken2;
void singletonScope;
void transientScope;
void complexInject;
void unionValue;
void arrayValue;
