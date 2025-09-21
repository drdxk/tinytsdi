import {
  AlreadyProvidedError,
  Injector,
  NotProvidedError,
  Token,
  UnknownProviderError,
} from 'tinytsdi';
import {describe, expect, it} from 'vitest';

describe('Injector', () => {
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

      // Subsequent calls return the same instance (cached)
      expect(injector.inject(TestService)).toBe(instance);
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

      // Subsequent calls return the same instance (cached)
      expect(injector.inject(token)).toBe(instance);

      // Overrides return new instance
      injector.register(
        {provide: token, useClass: TestService, noCache: true},
        /* allowOverrides=true */ true
      );
      const newInstance = injector.inject(token);
      expect(newInstance).not.toBe(instance);
      expect(newInstance).toBeInstanceOf(TestService);
      expect(newInstance.marker).toBe('class-provider');

      // noCache returns new instance on each call
      const anotherInstance = injector.inject(token);
      expect(anotherInstance).not.toBe(newInstance);
      expect(anotherInstance).toBeInstanceOf(TestService);
      expect(anotherInstance.marker).toBe('class-provider');
    });

    it('factory provider', () => {
      const injector = new Injector();
      const token = new Token<number>('factory');
      let callCount = 42;

      injector.register({provide: token, useFactory: () => callCount++});

      const result = injector.inject(token);

      expect(result).toBe(42);

      // Subsequent calls return the cached value
      expect(injector.inject(token)).toBe(result);

      // Overrides return new instance
      injector.register(
        {provide: token, useFactory: () => callCount++, noCache: true},
        /* allowOverrides=true */ true
      );
      expect(injector.inject(token)).toBe(43);

      // noCache returns new instance on each call;
      expect(injector.inject(token)).toBe(44);
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

  describe('errors', () => {
    it('throws NotProvidedError when provider not found and no default', () => {
      const injector = new Injector();
      const token = new Token<string>('missing');

      expect(() => injector.inject(token)).toThrow(NotProvidedError);
    });

    it('throws AlreadyProvidedError when registering existing provider without override', () => {
      const injector = new Injector();
      const token = new Token<string>('test');

      injector.register({provide: token, useValue: 'original'});

      expect(() => {
        injector.register({provide: token, useValue: 'override'});
      }).toThrow(AlreadyProvidedError);
    });

    it('throws UnknownProviderError for invalid provider', () => {
      const injector = new Injector();
      const token = new Token<string>('test');

      expect(() => {
        // @ts-expect-error: testing invalid provider
        injector.register({provide: token, useSomething: 'invalid'});
      }).toThrow(UnknownProviderError);
    });
  });

  describe('hierarchical injection', () => {
    it('child can inject from parent when provider not found locally', () => {
      const parent = new Injector();
      const child = parent.fork();
      const token = new Token<string>('test-hierarchy');
      parent.register({provide: token, useValue: 'parent-value'});

      expect(child.inject(token)).toBe('parent-value');
    });

    it('child provider overrides parent provider', () => {
      const parent = new Injector();
      const child = parent.fork();
      const token = new Token<string>('test-hierarchy');
      parent.register({provide: token, useValue: 'parent-value'});
      child.register({provide: token, useValue: 'child-value'});

      expect(parent.inject(token)).toBe('parent-value');
      expect(child.inject(token)).toBe('child-value');
    });

    it('throws NotProvidedError when neither parent nor child has provider', () => {
      const parent = new Injector();
      const child = parent.fork();
      const token = new Token<string>('test-hierarchy');

      expect(() => child.inject(token)).toThrow(NotProvidedError);
    });

    it('uses defaultValue when neither parent nor child has provider', () => {
      const parent = new Injector();
      const child = parent.fork();
      const token = new Token<string>('test-hierarchy');

      expect(child.inject(token, 'default')).toBe('default');
    });
  });

  describe('multi-level hierarchy', () => {
    it('supports grandparent -> parent -> child hierarchy', () => {
      const grandparent = new Injector();
      const parent = grandparent.fork();
      const child = parent.fork();

      const token1 = new Token<string>('token1');
      const token2 = new Token<string>('token2');
      const token3 = new Token<string>('token3');

      grandparent.register({provide: token1, useValue: 'grandparent-value'});
      parent.register({provide: token2, useValue: 'parent-value'});
      child.register({provide: token3, useValue: 'child-value'});

      // Child can access all levels
      expect(child.inject(token1)).toBe('grandparent-value');
      expect(child.inject(token2)).toBe('parent-value');
      expect(child.inject(token3)).toBe('child-value');

      // Parent can access grandparent but not child
      expect(parent.inject(token1)).toBe('grandparent-value');
      expect(parent.inject(token2)).toBe('parent-value');
      expect(() => void parent.inject(token3)).toThrow(NotProvidedError);
    });

    it('child overrides parent which overrides grandparent', () => {
      const grandparent = new Injector();
      const parent = grandparent.fork();
      const child = parent.fork();

      const token = new Token<string>('test-hierarchy');
      grandparent.register({provide: token, useValue: 'grandparent-value'});
      parent.register({provide: token, useValue: 'parent-value'});
      child.register({provide: token, useValue: 'child-value'});
      expect(grandparent.inject(token)).toBe('grandparent-value');
      expect(parent.inject(token)).toBe('parent-value');
      expect(child.inject(token)).toBe('child-value');
    });
  });
});
