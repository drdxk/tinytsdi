/** Tests for hierarchical injector functionality */

import {describe, expect, it} from 'vitest';

import {NoMatchingTagError, NotProvidedError} from '../errors.js';
import {Injector} from '../injector.js';
import {TAG_ROOT, TAG_SINK, Token} from '../types.js';

const TOKEN = new Token<string>('test');

describe('Injector hierarchy', () => {
  describe('fork()', () => {
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

  describe('copy() method with hierarchy', () => {
    it('preserves parent relationship by default', () => {
      const parent = new Injector();
      const child = parent.fork();

      parent.register({provide: TOKEN, useValue: 'parent-value'});
      const childToken = new Token<string>('child-token');
      child.register({provide: childToken, useValue: 'child-value'});

      const copiedChild = child.copy();

      // Should still access parent through preserved parent chain
      expect(copiedChild.inject(TOKEN)).toBe('parent-value');
      expect(copiedChild.inject(childToken)).toBe('child-value');
    });

    it('excludes parent relationship when parent=null', () => {
      const parent = new Injector();
      const child = parent.fork();

      parent.register({provide: TOKEN, useValue: 'parent-value'});

      const copiedChild = child.copy({parent: null});

      // Should not access parent since parent=null
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

      const copiedChild = child.copy({copyCache: true});

      // Should get the cached instance
      expect(copiedChild.inject(ChildService)).toBe(originalInstance);
      // Should still access parent
      expect(copiedChild.inject(TOKEN)).toBe('parent-value');
    });
  });

  describe('provider targeting', () => {
    it('works for parent injector target', () => {
      const parent = new Injector({tag: 'parent-tag'});
      const child = new Injector({parent});
      const token = new Token<string>('test');

      // Register on child but target parent
      child.register({provide: token, useValue: 'targeted-value', at: 'parent-tag'});

      // Provider should be registered on parent
      expect(parent.hasProviderFor(token)).toBe(true);
      expect(child.hasProviderFor(token)).toBe(false);
      expect(parent.inject(token)).toBe('targeted-value');
      expect(child.inject(token)).toBe('targeted-value');
    });

    it('works for grandparent injector target', () => {
      const grandparent = new Injector({tag: 'grandparent-tag'});
      const parent = new Injector({tag: 'parent-tag', parent: grandparent});
      const child = new Injector({parent});
      const token = new Token<string>('test');

      // Register on child but target grandparent
      child.register({provide: token, useValue: 'targeted-value', at: 'grandparent-tag'});

      // Provider should be registered on grandparent
      expect(grandparent.hasProviderFor(token)).toBe(true);
      expect(parent.hasProviderFor(token)).toBe(false);
      expect(child.hasProviderFor(token)).toBe(false);
      expect(grandparent.inject(token)).toBe('targeted-value');
      expect(parent.inject(token)).toBe('targeted-value');
      expect(child.inject(token)).toBe('targeted-value');
    });

    it('works with multiple targeted injectors', () => {
      const root = new Injector(); // TAG_ROOT
      const middle = new Injector({tag: 'middle', parent: root});
      const leaf = new Injector({tag: 'leaf', parent: middle});

      const rootToken = new Token<string>('root-token');
      const middleToken = new Token<string>('middle-token');
      const leafToken = new Token<string>('leaf-token');

      // Register from leaf targeting different levels
      leaf.register([
        {provide: rootToken, useValue: 'root-value', at: 'root'},
        {provide: middleToken, useValue: 'middle-value', at: 'middle'},
        {provide: leafToken, useValue: 'leaf-value', at: 'leaf'},
      ]);

      // Verify registration at correct levels
      expect(root.hasProviderFor(rootToken)).toBe(true);
      expect(root.hasProviderFor(middleToken)).toBe(false);
      expect(root.hasProviderFor(leafToken)).toBe(false);

      expect(middle.hasProviderFor(rootToken)).toBe(false);
      expect(middle.hasProviderFor(middleToken)).toBe(true);
      expect(middle.hasProviderFor(leafToken)).toBe(false);

      expect(leaf.hasProviderFor(rootToken)).toBe(false);
      expect(leaf.hasProviderFor(middleToken)).toBe(false);
      expect(leaf.hasProviderFor(leafToken)).toBe(true);

      expect(leaf.inject(rootToken)).toBe('root-value');
      expect(leaf.inject(middleToken)).toBe('middle-value');
      expect(leaf.inject(leafToken)).toBe('leaf-value');
    });

    it('works for root target', () => {
      const root = new Injector();
      const middle = new Injector({tag: 'other', parent: root});
      const leaf = new Injector({tag: 'another', parent: middle});
      const token = new Token<string>('test');

      // Register from leaf targeting root
      leaf.register({provide: token, useValue: 'value', at: TAG_ROOT});

      // Should skip middle and register on root
      expect(root.hasProviderFor(token)).toBe(true);
      expect(middle.hasProviderFor(token)).toBe(false);
      expect(leaf.hasProviderFor(token)).toBe(false);
      expect(leaf.inject(token)).toBe('value');
    });

    it('throws when no matching tag exists in entire hierarchy', () => {
      const root = new Injector();
      const middle = new Injector({tag: 'middle', parent: root});
      const leaf = new Injector({tag: 'leaf', parent: middle});
      const token = new Token<string>('test');

      // Try to target non-existent tag
      expect(() => {
        leaf.register({provide: token, useValue: 'value', at: 'nonexistent'});
      }).toThrow(NoMatchingTagError);
    });

    it('works with caching', () => {
      const parent = new Injector({tag: 'parent'});
      const child = parent.fork();

      class TestService {
        static instanceCount = 0;
        constructor() {
          TestService.instanceCount++;
        }
      }

      // Register from child targeting parent
      child.register({provide: TestService, useClass: TestService, at: 'parent'});

      // Provider is on parent, so parent's cache is used
      const instance1 = parent.inject(TestService);
      expect(TestService.instanceCount).toBe(1);

      const instance2 = child.inject(TestService);
      expect(TestService.instanceCount).toBe(1);

      expect(instance1).toBe(instance2);
    });

    it('works with overrides', () => {
      const parent = new Injector({tag: 'parent', defaultAllowOverrides: true});
      const child = new Injector({parent});
      const token = new Token<string>('test');

      // Register initial value on parent
      parent.register({provide: token, useValue: 'original'});

      // Override from child targeting parent (should work due to allowOverrides)
      expect(() => {
        child.register({provide: token, useValue: 'overridden', at: 'parent'});
      }).not.toThrow();

      expect(parent.inject(token)).toBe('overridden');
      expect(child.inject(token)).toBe('overridden');
    });

    it('works for mixed providers arrays', () => {
      const parent = new Injector({tag: 'parent'});
      const child = new Injector({tag: 'child', parent});

      const localToken = new Token<string>('local');
      const parentToken = new Token<string>('parent');
      const childToken = new Token<string>('child');

      child.register([
        {provide: localToken, useValue: 'local-value'}, // no 'at' - registers locally
        {provide: parentToken, useValue: 'parent-value', at: 'parent'}, // targets parent
        {provide: childToken, useValue: 'child-value', at: 'child'}, // targets self
      ]);

      // Verify registration locations
      expect(child.hasProviderFor(localToken)).toBe(true);
      expect(child.hasProviderFor(childToken)).toBe(true);
      expect(child.hasProviderFor(parentToken)).toBe(false);

      expect(parent.hasProviderFor(parentToken)).toBe(true);
      expect(parent.hasProviderFor(localToken)).toBe(false);
      expect(parent.hasProviderFor(childToken)).toBe(false);

      // All accessible from child
      expect(child.inject(localToken)).toBe('local-value');
      expect(child.inject(parentToken)).toBe('parent-value');
      expect(child.inject(childToken)).toBe('child-value');
    });

    it('works with sink injector in hierarchy', () => {
      const root = new Injector(); // TAG_ROOT
      const sink = new Injector({tag: TAG_SINK, parent: root});
      const child = new Injector({parent: sink});

      const token1 = new Token<string>('token1');
      const token2 = new Token<string>('token2');
      const token3 = new Token<string>('token3');

      // Register from child with various 'at' values
      // sink should capture all, except local
      child.register([
        {provide: token1, useValue: 'value1', at: 'root'},
        {provide: token2, useValue: 'value2', at: 'nonexistent'},
        {provide: token3, useValue: 'value3'},
      ]);

      // All should be registered on sink despite different 'at' values
      expect(child.hasProviderFor(token1)).toBe(false);
      expect(child.hasProviderFor(token2)).toBe(false);
      expect(child.hasProviderFor(token3)).toBe(true);

      expect(sink.hasProviderFor(token1)).toBe(true);
      expect(sink.hasProviderFor(token2)).toBe(true);
      expect(sink.hasProviderFor(token3)).toBe(false);

      expect(root.hasProviderFor(token1)).toBe(false);
      expect(root.hasProviderFor(token2)).toBe(false);
      expect(root.hasProviderFor(token3)).toBe(false);

      // All should resolve correctly from child
      expect(child.inject(token1)).toBe('value1');
      expect(child.inject(token2)).toBe('value2');
      expect(child.inject(token3)).toBe('value3');
    });
  });
});
