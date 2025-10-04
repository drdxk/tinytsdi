import {describe, expect, it} from 'vitest';

import {NeverCachedError, NotProvidedError} from '../errors.js';
import {Injector} from '../injector.js';
import {Token} from '../token.js';

describe('Injector meta methods', () => {
  describe('hasProviderFor', () => {
    it('returns true when provider is registered', () => {
      const injector = new Injector();
      const token = new Token<string>('test');

      injector.register({provide: token, useValue: 'test value'});

      expect(injector.hasProviderFor(token)).toBe(true);
    });

    it('returns false when provider is not registered', () => {
      const injector = new Injector();
      const token = new Token<string>('test');

      expect(injector.hasProviderFor(token)).toBe(false);
    });

    it('works with constructor providers', () => {
      const injector = new Injector();

      class TestService {}

      injector.register(TestService);

      expect(injector.hasProviderFor(TestService)).toBe(true);
    });

    it('works with different provider types', () => {
      const injector = new Injector();
      const valueToken = new Token<string>('value');
      const factoryToken = new Token<number>('factory');
      const classToken = new Token<TestService>('class');
      const aliasToken = new Token<string>('alias');

      class TestService {}

      injector.register([
        {provide: valueToken, useValue: 'test'},
        {provide: factoryToken, useFactory: () => 42},
        {provide: classToken, useClass: TestService, noCache: true},
        {provide: aliasToken, useExisting: valueToken},
      ]);

      expect(injector.hasProviderFor(valueToken)).toBe(true);
      expect(injector.hasProviderFor(factoryToken)).toBe(true);
      expect(injector.hasProviderFor(classToken)).toBe(true);
      expect(injector.hasProviderFor(aliasToken)).toBe(true);
    });

    it('returns false for unregistered provider after registration', () => {
      const injector = new Injector();
      const registeredToken = new Token<string>('registered');
      const unregisteredToken = new Token<string>('unregistered');

      injector.register({provide: registeredToken, useValue: 'test'});

      expect(injector.hasProviderFor(registeredToken)).toBe(true);
      expect(injector.hasProviderFor(unregisteredToken)).toBe(false);
    });
  });

  describe('hasCachedValue', () => {
    it('throws NotProvidedError when provider is not registered', () => {
      const injector = new Injector();
      const token = new Token<string>('test');

      expect(() => injector.hasCachedValue(token)).toThrow(NotProvidedError);
    });

    it('returns false when cached provider is registered but not resolved', () => {
      const injector = new Injector();
      const token = new Token<string>('test');

      injector.register({
        provide: token,
        useFactory: () => 'factory value',
      });

      expect(injector.hasCachedValue(token)).toBe(false);
    });

    it('returns true when cached provider is resolved and cached', () => {
      const injector = new Injector();
      const token = new Token<string>('test');

      injector.register({
        provide: token,
        useFactory: () => 'factory value',
      });

      // Resolve to trigger caching
      injector.inject(token);

      expect(injector.hasCachedValue(token)).toBe(true);
    });

    it('throws NeverCachedError for noCache providers and value providers', () => {
      const injector = new Injector();
      const transientToken = new Token<string>('transient');
      const valueToken = new Token<string>('value');

      injector.register([
        {provide: transientToken, useFactory: () => 'factory value', noCache: true},
        {provide: valueToken, useValue: 'test value'},
      ]);

      // Resolve both providers
      injector.inject(transientToken);
      injector.inject(valueToken);

      expect(() => injector.hasCachedValue(transientToken)).toThrow(NeverCachedError);
      expect(() => injector.hasCachedValue(valueToken)).toThrow(NeverCachedError);
    });

    it('works with constructor providers (cached by default)', () => {
      const injector = new Injector();

      class TestService {
        readonly id = Math.random();
      }

      injector.register(TestService);

      expect(injector.hasCachedValue(TestService)).toBe(false);

      // Resolve to trigger caching
      injector.inject(TestService);

      expect(injector.hasCachedValue(TestService)).toBe(true);
    });

    it('works with class providers based on caching behavior', () => {
      const injector = new Injector();
      const singletonToken = new Token<TestService>('singleton');
      const transientToken = new Token<TestService>('transient');

      class TestService {}

      injector.register([
        {provide: singletonToken, useClass: TestService},
        {provide: transientToken, useClass: TestService, noCache: true},
      ]);

      // Resolve both
      injector.inject(singletonToken);
      injector.inject(transientToken);

      expect(injector.hasCachedValue(singletonToken)).toBe(true);
      expect(() => injector.hasCachedValue(transientToken)).toThrow(NeverCachedError);
    });

    it('handles existing providers correctly', () => {
      const injector = new Injector();
      const originalToken = new Token<string>('original');
      const aliasToken = new Token<string>('alias');

      injector.register([
        {provide: originalToken, useFactory: () => 'original value'},
        {provide: aliasToken, useExisting: originalToken},
      ]);

      // Resolve the alias (which should resolve the original)
      injector.inject(aliasToken);

      expect(injector.hasCachedValue(originalToken)).toBe(true);
      expect(() => injector.hasCachedValue(aliasToken)).toThrow(NeverCachedError);
    });
  });

  describe('invalidate', () => {
    it('clears all cache when no ids provided', () => {
      const injector = new Injector();
      const token1 = new Token<string>('test1');
      const token2 = new Token<string>('test2');

      injector.register([
        {provide: token1, useFactory: () => 'value1'},
        {provide: token2, useFactory: () => 'value2'},
      ]);

      // Resolve to populate cache
      injector.inject(token1);
      injector.inject(token2);

      expect(injector.hasCachedValue(token1)).toBe(true);
      expect(injector.hasCachedValue(token2)).toBe(true);

      injector.invalidate();

      expect(injector.hasCachedValue(token1)).toBe(false);
      expect(injector.hasCachedValue(token2)).toBe(false);
    });

    it('clears cache for specific id', () => {
      const injector = new Injector();
      const token1 = new Token<string>('test1');
      const token2 = new Token<string>('test2');

      injector.register([
        {provide: token1, useFactory: () => 'value1'},
        {provide: token2, useFactory: () => 'value2'},
      ]);

      // Resolve to populate cache
      injector.inject(token1);
      injector.inject(token2);

      expect(injector.hasCachedValue(token1)).toBe(true);
      expect(injector.hasCachedValue(token2)).toBe(true);

      injector.invalidate(token1);

      expect(injector.hasCachedValue(token1)).toBe(false);
      expect(injector.hasCachedValue(token2)).toBe(true);
    });

    it('clears cache for array of ids', () => {
      const injector = new Injector();
      const token1 = new Token<string>('test1');
      const token2 = new Token<string>('test2');
      const token3 = new Token<string>('test3');

      injector.register([
        {provide: token1, useFactory: () => 'value1'},
        {provide: token2, useFactory: () => 'value2'},
        {provide: token3, useFactory: () => 'value3'},
      ]);

      // Resolve to populate cache
      injector.inject(token1);
      injector.inject(token2);
      injector.inject(token3);

      injector.invalidate([token1, token3]);

      expect(injector.hasCachedValue(token1)).toBe(false);
      expect(injector.hasCachedValue(token2)).toBe(true);
      expect(injector.hasCachedValue(token3)).toBe(false);
    });

    it('throws NotProvidedError for unregistered id', () => {
      const injector = new Injector();
      const token = new Token<string>('test');

      expect(() => injector.invalidate(token)).toThrow(NotProvidedError);
    });

    it('throws NeverCachedError for noCache providers', () => {
      const injector = new Injector();
      const token = new Token<string>('test');

      injector.register({provide: token, useFactory: () => 'value', noCache: true});

      expect(() => injector.invalidate(token)).toThrow(NeverCachedError);
    });

    it('throws NeverCachedError for value providers', () => {
      const injector = new Injector();
      const token = new Token<string>('test');

      injector.register({provide: token, useValue: 'value'});

      expect(() => injector.invalidate(token)).toThrow(NeverCachedError);
    });

    it('works with constructor providers', () => {
      const injector = new Injector();

      class TestService {
        readonly id = Math.random();
      }

      injector.register(TestService);

      // Resolve to populate cache
      const instance1 = injector.inject(TestService);
      expect(injector.hasCachedValue(TestService)).toBe(true);

      injector.invalidate(TestService);
      expect(injector.hasCachedValue(TestService)).toBe(false);

      // Next injection should create new instance
      const instance2 = injector.inject(TestService);
      expect(instance1).not.toBe(instance2);
    });

    it('handles mixed array with valid and invalid ids gracefully', () => {
      const injector = new Injector();
      const validToken = new Token<string>('valid');
      const invalidToken = new Token<string>('invalid');

      injector.register({provide: validToken, useFactory: () => 'value'});

      expect(() => injector.invalidate([validToken, invalidToken])).toThrow(NotProvidedError);

      // First token should not be invalidated due to error
      injector.inject(validToken);
      expect(injector.hasCachedValue(validToken)).toBe(true);
    });
  });

  describe('unregister', () => {
    it('removes all providers and cache when no ids provided', () => {
      const injector = new Injector();
      const token1 = new Token<string>('test1');
      const token2 = new Token<string>('test2');

      injector.register([
        {provide: token1, useValue: 'value1'},
        {provide: token2, useValue: 'value2'},
      ]);

      expect(injector.hasProviderFor(token1)).toBe(true);
      expect(injector.hasProviderFor(token2)).toBe(true);

      injector.unregister();

      expect(injector.hasProviderFor(token1)).toBe(false);
      expect(injector.hasProviderFor(token2)).toBe(false);
    });

    it('removes specific provider and its cache', () => {
      const injector = new Injector();
      const token1 = new Token<string>('test1');
      const token2 = new Token<string>('test2');

      injector.register([
        {provide: token1, useFactory: () => 'value1'},
        {provide: token2, useFactory: () => 'value2'},
      ]);

      // Resolve to populate cache
      injector.inject(token1);
      injector.inject(token2);

      expect(injector.hasProviderFor(token1)).toBe(true);
      expect(injector.hasCachedValue(token1)).toBe(true);

      injector.unregister(token1);

      expect(injector.hasProviderFor(token1)).toBe(false);
      expect(injector.hasProviderFor(token2)).toBe(true);
      expect(injector.hasCachedValue(token2)).toBe(true);
    });

    it('removes array of providers and their cache', () => {
      const injector = new Injector();
      const token1 = new Token<string>('test1');
      const token2 = new Token<string>('test2');
      const token3 = new Token<string>('test3');

      injector.register([
        {provide: token1, useFactory: () => 'value1'},
        {provide: token2, useFactory: () => 'value2'},
        {provide: token3, useFactory: () => 'value3'},
      ]);

      // Resolve to populate cache
      injector.inject(token1);
      injector.inject(token2);
      injector.inject(token3);

      injector.unregister([token1, token3]);

      expect(injector.hasProviderFor(token1)).toBe(false);
      expect(injector.hasProviderFor(token2)).toBe(true);
      expect(injector.hasProviderFor(token3)).toBe(false);
      expect(injector.hasCachedValue(token2)).toBe(true);
    });

    it('throws NotProvidedError for unregistered id', () => {
      const injector = new Injector();
      const token = new Token<string>('test');

      expect(() => injector.unregister(token)).toThrow(NotProvidedError);
    });

    it('works with constructor providers', () => {
      const injector = new Injector();

      class TestService {}

      injector.register(TestService);
      expect(injector.hasProviderFor(TestService)).toBe(true);

      injector.unregister(TestService);
      expect(injector.hasProviderFor(TestService)).toBe(false);
    });

    it('works with different provider types', () => {
      const injector = new Injector();
      const valueToken = new Token<string>('value');
      const factoryToken = new Token<string>('factory');
      const classToken = new Token<TestService>('class');
      const aliasToken = new Token<string>('alias');

      class TestService {}

      injector.register([
        {provide: valueToken, useValue: 'test'},
        {provide: factoryToken, useFactory: () => 'factory'},
        {provide: classToken, useClass: TestService, noCache: true},
        {provide: aliasToken, useExisting: valueToken},
      ]);

      injector.unregister([valueToken, factoryToken, classToken, aliasToken]);

      expect(injector.hasProviderFor(valueToken)).toBe(false);
      expect(injector.hasProviderFor(factoryToken)).toBe(false);
      expect(injector.hasProviderFor(classToken)).toBe(false);
      expect(injector.hasProviderFor(aliasToken)).toBe(false);
    });

    it('throws NotProvidedError on first invalid id in array', () => {
      const injector = new Injector();
      const validToken = new Token<string>('valid');
      const invalidToken = new Token<string>('invalid');

      injector.register({provide: validToken, useValue: 'value'});

      expect(() => injector.unregister([invalidToken, validToken])).toThrow(NotProvidedError);

      // First token should still be registered due to error
      expect(injector.hasProviderFor(validToken)).toBe(true);
    });

    it('after unregister all, injector can be used again', () => {
      const injector = new Injector();
      const token = new Token<string>('test');

      injector.register({provide: token, useValue: 'original'});
      expect(injector.inject(token)).toBe('original');

      injector.unregister();

      injector.register({provide: token, useValue: 'new'});
      expect(injector.inject(token)).toBe('new');
    });
  });
});
