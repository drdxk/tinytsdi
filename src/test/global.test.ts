import {beforeEach, describe, expect, it} from 'vitest';

import {AlreadyInitializedError, TestInjectorNotAllowedError} from '../errors.js';
import {
  deleteInjector,
  getInjector,
  init,
  inject,
  newTestInjector,
  register,
  removeTestInjector,
  resetInitForTestOnly,
  setTestInjector,
} from '../global.js';
import {Injector} from '../injector.js';
import {Token} from '../types.js';

describe('Global API', () => {
  beforeEach(() => {
    deleteInjector();
    resetInitForTestOnly();
    try {
      removeTestInjector();
    } catch {
      // Ignore errors if no test injector or disabled
    }
  });

  describe('injector instance', () => {
    it('returns the same injector instance on multiple calls', () => {
      const injector1 = getInjector();
      const injector2 = getInjector();
      expect(injector1).toBe(injector2);
    });

    it('removes the current injector instance', () => {
      const injector1 = getInjector();
      deleteInjector();
      const injector2 = getInjector();
      expect(injector1).not.toBe(injector2);
    });
  });

  describe('core functionality', () => {
    it('registers single provider', () => {
      const token = new Token<string>('test-token');

      register({provide: token, useValue: 'test-value'});

      const value = inject(token);
      expect(value).toBe('test-value');
    });

    it('registers array of providers', () => {
      const token1 = new Token<string>('token1');
      const token2 = new Token<number>('token2');

      register([
        {provide: token1, useValue: 'value1'},
        {provide: token2, useValue: 42},
      ]);

      expect(inject(token1)).toBe('value1');
      expect(inject(token2)).toBe(42);
    });

    it('registers constructor provider (shorthand)', () => {
      class TestService {
        readonly id = 'test-service';
      }

      register(TestService);

      const instance = inject(TestService);
      expect(instance).toBeInstanceOf(TestService);
      expect(instance.id).toBe('test-service');
    });

    it('passes allowOverrides parameter for single provider', () => {
      const token = new Token<string>('test-token');

      register({provide: token, useValue: 'first-value'});

      expect(() => {
        register({provide: token, useValue: 'second-value'}, false);
      }).toThrow();

      register({provide: token, useValue: 'second-value'}, true);

      const value = inject(token);
      expect(value).toBe('second-value');
    });

    it('passes allowOverrides parameter for array of providers', () => {
      const token = new Token<string>('test-token');

      register({provide: token, useValue: 'first-value'});

      expect(() => {
        register([{provide: token, useValue: 'second-value'}], false);
      }).toThrow();

      register([{provide: token, useValue: 'second-value'}], true);

      const value = inject(token);
      expect(value).toBe('second-value');
    });

    it('uses default value when dependency is not provided', () => {
      const token = new Token<string>('missing-token');

      const value = inject(token, 'default-value');
      expect(value).toBe('default-value');
    });

    it('throws when dependency is not provided and no default', () => {
      const token = new Token<string>('missing-token');

      expect(() => inject(token)).toThrow();
    });
  });

  describe('init', () => {
    it('initializes TSDI with default config', () => {
      expect(() => init()).not.toThrow();
    });

    it('initializes TSDI with custom config', () => {
      expect(() => init({defaultAllowOverrides: true, noTestInjector: false})).not.toThrow();
    });

    it('throws AlreadyInitializedError on second call', () => {
      init();
      expect(() => init()).toThrow(AlreadyInitializedError);
    });

    it('affects global injector defaultAllowOverrides setting', () => {
      init({defaultAllowOverrides: true});
      const injector = getInjector();
      const token = new Token<string>('override-test');
      injector.register({provide: token, useValue: 'first'});

      expect(() => {
        injector.register({provide: token, useValue: 'second'});
      }).not.toThrow();
      expect(injector.inject(token)).toBe('second');
    });

    it('uses default false for defaultAllowOverrides when not specified', () => {
      init();
      const injector = getInjector();

      const token = new Token<string>('override-test-false');
      injector.register({provide: token, useValue: 'first'});
      // Should throw on override
      expect(() => {
        injector.register({provide: token, useValue: 'second'});
      }).toThrow();
      expect(injector.inject(token)).toBe('first');
    });

    it('disables test injector functions when noTestInjector is true', () => {
      init({noTestInjector: true});
      expect(() => newTestInjector()).toThrow(TestInjectorNotAllowedError);
      expect(() => setTestInjector(new Injector())).toThrow(TestInjectorNotAllowedError);
      expect(() => removeTestInjector()).toThrow(TestInjectorNotAllowedError);
    });
  });

  describe('test injector functionality', () => {
    describe('newTestInjector', () => {
      it('creates a new empty test injector', () => {
        const testInjector = newTestInjector();
        expect(testInjector).toBeInstanceOf(Injector);
      });

      it('does not allow overrides by default', () => {
        const testInjector = newTestInjector();
        const token = new Token<string>('override-test-false');
        testInjector.register({provide: token, useValue: 'first'});

        expect(() => {
          testInjector.register({provide: token, useValue: 'second'});
        }).toThrow();
        expect(testInjector.inject(token)).toBe('first');
      });

      it('allows overrides when defaultAllowOverrides is true', () => {
        const testInjector = newTestInjector({defaultAllowOverrides: true});
        const token = new Token<string>('override-test');
        testInjector.register({provide: token, useValue: 'first'});

        expect(() => {
          testInjector.register({provide: token, useValue: 'second'});
        }).not.toThrow();
        expect(testInjector.inject(token)).toBe('second');
      });

      it('creates test injector from current global injector', () => {
        const token = new Token<string>('test');
        register({provide: token, useValue: 'global'});

        const testInjector = newTestInjector({fromCurrent: true});
        expect(testInjector.inject(token)).toBe('global');
        expect(getInjector()).toBe(testInjector);
      });

      it('respects allowOverrides when creating from current', () => {
        const token = new Token<string>('test');
        register({provide: token, useValue: 'global'});

        const testInjector = newTestInjector({fromCurrent: {defaultAllowOverrides: true}});
        expect(getInjector()).toBe(testInjector);

        // Should allow override due to allowOverrides=true
        expect(() => testInjector.register({provide: token, useValue: 'overridden'})).not.toThrow();
        expect(testInjector.inject(token)).toBe('overridden');
      });

      it('creates from global injector even when test injector is set', () => {
        const globalToken = new Token<string>('global');
        const testToken = new Token<string>('test');

        // Register in global
        register({provide: globalToken, useValue: 'global'});

        // Set a test injector with different content
        const firstTestInjector = new Injector();
        firstTestInjector.register({provide: testToken, useValue: 'test'});
        setTestInjector(firstTestInjector);

        // Create new test injector from current - should copy from global, not test
        const secondTestInjector = newTestInjector({fromCurrent: true});
        expect(secondTestInjector.inject(globalToken)).toBe('global');
        expect(() => secondTestInjector.inject(testToken)).toThrow(); // Should not have test token
        expect(getInjector()).toBe(secondTestInjector);
      });
    });

    describe('setTestInjector', () => {
      it('sets a custom test injector', () => {
        const customInjector = new Injector();
        const token = new Token<string>('test');
        customInjector.register({provide: token, useValue: 'custom'});

        const result = setTestInjector(customInjector);
        expect(result).toBe(customInjector);
        expect(getInjector()).toBe(customInjector);
        expect(inject(token)).toBe('custom');
      });
    });

    describe('removeTestInjector', () => {
      it('removes test injector and restores global injector', () => {
        const token = new Token<string>('test');

        // Set up global injector
        register({provide: token, useValue: 'global'});
        const globalInjector = getInjector();

        // Set test injector
        const testInjector = new Injector();
        testInjector.register({provide: token, useValue: 'test'});
        setTestInjector(testInjector);

        expect(getInjector()).toBe(testInjector);
        expect(inject(token)).toBe('test');

        // Remove test injector
        removeTestInjector();

        expect(getInjector()).toBe(globalInjector);
        expect(inject(token)).toBe('global');
      });
    });

    describe('getInjector behavior with test injector', () => {
      it('returns test injector when set', () => {
        const testInjector = newTestInjector();
        expect(getInjector()).toBe(testInjector);
      });

      it('returns global injector when no test injector set', () => {
        const globalInjector = getInjector();
        expect(getInjector()).toBe(globalInjector);
      });

      it('global functions use test injector when set', () => {
        const token = new Token<string>('test');

        const testInjector = newTestInjector();
        testInjector.register({provide: token, useValue: 'test'});

        expect(inject(token)).toBe('test');

        // Register through global API should go to test injector
        const newToken = new Token<string>('new');
        register({provide: newToken, useValue: 'new'});
        expect(testInjector.inject(newToken)).toBe('new');
      });
    });
  });

  describe('integration scenarios', () => {
    it('complete test isolation workflow', () => {
      const token = new Token<string>('service');

      // Set up global injector
      register({provide: token, useValue: 'production'});
      expect(inject(token)).toBe('production');

      // Create test injector from current
      newTestInjector({fromCurrent: {defaultAllowOverrides: true}});

      expect(inject(token)).toBe('production'); // Copied from global

      // Override in test
      register({provide: token, useValue: 'test'});
      expect(inject(token)).toBe('test');

      // Remove test injector
      removeTestInjector();
      expect(inject(token)).toBe('production'); // Back to global
    });

    it('works without calling init', () => {
      const token = new Token<string>('test');

      // Should work with defaults
      register({provide: token, useValue: 'value'});
      expect(inject(token)).toBe('value');

      const testInjector = newTestInjector();
      expect(testInjector).toBeInstanceOf(Injector);
    });
  });
});
