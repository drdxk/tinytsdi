import {Injector, NoMatchingTagError, NotProvidedError, Token} from 'tinytsdi';
import {describe, expect, it} from 'vitest';

describe('hierarchical injection', () => {
  describe('basic functionality', () => {
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

  describe('multi-level', () => {
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

  describe('provider targeting', () => {
    it('supports tag-based provider targeting across 3-level hierarchy (root → app → request)', () => {
      const root = new Injector({tag: 'root'});
      const app = new Injector({tag: 'app', parent: root});
      const request = new Injector({tag: 'request', parent: app});

      const rootToken = new Token<string>('root-service');
      const appToken = new Token<string>('app-service');
      const requestToken = new Token<string>('request-service');

      // Register from request level, targeting different levels
      request.register([
        {provide: rootToken, useValue: 'root-value', at: 'root'},
        {provide: appToken, useValue: 'app-value', at: 'app'},
        {provide: requestToken, useValue: 'request-value', at: 'request'},
      ]);

      // Verify providers registered at correct levels
      expect(root.hasProviderFor(rootToken)).toBe(true);
      expect(app.hasProviderFor(appToken)).toBe(true);
      expect(request.hasProviderFor(requestToken)).toBe(true);

      // All accessible from request level
      expect(request.inject(rootToken)).toBe('root-value');
      expect(request.inject(appToken)).toBe('app-value');
      expect(request.inject(requestToken)).toBe('request-value');
    });

    it('works with all provider types using at property (class, factory, value, existing) with caching', () => {
      const parent = new Injector({tag: 'parent'});
      const child = new Injector({parent});

      class TestService {
        static instanceCount = 0;
        constructor() {
          TestService.instanceCount++;
        }
      }

      const valueToken = new Token<string>('value');
      const classToken = new Token<TestService>('class');
      const factoryToken = new Token<number>('factory');
      const existingToken = new Token<string>('existing');

      let factoryCallCount = 0;

      // Register all provider types targeting parent
      child.register([
        {provide: valueToken, useValue: 'test-value', at: 'parent'},
        {provide: classToken, useClass: TestService, at: 'parent'},
        {provide: factoryToken, useFactory: () => factoryCallCount++, at: 'parent'},
        {provide: existingToken, useExisting: valueToken, at: 'parent'},
      ]);

      // All providers registered on parent
      expect(parent.hasProviderFor(valueToken)).toBe(true);
      expect(parent.hasProviderFor(classToken)).toBe(true);
      expect(parent.hasProviderFor(factoryToken)).toBe(true);
      expect(parent.hasProviderFor(existingToken)).toBe(true);

      // Value provider works
      expect(parent.inject(valueToken)).toBe('test-value');

      // Class provider works with caching
      const instance1 = parent.inject(classToken);
      expect(instance1).toBeInstanceOf(TestService);
      expect(TestService.instanceCount).toBe(1);
      const instance2 = child.inject(classToken);
      expect(instance2).toBe(instance1); // Same instance (cached on parent)
      expect(TestService.instanceCount).toBe(1);

      // Factory provider works with caching
      expect(parent.inject(factoryToken)).toBe(0);
      expect(factoryCallCount).toBe(1);
      expect(child.inject(factoryToken)).toBe(0); // Cached value
      expect(factoryCallCount).toBe(1);

      // Existing provider (alias) works
      expect(parent.inject(existingToken)).toBe('test-value');
      expect(child.inject(existingToken)).toBe('test-value');
    });

    it('throws NoMatchingTagError when targeting non-existent tag in multi-level hierarchy', () => {
      const root = new Injector({tag: 'root'});
      const leaf = new Injector({tag: 'leaf', parent: root});
      const token = new Token<string>('test');

      // Try to target a tag that doesn't exist in the hierarchy
      expect(() => {
        leaf.register({provide: token, useValue: 'value', at: 'nonexistent-tag'});
      }).toThrow(NoMatchingTagError);
    });
  });
});
