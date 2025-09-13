/** Tests for Injector creation flows. */

import {describe, expect, it} from 'vitest';

import {NotProvidedError} from '../errors.js';
import {Injector} from '../injector.js';
import {InjectFn, Token} from '../types.js';

describe('Injector creation', () => {
  describe('constructor', () => {
    it('creates injector with default allowOverrides=false', () => {
      const injector = new Injector();
      const token = new Token<string>('override-test-default-false');
      injector.register({provide: token, useValue: 'first'});

      expect(() => {
        injector.register({provide: token, useValue: 'second'});
      }).toThrow();
      expect(injector.inject(token)).toBe('first');
    });

    it('creates injector with defaultAllowOverrides=true', () => {
      const injector = new Injector({defaultAllowOverrides: true});
      const token = new Token<string>('override-test-true');
      injector.register({provide: token, useValue: 'first'});

      expect(() => {
        injector.register({provide: token, useValue: 'second'});
      }).not.toThrow();
      expect(injector.inject(token)).toBe('second');
    });

    it('creates injector with defaultAllowOverrides=false', () => {
      const injector = new Injector({defaultAllowOverrides: false});
      const token = new Token<string>('override-test-false');
      injector.register({provide: token, useValue: 'first'});

      expect(() => {
        injector.register({provide: token, useValue: 'second'});
      }).toThrow();
      expect(injector.inject(token)).toBe('first');
    });
  });

  describe('from', () => {
    it('creates new injector with copied providers', () => {
      const sourceInjector = new Injector();
      const token = new Token<string>('test');

      sourceInjector.register({provide: token, useValue: 'test value'});

      const newInjector = Injector.from(sourceInjector);

      expect(newInjector.inject(token)).toBe('test value');
    });

    it('creates new injector with defaultAllowOverrides setting copied', () => {
      const sourceInjector = new Injector({defaultAllowOverrides: true});
      const newInjector = Injector.from(sourceInjector);

      const token = new Token<string>('override-test-copied-true');
      newInjector.register({provide: token, useValue: 'first'});

      expect(() => {
        newInjector.register({provide: token, useValue: 'second'});
      }).not.toThrow();
      expect(newInjector.inject(token)).toBe('second');
    });

    it('creates new injector with defaultAllowOverrides=false copied', () => {
      const sourceInjector = new Injector({defaultAllowOverrides: false});
      const newInjector = Injector.from(sourceInjector);

      const token = new Token<string>('override-test-copied-false');
      newInjector.register({provide: token, useValue: 'first'});

      expect(() => {
        newInjector.register({provide: token, useValue: 'second'});
      }).toThrow();
      expect(newInjector.inject(token)).toBe('first');
    });

    it('creates new injector without copying cache by default', () => {
      const sourceInjector = new Injector();
      const token = new Token<string>('test');
      let callCount = 0;

      sourceInjector.register({
        provide: token,
        useFactory: () => `factory-${++callCount}`,
      });

      // Trigger caching in source injector
      const firstResult = sourceInjector.inject(token);
      expect(firstResult).toBe('factory-1');

      const newInjector = Injector.from(sourceInjector);

      // New injector should not have cache, so factory should be called again
      const secondResult = newInjector.inject(token);
      expect(secondResult).toBe('factory-2');
      expect(callCount).toBe(2);
    });

    it('creates new injector with cache copied when copyCache=true', () => {
      const sourceInjector = new Injector();
      const token = new Token<string>('test');
      let callCount = 0;

      sourceInjector.register({
        provide: token,
        useFactory: () => `factory-${++callCount}`,
      });

      // Trigger caching in source injector
      const firstResult = sourceInjector.inject(token);
      expect(firstResult).toBe('factory-1');

      const newInjector = Injector.from(sourceInjector, {copyCache: true});

      // New injector should have cache, so factory should not be called again
      const secondResult = newInjector.inject(token);
      expect(secondResult).toBe('factory-1');
      expect(callCount).toBe(1);
    });

    it('creates new injector with cache not copied when copyCache=false', () => {
      const sourceInjector = new Injector();
      const token = new Token<string>('test');
      let callCount = 0;

      sourceInjector.register({
        provide: token,
        useFactory: () => `factory-${++callCount}`,
      });

      // Trigger caching in source injector
      const firstResult = sourceInjector.inject(token);
      expect(firstResult).toBe('factory-1');

      const newInjector = Injector.from(sourceInjector, {copyCache: false});

      // New injector should not have cache, so factory should be called again
      const secondResult = newInjector.inject(token);
      expect(secondResult).toBe('factory-2');
      expect(callCount).toBe(2);
    });

    it('creates new injector with multiple providers copied', () => {
      const sourceInjector = new Injector();
      const token1 = new Token<string>('test1');
      const token2 = new Token<number>('test2');

      class TestService {
        readonly marker = 'test-service';
      }

      sourceInjector.register([
        {provide: token1, useValue: 'value1'},
        {provide: token2, useValue: 42},
        TestService,
      ]);

      const newInjector = Injector.from(sourceInjector);

      expect(newInjector.inject(token1)).toBe('value1');
      expect(newInjector.inject(token2)).toBe(42);
      expect(newInjector.inject(TestService)).toBeInstanceOf(TestService);
    });

    it('creates independent injector that does not affect source', () => {
      const sourceInjector = new Injector();
      const token = new Token<string>('test');

      sourceInjector.register({provide: token, useValue: 'original'});

      const newInjector = Injector.from(sourceInjector);

      // Register different provider in new injector
      newInjector.register({provide: token, useValue: 'modified'}, true);

      // Source injector should be unaffected
      expect(sourceInjector.inject(token)).toBe('original');
      expect(newInjector.inject(token)).toBe('modified');
    });

    it('creates injector with empty provider map when source is empty', () => {
      const sourceInjector = new Injector();
      const newInjector = Injector.from(sourceInjector);

      const token = new Token<string>('test');

      expect(() => newInjector.inject(token)).toThrow(NotProvidedError);
    });

    it('preserves complex provider configurations', () => {
      const sourceInjector = new Injector();
      const valueToken = new Token<string>('value');
      const factoryToken = new Token<string>('factory');
      const classToken = new Token<TestService>('class');
      const aliasToken = new Token<string>('alias');

      class TestService {
        constructor(public inject: InjectFn) {}

        getValue() {
          return this.inject(valueToken);
        }
      }

      sourceInjector.register([
        {provide: valueToken, useValue: 'test value'},
        {
          provide: factoryToken,
          useFactory: (inject) => `factory: ${inject(valueToken)}`,
        },
        {provide: classToken, useClass: TestService, noCache: true, injectFn: true},
        {provide: aliasToken, useExisting: valueToken},
      ]);

      const newInjector = Injector.from(sourceInjector);

      expect(newInjector.inject(valueToken)).toBe('test value');
      expect(newInjector.inject(factoryToken)).toBe('factory: test value');
      expect(newInjector.inject(classToken).getValue()).toBe('test value');
      expect(newInjector.inject(aliasToken)).toBe('test value');
    });
  });
});
