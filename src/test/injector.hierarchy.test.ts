/** Tests for hierarchical injector functionality */

import {describe, expect, it} from 'vitest';

import {NotProvidedError} from '../errors.js';
import {Injector} from '../injector.js';
import {Token} from '../types.js';

const TOKEN = new Token<string>('test');

describe('Injector hierarchy', () => {
  describe('fork method', () => {
    it('creates child injector', () => {
      const parent = new Injector();
      const child1 = parent.fork();
      const child2 = parent.fork();

      // Test that child is a separate instance
      expect(child1).not.toBe(parent);
      expect(child2).not.toBe(parent);
      expect(child1).not.toBe(child2);
    });

    it('preserves defaultAllowOverrides setting when true', () => {
      const parentWithOverrides = new Injector({defaultAllowOverrides: true});
      const childWithOverrides = parentWithOverrides.fork();
      const token = new Token<string>('override-hierarchy-true');
      childWithOverrides.register({provide: token, useValue: 'first'});

      expect(() => {
        childWithOverrides.register({provide: token, useValue: 'second'});
      }).not.toThrow();
      expect(childWithOverrides.inject(token)).toBe('second');
    });

    it('preserves defaultAllowOverrides setting when false', () => {
      const parentWithoutOverrides = new Injector({defaultAllowOverrides: false});
      const childWithoutOverrides = parentWithoutOverrides.fork();
      const token2 = new Token<string>('override-hierarchy-false');
      childWithoutOverrides.register({provide: token2, useValue: 'first'});

      expect(() => {
        childWithoutOverrides.register({provide: token2, useValue: 'second'});
      }).toThrow();
      expect(childWithoutOverrides.inject(token2)).toBe('first');
    });
  });

  describe('hierarchical injection', () => {
    it('child can inject from parent when provider not found locally', () => {
      const parent = new Injector();
      const child = parent.fork();
      parent.register({provide: TOKEN, useValue: 'parent-value'});

      expect(child.inject(TOKEN)).toBe('parent-value');
    });

    it('child provider overrides parent provider', () => {
      const parent = new Injector();
      const child = parent.fork();
      parent.register({provide: TOKEN, useValue: 'parent-value'});
      child.register({provide: TOKEN, useValue: 'child-value'});

      expect(parent.inject(TOKEN)).toBe('parent-value');
      expect(child.inject(TOKEN)).toBe('child-value');
    });

    it('throws NotProvidedError when neither parent nor child has provider', () => {
      const parent = new Injector();
      const child = parent.fork();

      expect(() => child.inject(TOKEN)).toThrow(NotProvidedError);
    });

    it('uses defaultValue when neither parent nor child has provider', () => {
      const parent = new Injector();
      const child = parent.fork();

      expect(child.inject(TOKEN, 'default')).toBe('default');
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

      grandparent.register({provide: TOKEN, useValue: 'grandparent-value'});
      parent.register({provide: TOKEN, useValue: 'parent-value'});
      child.register({provide: TOKEN, useValue: 'child-value'});
      expect(grandparent.inject(TOKEN)).toBe('grandparent-value');
      expect(parent.inject(TOKEN)).toBe('parent-value');
      expect(child.inject(TOKEN)).toBe('child-value');
    });
  });

  describe('cache behavior', () => {
    it('child uses parent cache when provider is in parent', () => {
      const parent = new Injector();
      const child = parent.fork();

      class TestService {
        public readonly __brand = 'TestService';
        constructor() {}
      }

      const token = new Token<TestService>();
      parent.register({provide: token, useClass: TestService});

      const parentInstance = parent.inject(token);
      const childInstance = child.inject(token);

      // Should be same instance since child delegates to parent's inject()
      expect(parentInstance).toBe(childInstance);
      expect(parentInstance).toBeInstanceOf(TestService);
    });

    it('separate caches for overridden providers', () => {
      const parent = new Injector();
      const child = parent.fork();

      class TestService {
        static instanceCount = 0;
        public readonly __brand = 'TestService';
        constructor() {
          TestService.instanceCount++;
        }
      }

      // Both register the same provider
      parent.register(TestService);
      child.register(TestService);

      // Reset counter
      TestService.instanceCount = 0;

      const parentInstance = parent.inject(TestService);
      expect(TestService.instanceCount).toBe(1);

      const childInstance = child.inject(TestService);
      expect(TestService.instanceCount).toBe(2);

      // Different instances since child has its own provider
      expect(parentInstance).not.toBe(childInstance);

      // But subsequent calls return cached instances
      expect(parent.inject(TestService)).toBe(parentInstance);
      expect(child.inject(TestService)).toBe(childInstance);
    });
  });

  describe('constructor with explicit parent', () => {
    it('accepts parent injector in constructor', () => {
      const parent = new Injector();
      parent.register({provide: TOKEN, useValue: 'parent-value'});
      const child = new Injector({defaultAllowOverrides: false, parent});

      expect(child.inject(TOKEN)).toBe('parent-value');
    });

    it('works with null parent', () => {
      const injector = new Injector({defaultAllowOverrides: false, parent: null});

      expect(() => injector.inject(TOKEN)).toThrow(NotProvidedError);
    });
  });

  describe('from() method with hierarchy', () => {
    it('preserves parent relationship by default', () => {
      const parent = new Injector();
      const child = parent.fork();

      parent.register({provide: TOKEN, useValue: 'parent-value'});
      const childToken = new Token<string>('child-token');
      child.register({provide: childToken, useValue: 'child-value'});

      const copiedChild = Injector.from(child);

      // Should still access parent through preserved parent chain
      expect(copiedChild.inject(TOKEN)).toBe('parent-value');
      expect(copiedChild.inject(childToken)).toBe('child-value');
    });

    it('can exclude parent relationship when copyParent=false', () => {
      const parent = new Injector();
      const child = parent.fork();

      parent.register({provide: TOKEN, useValue: 'parent-value'});

      const copiedChild = Injector.from(child, {noParent: true});

      // Should not access parent since copyParent=false
      expect(() => copiedChild.inject(TOKEN)).toThrow(NotProvidedError);
    });

    it('copies providers and preserves parent with copyCache=true', () => {
      const parent = new Injector();
      const child = parent.fork();

      parent.register({provide: TOKEN, useValue: 'parent-value'});

      class ChildService {
        public readonly __brand = 'ChildService';
      }
      child.register(ChildService);

      // Warm up the cache
      const originalInstance = child.inject(ChildService);

      const copiedChild = Injector.from(child, {copyCache: true});

      // Should get the cached instance
      expect(copiedChild.inject(ChildService)).toBe(originalInstance);
      // Should still access parent
      expect(copiedChild.inject(TOKEN)).toBe('parent-value');
    });
  });
});
