/** Tests for provider types */

import {describe, expect, it} from 'vitest';

import {InjectFn, Token} from './types.js';

import type {
  ClassProvider,
  ExistingProvider,
  FactoryProvider,
  Provider,
  ValueProvider,
} from './providers.js';

describe('Provider types', () => {
  it('creates ValueProvider', () => {
    const token = new Token<string>('test');
    const provider: ValueProvider<string> = {
      provide: token,
      useValue: 'test value',
    };

    expect(provider.provide).toBe(token);
    expect(provider.useValue).toBe('test value');
  });

  it('creates ClassProvider', () => {
    const token = new Token<TestService>('service');

    const provider: ClassProvider<TestService> = {
      provide: token,
      useClass: TestService,
      scope: 'singleton',
    };

    expect(provider.provide).toBe(token);
    expect(provider.useClass).toBe(TestService);
    expect(provider.scope).toBe('singleton');
  });

  it('creates FactoryProvider with no-args factory', () => {
    const token = new Token<number>('number');
    const factory = () => 42;

    const provider: FactoryProvider<number> = {
      provide: token,
      useFactory: factory,
      scope: 'transient',
    };

    expect(provider.provide).toBe(token);
    expect(provider.useFactory).toBe(factory);
    expect(provider.scope).toBe('transient');
  });

  it('creates FactoryProvider with InjectFn factory', () => {
    const token = new Token<string>('string');

    const factory = (inject: InjectFn) => {
      void inject;
      return 'result';
    };

    const provider: FactoryProvider<string> = {
      provide: token,
      useFactory: factory,
      scope: 'singleton',
    };

    expect(provider.provide).toBe(token);
    expect(provider.useFactory).toBe(factory);
    expect(provider.scope).toBe('singleton');
  });

  it('creates ExistingProvider', () => {
    const sourceToken = new Token<string>('source');
    const targetToken = new Token<string>('target');

    const provider: ExistingProvider<string> = {
      provide: targetToken,
      useExisting: sourceToken,
    };

    expect(provider.provide).toBe(targetToken);
    expect(provider.useExisting).toBe(sourceToken);
  });

  it('accepts constructor as Provider shorthand', () => {
    const provider: Provider<TestService> = TestService;
    expect(provider).toBe(TestService);
  });
});

class TestService {
  constructor() {}
}
