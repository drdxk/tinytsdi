/** Tests for Injector creation flows. */

import {describe, expect, it} from 'vitest';

import {NotProvidedError} from '../errors.js';
import {Injector} from '../injector.js';
import {InjectFn, TAG_ROOT, TAG_SINK, Token} from '../types.js';

// TODO: split this into multiple files.

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

    it('assigns TAG_ROOT when no parent and no tag specified', () => {
      const injector = new Injector();
      expect(injector.getTag()).toBe(TAG_ROOT);
    });

    it('assigns null tag when has parent and no tag specified', () => {
      const parent = new Injector();
      const child = new Injector({parent});
      expect(child.getTag()).toBe(null);
    });

    it('assigns explicit string tag when specified', () => {
      const injector = new Injector({tag: 'test'});
      expect(injector.getTag()).toBe(Symbol.for('test'));
    });

    it('assigns explicit symbol tag when specified', () => {
      const customSymbol = Symbol('custom');
      const injector = new Injector({tag: customSymbol});
      expect(injector.getTag()).toBe(customSymbol);
    });

    it('assigns TAG_ROOT when explicitly specified as a string', () => {
      const injector = new Injector({tag: 'root'});
      expect(injector.getTag()).toBe(TAG_ROOT);
    });

    it('assigns TAG_SINK when explicitly specified as a string', () => {
      const injector = new Injector({tag: 'sink'});
      expect(injector.getTag()).toBe(TAG_SINK);
    });

    it('overrides default tag assignment with explicit tag', () => {
      const parent = new Injector();
      const child = new Injector({parent, tag: 'override'});
      expect(child.getTag()).toBe(Symbol.for('override'));
    });

    it('assigns null tag when explicitly specified', () => {
      const injector = new Injector({tag: null});
      expect(injector.getTag()).toBe(null);
    });

    it('overrides default TAG_ROOT with explicit null tag', () => {
      const injector = new Injector({tag: null});
      expect(injector.getTag()).toBe(null);
    });

    it('root injector does not have a parent', () => {
      const injector = new Injector();
      expect(injector.getParent()).toBe(null);
    });

    it('child injector has a parent', () => {
      const parent = new Injector();
      const child = new Injector({parent});
      expect(child.getParent()).toBe(parent);
    });
  });

  describe('copy()', () => {
    it('creates new injector with copied providers', () => {
      const sourceInjector = new Injector();
      const token = new Token<string>('test');

      sourceInjector.register({provide: token, useValue: 'test value'});

      const newInjector = sourceInjector.copy();

      expect(newInjector.inject(token)).toBe('test value');
    });

    it('creates new injector with defaultAllowOverrides setting copied', () => {
      const sourceInjector = new Injector({defaultAllowOverrides: true});
      const newInjector = sourceInjector.copy();

      const token = new Token<string>('override-test-copied-true');
      newInjector.register({provide: token, useValue: 'first'});

      expect(() => {
        newInjector.register({provide: token, useValue: 'second'});
      }).not.toThrow();
      expect(newInjector.inject(token)).toBe('second');
    });

    it('creates new injector with defaultAllowOverrides=false copied', () => {
      const sourceInjector = new Injector({defaultAllowOverrides: false});
      const newInjector = sourceInjector.copy();

      const token = new Token<string>('override-test-copied-false');
      newInjector.register({provide: token, useValue: 'first'});

      expect(() => {
        newInjector.register({provide: token, useValue: 'second'});
      }).toThrow();
      expect(newInjector.inject(token)).toBe('first');
    });

    it('creates new injector with defaultAllowOverrides explicitly overridden', () => {
      const sourceInjector = new Injector({defaultAllowOverrides: false});
      const newInjector = sourceInjector.copy({defaultAllowOverrides: true});

      const token = new Token<string>('override-test-explicit-true');
      newInjector.register({provide: token, useValue: 'first'});

      expect(() => {
        newInjector.register({provide: token, useValue: 'second'});
      }).not.toThrow();
      expect(newInjector.inject(token)).toBe('second');
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

      const newInjector = sourceInjector.copy();

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

      const newInjector = sourceInjector.copy({copyCache: true});

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

      const newInjector = sourceInjector.copy({copyCache: false});

      // New injector should not have cache, so factory should be called again
      const secondResult = newInjector.inject(token);
      expect(secondResult).toBe('factory-2');
      expect(callCount).toBe(2);
    });

    it('creates new injector with parent preserved by default', () => {
      const parentInjector = new Injector();
      const token = new Token<string>('test');
      parentInjector.register({provide: token, useValue: 'parent value'});
      const childInjector = new Injector({parent: parentInjector});

      const newInjector = childInjector.copy();

      expect(newInjector.inject(token)).toBe('parent value');
    });

    it('creates new injector with parent explicitly set to null', () => {
      const parentInjector = new Injector();
      const token = new Token<string>('test');
      parentInjector.register({provide: token, useValue: 'parent value'});
      const childInjector = new Injector({parent: parentInjector});

      const newInjector = childInjector.copy({parent: null});

      expect(() => newInjector.inject(token)).toThrow(NotProvidedError);
    });

    it('creates new injector with different parent explicitly set', () => {
      const originalParent = new Injector();
      const newParent = new Injector();
      const token = new Token<string>('test');
      originalParent.register({provide: token, useValue: 'original parent'});
      newParent.register({provide: token, useValue: 'new parent'});

      const childInjector = new Injector({parent: originalParent});

      const newInjector = childInjector.copy({parent: newParent});

      expect(childInjector.inject(token)).toBe('original parent');
      expect(newInjector.inject(token)).toBe('new parent');
    });

    it('creates new injector with tag preserved by default', () => {
      const sourceInjector = new Injector({tag: 'custom'});
      const newInjector = sourceInjector.copy();

      expect(newInjector.getTag()).toBe(Symbol.for('custom'));
    });

    it('creates new injector with explicit string tag', () => {
      const sourceInjector = new Injector({tag: 'original'});
      const newInjector = sourceInjector.copy({tag: 'new'});

      expect(sourceInjector.getTag()).toBe(Symbol.for('original'));
      expect(newInjector.getTag()).toBe(Symbol.for('new'));
    });

    it('creates new injector with explicit symbol tag', () => {
      const originalTag = Symbol('original');
      const newTag = Symbol('new');
      const sourceInjector = new Injector({tag: originalTag});
      const newInjector = sourceInjector.copy({tag: newTag});

      expect(sourceInjector.getTag()).toBe(originalTag);
      expect(newInjector.getTag()).toBe(newTag);
    });

    it('creates new injector with explicit null tag', () => {
      const sourceInjector = new Injector({tag: 'original'});
      const newInjector = sourceInjector.copy({tag: null});

      expect(sourceInjector.getTag()).toBe(Symbol.for('original'));
      expect(newInjector.getTag()).toBe(null);
    });

    it('creates new injector with tag combined with other options', () => {
      const parentInjector = new Injector();
      const sourceInjector = new Injector({
        parent: parentInjector,
        tag: 'original',
        defaultAllowOverrides: false,
      });

      const newInjector = sourceInjector.copy({
        tag: 'new',
        copyCache: true,
        parent: null,
        defaultAllowOverrides: true,
      });

      expect(newInjector.getTag()).toBe(Symbol.for('new'));
      expect(newInjector.getParent()).toBe(null);
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

      const newInjector = sourceInjector.copy();

      expect(newInjector.inject(token1)).toBe('value1');
      expect(newInjector.inject(token2)).toBe(42);
      expect(newInjector.inject(TestService)).toBeInstanceOf(TestService);
    });

    it('creates independent injector that does not affect source', () => {
      const sourceInjector = new Injector();
      const token = new Token<string>('test');

      sourceInjector.register({provide: token, useValue: 'original'});

      const newInjector = sourceInjector.copy();

      // Register different provider in new injector
      newInjector.register({provide: token, useValue: 'modified'}, true);

      // Source injector should be unaffected
      expect(sourceInjector.inject(token)).toBe('original');
      expect(newInjector.inject(token)).toBe('modified');
    });

    it('create independent injector not affected by the source', () => {
      const sourceInjector = new Injector();
      const newInjector = sourceInjector.copy();

      const token = new Token<string>('test');
      sourceInjector.register({provide: token, useValue: 'value'});

      expect(sourceInjector.inject(token)).toBe('value');
      // Registration happened after the copy, so new injector should not see it
      expect(() => newInjector.inject(new Token())).toThrow(NotProvidedError);
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

      const newInjector = sourceInjector.copy();

      expect(newInjector.inject(valueToken)).toBe('test value');
      expect(newInjector.inject(factoryToken)).toBe('factory: test value');
      expect(newInjector.inject(classToken).getValue()).toBe('test value');
      expect(newInjector.inject(aliasToken)).toBe('test value');
    });
  });
});
