import {describe, expect, it} from 'vitest';

import {NotProvidedError} from '../errors.js';
import {Injector} from '../injector.js';
import {Token} from '../token.js';

describe('Injector.inject()', () => {
  describe('providers support', () => {
    it('value provider', () => {
      const injector = new Injector();
      const token = new Token<string>('test');

      injector.register({provide: token, useValue: 'test value'});

      expect(injector.inject(token)).toBe('test value');
    });

    it('existing provider (alias)', () => {
      const injector = new Injector();
      const originalToken = new Token<string>('original');
      const aliasToken = new Token<string>('alias');

      injector.register({provide: originalToken, useValue: 'original value'});
      injector.register({provide: aliasToken, useExisting: originalToken});

      expect(injector.inject(aliasToken)).toBe('original value');
    });

    it('shorthand provider (constructor)', () => {
      const injector = new Injector();
      class TestService {
        readonly marker = 'constructor-provider';
      }
      injector.register(TestService);

      const instance = injector.inject(TestService);

      expect(instance).toBeInstanceOf(TestService);
      expect(instance.marker).toBe('constructor-provider');
    });

    it('class provider', () => {
      const injector = new Injector();
      class TestService {
        readonly marker = 'class-provider';
      }
      const token = new Token<TestService>('service');
      injector.register({provide: token, useClass: TestService});

      const instance = injector.inject(token);

      expect(instance).toBeInstanceOf(TestService);
      expect(instance.marker).toBe('class-provider');
    });

    it('factory provider', () => {
      const injector = new Injector();
      const token = new Token<number>('factory');
      injector.register({provide: token, useFactory: () => 42});

      const result = injector.inject(token);

      expect(result).toBe(42);
    });
  });

  describe('caching', () => {
    describe('shorthand provider', () => {
      it('is always cached', () => {
        const injector = new Injector();
        class TestService {
          readonly id = Math.random();
        }

        injector.register(TestService);

        const instance1 = injector.inject(TestService);
        const instance2 = injector.inject(TestService);
        const instance3 = injector.inject(TestService);

        expect(instance1).toBeInstanceOf(TestService);
        expect(instance1).toBe(instance2);
        expect(instance3).toBe(instance1);
      });
    });

    describe('class provider', () => {
      it('caches by default', () => {
        const injector = new Injector();

        class TestService {
          readonly id = Math.random();
        }
        const token = new Token<TestService>('service');
        injector.register({provide: token, useClass: TestService});

        const instance1 = injector.inject(token);
        const instance2 = injector.inject(token);
        const instance3 = injector.inject(token);

        expect(instance1).toBeInstanceOf(TestService);
        expect(instance1).toBe(instance2);
        expect(instance3).toBe(instance1);
      });

      it('creates new instance if noCache is true', () => {
        const injector = new Injector();
        class TestService {
          readonly id = Math.random();
        }
        const token = new Token<TestService>('service');

        injector.register({provide: token, useClass: TestService, noCache: true});

        const instance1 = injector.inject(token);
        const instance2 = injector.inject(token);
        const instance3 = injector.inject(token);

        expect(instance1).toBeInstanceOf(TestService);
        expect(instance2).toBeInstanceOf(TestService);
        expect(instance3).toBeInstanceOf(TestService);
        expect(instance1).not.toBe(instance2);
        expect(instance1).not.toBe(instance3);
        expect(instance2).not.toBe(instance3);
      });
    });

    describe('factory provider', () => {
      it('caches by default', () => {
        const injector = new Injector();
        const token = new Token<string>('factory');
        let callCount = 0;

        injector.register({
          provide: token,
          useFactory: () => `factory-${++callCount}`,
        });

        const result1 = injector.inject(token);
        const result2 = injector.inject(token);
        const result3 = injector.inject(token);

        expect(result1).toBe('factory-1');
        expect(result2).toBe('factory-1');
        expect(result3).toBe('factory-1');
        expect(callCount).toBe(1);
      });

      it('resolves every time if noCache is true', () => {
        const injector = new Injector();
        const token = new Token<string>('factory');
        let callCount = 0;

        injector.register({
          provide: token,
          useFactory: () => `factory-${++callCount}`,
          noCache: true,
        });

        const result1 = injector.inject(token);
        const result2 = injector.inject(token);
        const result3 = injector.inject(token);

        expect(result1).toBe('factory-1');
        expect(result2).toBe('factory-2');
        expect(result3).toBe('factory-3');
        expect(callCount).toBe(3);
      });
    });

    describe('value provider', () => {
      it('is never cached', () => {
        const injector = new Injector();
        const token = new Token<string>('value');
        let callCount = 0;
        // use getter for `useValue` to verify multiple access
        injector.register({
          provide: token,
          get useValue() {
            callCount++;
            return `value-${callCount}`;
          },
        });

        const result1 = injector.inject(token);
        const result2 = injector.inject(token);
        const result3 = injector.inject(token);

        expect(result1).toBe('value-1');
        expect(result2).toBe('value-2');
        expect(result3).toBe('value-3');
      });
    });
  });

  describe('default value', () => {
    it('returns default value when provider not found', () => {
      const injector = new Injector();
      const token = new Token<string>('missing');

      expect(injector.inject(token, 'default')).toBe('default');
    });

    it('supports null default values for all provider types', () => {
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
  });

  describe('overrides', () => {
    it('returns default value when provider not found', () => {
      const injector = new Injector();
      const token = new Token<string>('missing');

      expect(injector.inject(token, 'default')).toBe('default');
    });

    it('returns overriden provider value', () => {
      const injector = new Injector();
      const token = new Token<string>('test');

      injector.register({provide: token, useValue: 'original'});

      expect(injector.inject(token)).toBe('original');

      injector.register({provide: token, useValue: 'override'}, /* allowOverrides=true */ true);

      expect(injector.inject(token)).toBe('override');
    });

    it('returns overriden provider value for cached providers', () => {
      const injector = new Injector();
      const token = new Token<number>('test');

      injector.register({provide: token, useFactory: () => 31});
      expect(injector.inject(token)).toBe(31);

      injector.register({provide: token, useFactory: () => 42}, /* allowOverrides=true */ true);
      expect(injector.inject(token)).toBe(42);
    });
  });

  describe('error', () => {
    it('throws NotProvidedError when provider not found and no default', () => {
      const injector = new Injector();
      const token = new Token<string>('missing');

      expect(() => injector.inject(token)).toThrow(NotProvidedError);
    });
  });
});
