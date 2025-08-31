/** Tests for Injector class */

import {describe, expect, it} from 'vitest';

import {AlreadyProvidedError, NotProvidedError, UnknownProviderError} from './errors.js';
import {Injector} from './injector.js';
import {InjectFn, Token} from './types.js';

describe('Injector', () => {
  describe('constructor', () => {
    it('creates injector with default allowOverrides=false', () => {
      const injector = new Injector();
      expect(injector.defaultAllowOverrides).toBe(false);
    });

    it('creates injector with explicit allowOverrides=true', () => {
      const injector = new Injector(true);
      expect(injector.defaultAllowOverrides).toBe(true);
    });

    it('creates injector with explicit allowOverrides=false', () => {
      const injector = new Injector(false);
      expect(injector.defaultAllowOverrides).toBe(false);
    });
  });

  describe('register', () => {
    it('registers single value provider', () => {
      const injector = new Injector();
      const token = new Token<string>('test');
      const provider = {provide: token, useValue: 'test value'};

      expect(() => injector.register(provider)).not.toThrow();
    });

    it('registers multiple providers of same type', () => {
      const injector = new Injector();
      const token1 = new Token<string>('test1');
      const token2 = new Token<string>('test2');
      const providers = [
        {provide: token1, useValue: 'test1'},
        {provide: token2, useValue: 'test2'},
      ];

      expect(() => injector.register(providers)).not.toThrow();
    });

    it('registers multiple providers of different types', () => {
      const injector = new Injector();
      const token1 = new Token<string>('test1');
      const token2 = new Token<number>('test2');
      const providers = [
        {provide: token1, useValue: 'test1'},
        {provide: token2, useValue: 42},
      ];

      expect(() => injector.register(providers)).not.toThrow();
    });

    it('registers multiple providers with separate calls', () => {
      const injector = new Injector();
      const stringToken = new Token<string>('string');
      const numberToken = new Token<number>('number');

      expect(() => {
        injector.register({provide: stringToken, useValue: 'test'});
        injector.register({provide: numberToken, useValue: 42});
      }).not.toThrow();
    });

    it('registers constructor provider shorthand', () => {
      const injector = new Injector();
      class TestService {}

      expect(() => injector.register(TestService)).not.toThrow();
    });

    it('throws AlreadyProvidedError on duplicate registration by default', () => {
      const injector = new Injector();
      const token = new Token<string>('test');
      const provider = {provide: token, useValue: 'test value'};

      injector.register(provider);
      expect(() => injector.register(provider)).toThrow(AlreadyProvidedError);
    });

    it('allows override when allowOverrides=true', () => {
      const injector = new Injector();
      const token = new Token<string>('test');
      const provider1 = {provide: token, useValue: 'first'};
      const provider2 = {provide: token, useValue: 'second'};

      injector.register(provider1);
      expect(() => injector.register(provider2, true)).not.toThrow();
    });

    it('respects defaultAllowOverrides setting', () => {
      const injector = new Injector(true);
      const token = new Token<string>('test');
      const provider1 = {provide: token, useValue: 'first'};
      const provider2 = {provide: token, useValue: 'second'};

      injector.register(provider1);
      expect(() => injector.register(provider2)).not.toThrow();
    });

    it('explicit allowOverrides=false overrides defaultAllowOverrides=true', () => {
      const injector = new Injector(true);
      const token = new Token<string>('test');
      const provider1 = {provide: token, useValue: 'first'};
      const provider2 = {provide: token, useValue: 'second'};

      injector.register(provider1);
      expect(() => injector.register(provider2, false)).toThrow(AlreadyProvidedError);
    });

    it('registers different provider types', () => {
      const injector = new Injector();
      const valueToken = new Token<string>('value');
      const classToken = new Token<TestService>('class');
      const factoryToken = new Token<number>('factory');
      const aliasToken = new Token<string>('alias');

      class TestService {
        readonly marker = 'test';
      }

      expect(() => {
        injector.register({provide: valueToken, useValue: 'test'});
        injector.register({provide: classToken, useClass: TestService, scope: 'singleton'});
        injector.register({provide: factoryToken, useFactory: () => 42, scope: 'transient'});
        injector.register({provide: aliasToken, useExisting: valueToken});
      }).not.toThrow();
    });

    it('registers empty array', () => {
      const injector = new Injector();
      expect(() => injector.register([])).not.toThrow();
    });

    it('handles duplicate registration in array with allowOverrides=true', () => {
      const injector = new Injector();
      const token = new Token<string>('test');

      injector.register({provide: token, useValue: 'first'});

      expect(() =>
        injector.register(
          [
            {provide: token, useValue: 'second'},
            {provide: new Token<number>('other'), useValue: 42},
          ],
          true
        )
      ).not.toThrow();
    });

    it('throws on duplicate registration in array with allowOverrides=false', () => {
      const injector = new Injector();
      const token = new Token<string>('test');

      injector.register({provide: token, useValue: 'first'});

      expect(() =>
        injector.register(
          [
            {provide: token, useValue: 'second'},
            {provide: new Token<number>('other'), useValue: 42},
          ],
          false
        )
      ).toThrow(AlreadyProvidedError);
    });

    it('provides meaningful error messages', () => {
      const injector = new Injector();
      const namedToken = new Token<string>('my-named-token');

      injector.register({provide: namedToken, useValue: 'first'});

      expect(() => injector.register({provide: namedToken, useValue: 'second'})).toThrow(
        /my-named-token/
      );
    });

    /* eslint-disable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-argument */
    it('throws UnknownProviderError for unsupported provider types', () => {
      const injector = new Injector();
      const token = new Token<string>('test');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const invalidProvider = {provide: token, useUnknown: 'invalid'} as any;

      expect(() => injector.register(invalidProvider)).toThrow(UnknownProviderError);
    });
  });
  /* eslint-enable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-argument */

  describe('inject', () => {
    it('injects value providers', () => {
      const injector = new Injector();
      const token = new Token<string>('test');

      injector.register({provide: token, useValue: 'test value'});

      expect(injector.inject(token)).toBe('test value');
    });

    it('injects class providers with singleton scope', () => {
      const injector = new Injector();
      const token = new Token<TestServiceA>('service');

      class TestServiceA {
        readonly id = Math.random();
      }

      injector.register({provide: token, useClass: TestServiceA, scope: 'singleton'});

      const instance1 = injector.inject(token);
      const instance2 = injector.inject(token);

      expect(instance1).toBeInstanceOf(TestServiceA);
      expect(instance1).toBe(instance2); // Same instance (cached)
    });

    it('injects class providers with transient scope', () => {
      const injector = new Injector();
      const token = new Token<TestServiceB>('service');

      class TestServiceB {
        readonly id = Math.random();
      }

      injector.register({provide: token, useClass: TestServiceB, scope: 'transient'});

      const instance1 = injector.inject(token);
      const instance2 = injector.inject(token);

      expect(instance1).toBeInstanceOf(TestServiceB);
      expect(instance2).toBeInstanceOf(TestServiceB);
      expect(instance1).not.toBe(instance2); // Different instances
    });

    it('injects factory providers with singleton scope', () => {
      const injector = new Injector();
      const token = new Token<string>('factory');
      let callCount = 0;

      injector.register({
        provide: token,
        useFactory: () => `factory-${++callCount}`,
        scope: 'singleton',
      });

      const result1 = injector.inject(token);
      const result2 = injector.inject(token);

      expect(result1).toBe('factory-1');
      expect(result2).toBe('factory-1'); // Same result (cached)
      expect(callCount).toBe(1); // Factory called only once
    });

    it('injects factory providers with transient scope', () => {
      const injector = new Injector();
      const token = new Token<string>('factory');
      let callCount = 0;

      injector.register({
        provide: token,
        useFactory: () => `factory-${++callCount}`,
        scope: 'transient',
      });

      const result1 = injector.inject(token);
      const result2 = injector.inject(token);

      expect(result1).toBe('factory-1');
      expect(result2).toBe('factory-2'); // Different results
      expect(callCount).toBe(2); // Factory called twice
    });

    it('injects existing providers (aliases)', () => {
      const injector = new Injector();
      const originalToken = new Token<string>('original');
      const aliasToken = new Token<string>('alias');

      injector.register({provide: originalToken, useValue: 'original value'});
      injector.register({provide: aliasToken, useExisting: originalToken});

      expect(injector.inject(aliasToken)).toBe('original value');
    });

    it('injects constructor providers (shorthand)', () => {
      const injector = new Injector();

      class TestServiceC {
        readonly marker = 'constructor-provider';
      }

      injector.register(TestServiceC);

      const instance1 = injector.inject(TestServiceC);
      const instance2 = injector.inject(TestServiceC);

      expect(instance1).toBeInstanceOf(TestServiceC);
      expect(instance1.marker).toBe('constructor-provider');
      expect(instance1).toBe(instance2); // Constructor providers are singleton by default
    });

    it('passes inject function to constructors', () => {
      const injector = new Injector();
      const depToken = new Token<string>('dependency');

      class ServiceWithDependency {
        constructor(private inject: InjectFn) {}

        getDependency() {
          return this.inject(depToken);
        }
      }

      injector.register({provide: depToken, useValue: 'injected value'});
      injector.register(ServiceWithDependency);

      const service = injector.inject(ServiceWithDependency);
      expect(service.getDependency()).toBe('injected value');
    });

    it('passes inject function to factory functions', () => {
      const injector = new Injector();
      const depToken = new Token<string>('dependency');
      const factoryToken = new Token<string>('factory');

      injector.register({provide: depToken, useValue: 'injected value'});
      injector.register({
        provide: factoryToken,
        useFactory: (inject) => `factory: ${inject(depToken)}`,
        scope: 'singleton',
      });

      expect(injector.inject(factoryToken)).toBe('factory: injected value');
    });

    it('returns default value when provider not found', () => {
      const injector = new Injector();
      const token = new Token<string>('missing');

      expect(injector.inject(token, 'default')).toBe('default');
    });

    it('supports null default values', () => {
      const injector = new Injector();
      const token = new Token<string>('missing');
      class TestService {
        readonly marker = 'test';
      }
      const testServiceToken = new Token<TestService>('test-service');

      expect(injector.inject(token, null)).toBe(null);
      expect(injector.inject(TestService, null)).toBe(null);
      expect(injector.inject(testServiceToken, null)).toBe(null);
    });

    it('throws NotProvidedError when provider not found and no default', () => {
      const injector = new Injector();
      const token = new Token<string>('missing');

      expect(() => injector.inject(token)).toThrow(NotProvidedError);
    });
  });

  describe('injected function behavior', () => {
    it('passed inject function can resolve dependencies correctly', () => {
      const injector = new Injector();
      const depToken = new Token<string>('dependency');
      const serviceToken = new Token<TestService>('service');

      class TestService {
        public resolvedValue: string;

        constructor(inject: InjectFn) {
          this.resolvedValue = inject(depToken);
        }
      }

      injector.register({provide: depToken, useValue: 'injected dependency'});
      injector.register({provide: serviceToken, useClass: TestService, scope: 'singleton'});

      const service = injector.inject(serviceToken);
      expect(service.resolvedValue).toBe('injected dependency');
    });

    it('passed inject function in factory can resolve dependencies correctly', () => {
      const injector = new Injector();
      const depToken = new Token<string>('dependency');
      const factoryToken = new Token<{dep: string}>('factory');

      injector.register({provide: depToken, useValue: 'factory dependency'});
      injector.register({
        provide: factoryToken,
        useFactory: (inject: InjectFn) => ({
          dep: inject(depToken),
        }),
        scope: 'singleton',
      });

      const result = injector.inject(factoryToken);
      expect(result.dep).toBe('factory dependency');
    });

    it('inject function in nested dependencies works correctly', () => {
      const injector = new Injector();
      const baseToken = new Token<string>('base');
      const serviceAToken = new Token<ServiceA>('serviceA');
      const serviceBToken = new Token<ServiceB>('serviceB');

      class ServiceA {
        public baseValue: string;

        constructor(inject: InjectFn) {
          this.baseValue = inject(baseToken);
        }
      }

      class ServiceB {
        public serviceA: ServiceA;

        constructor(inject: InjectFn) {
          this.serviceA = inject(serviceAToken);
        }
      }

      injector.register({provide: baseToken, useValue: 'base value'});
      injector.register({provide: serviceAToken, useClass: ServiceA, scope: 'singleton'});
      injector.register({provide: serviceBToken, useClass: ServiceB, scope: 'singleton'});

      const serviceB = injector.inject(serviceBToken);
      expect(serviceB.serviceA.baseValue).toBe('base value');
    });

    it('inject function supports default values when used in constructors', () => {
      const injector = new Injector();
      const depToken = new Token<string>('optional-dependency');
      const serviceToken = new Token<TestServiceWithDefault>('service');

      class TestServiceWithDefault {
        public value: string;

        constructor(inject: InjectFn) {
          this.value = inject(depToken, 'default value');
        }
      }

      injector.register({
        provide: serviceToken,
        useClass: TestServiceWithDefault,
        scope: 'singleton',
      });

      const service = injector.inject(serviceToken);
      expect(service.value).toBe('default value');
    });

    it('inject function works with existing providers (aliases)', () => {
      const injector = new Injector();
      const originalToken = new Token<string>('original');
      const aliasToken = new Token<string>('alias');
      const serviceToken = new Token<TestServiceUsingAlias>('service');

      class TestServiceUsingAlias {
        public aliasValue: string;

        constructor(inject: InjectFn) {
          this.aliasValue = inject(aliasToken);
        }
      }

      injector.register({provide: originalToken, useValue: 'original value'});
      injector.register({provide: aliasToken, useExisting: originalToken});
      injector.register({
        provide: serviceToken,
        useClass: TestServiceUsingAlias,
        scope: 'singleton',
      });

      const service = injector.inject(serviceToken);
      expect(service.aliasValue).toBe('original value');
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
      const sourceInjector = new Injector(true);
      const newInjector = Injector.from(sourceInjector);

      expect(newInjector.defaultAllowOverrides).toBe(true);
    });

    it('creates new injector with defaultAllowOverrides=false copied', () => {
      const sourceInjector = new Injector(false);
      const newInjector = Injector.from(sourceInjector);

      expect(newInjector.defaultAllowOverrides).toBe(false);
    });

    it('creates new injector without copying cache by default', () => {
      const sourceInjector = new Injector();
      const token = new Token<string>('test');
      let callCount = 0;

      sourceInjector.register({
        provide: token,
        useFactory: () => `factory-${++callCount}`,
        scope: 'singleton',
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
        scope: 'singleton',
      });

      // Trigger caching in source injector
      const firstResult = sourceInjector.inject(token);
      expect(firstResult).toBe('factory-1');

      const newInjector = Injector.from(sourceInjector, true);

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
        scope: 'singleton',
      });

      // Trigger caching in source injector
      const firstResult = sourceInjector.inject(token);
      expect(firstResult).toBe('factory-1');

      const newInjector = Injector.from(sourceInjector, false);

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
          scope: 'singleton',
        },
        {provide: classToken, useClass: TestService, scope: 'transient'},
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
