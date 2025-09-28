import {describe, expect, it} from 'vitest';

import {AlreadyProvidedError, NoMatchingTagError, UnknownProviderError} from '../errors.js';
import {Injector} from '../injector.js';
import {TAG_ROOT, TAG_SINK, Token} from '../types.js';

describe('Injector.register()', () => {
  describe('providers support', () => {
    it('registers single provider', () => {
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

    it('registers all provider types', () => {
      const injector = new Injector();
      const valueToken = new Token<string>('value');
      const classToken = new Token<TestService>('class');
      const factoryToken = new Token<number>('factory');
      const aliasToken = new Token<string>('alias');

      class TestService {
        readonly marker = 'test';
      }

      expect(() => {
        injector.register(TestService);
        injector.register({provide: valueToken, useValue: 'test'});
        injector.register({provide: classToken, useClass: TestService});
        injector.register({provide: factoryToken, useFactory: () => 42, noCache: true});
        injector.register({provide: aliasToken, useExisting: valueToken});
      }).not.toThrow();
    });
  });

  describe('duplicate registration', () => {
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
      const injector = new Injector({defaultAllowOverrides: true});
      const token = new Token<string>('test');
      const provider1 = {provide: token, useValue: 'first'};
      const provider2 = {provide: token, useValue: 'second'};

      injector.register(provider1);
      expect(() => injector.register(provider2)).not.toThrow();
    });

    it('explicit allowOverrides=false overrides defaultAllowOverrides=true', () => {
      const injector = new Injector({defaultAllowOverrides: true});
      const token = new Token<string>('test');
      const provider1 = {provide: token, useValue: 'first'};
      const provider2 = {provide: token, useValue: 'second'};

      injector.register(provider1);
      expect(() => injector.register(provider2, /* allowOverrides= */ false)).toThrow(
        AlreadyProvidedError
      );
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
  });

  describe('edge cases', () => {
    it('registers empty array', () => {
      const injector = new Injector();
      expect(() => injector.register([])).not.toThrow();
    });
  });

  describe('errors', () => {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const emptyProvider = {} as any;

      expect(() => injector.register(invalidProvider)).toThrow(UnknownProviderError);
      expect(() => injector.register(emptyProvider)).toThrow(UnknownProviderError);
    });
    /* eslint-enable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-argument */
  });

  describe('at property targeting', () => {
    it('root injector registers providers with at: "root"', () => {
      const injector = new Injector();
      const token = new Token<string>('test');

      expect(injector.getTag()).toBe(TAG_ROOT);
      expect(() => {
        injector.register({provide: token, useValue: 'test', at: 'root'});
      }).not.toThrow();

      expect(injector.hasProviderFor(token)).toBe(true);
      expect(injector.inject(token)).toBe('test');
    });

    it('root injector registers providers with at: TAG_ROOT', () => {
      const injector = new Injector();
      const token = new Token<string>('test');

      expect(() => {
        injector.register({provide: token, useValue: 'test', at: TAG_ROOT});
      }).not.toThrow();

      expect(injector.hasProviderFor(token)).toBe(true);
      expect(injector.inject(token)).toBe('test');
    });

    it('sink injector ignores providers targeting', () => {
      const injector = new Injector({tag: TAG_SINK});
      const token1 = new Token<string>('test1');
      const token2 = new Token<string>('test2');
      const token3 = new Token<string>('test3');

      expect(() => {
        injector.register([
          {provide: token1, useValue: 'test1', at: Symbol.for('other')},
          {provide: token2, useValue: 'test2', at: 'custom'},
          {provide: token3, useValue: 'test3', at: Symbol()},
        ]);
      }).not.toThrow();

      // All providers should be registered locally despite different 'at' values
      expect(injector.hasProviderFor(token1)).toBe(true);
      expect(injector.hasProviderFor(token2)).toBe(true);
      expect(injector.hasProviderFor(token3)).toBe(true);
      expect(injector.inject(token1)).toBe('test1');
      expect(injector.inject(token2)).toBe('test2');
      expect(injector.inject(token3)).toBe('test3');
    });

    it('injector with custom symbol tag registers matching targeted providers', () => {
      const customTag = Symbol();
      const injector = new Injector({tag: customTag});
      const token = new Token<string>('test');

      expect(injector.getTag()).toBe(customTag);

      expect(() => {
        injector.register({provide: token, useValue: 'test', at: customTag});
      }).not.toThrow();

      expect(injector.hasProviderFor(token)).toBe(true);
      expect(injector.inject(token)).toBe('test');
    });

    it('injector with custom string tag registers matching targeted providers', () => {
      const injector = new Injector({tag: 'custom'});
      const token = new Token<string>('test');
      const token2 = new Token<string>('test2');

      expect(() => {
        injector.register({provide: token, useValue: 'test', at: 'custom'});
        injector.register({provide: token2, useValue: 'test2', at: Symbol.for('custom')});
      }).not.toThrow();

      expect(injector.hasProviderFor(token)).toBe(true);
      expect(injector.hasProviderFor(token2)).toBe(true);
      expect(injector.inject(token)).toBe('test');
      expect(injector.inject(token2)).toBe('test2');
    });

    it('throws NoMatchingTagError when unmatched tag and no parent exists', () => {
      const injector = new Injector({tag: 'custom'});
      const token = new Token<string>('test');

      expect(() => {
        injector.register({provide: token, useValue: 'test', at: 'different'});
      }).toThrow(NoMatchingTagError);
    });

    it('works with all provider types having at property', () => {
      const injector = new Injector({tag: 'custom'});
      const valueToken = new Token<string>('value');
      const classToken = new Token<TestService>('class');
      const factoryToken = new Token<number>('factory');
      const aliasToken = new Token<string>('alias');

      class TestService {
        readonly marker = 'test';
      }

      expect(() => {
        injector.register([
          {provide: valueToken, useValue: 'test', at: 'custom'},
          {provide: classToken, useClass: TestService, at: 'custom'},
          {provide: factoryToken, useFactory: () => 42, at: 'custom'},
          {provide: aliasToken, useExisting: valueToken, at: 'custom'},
        ]);
      }).not.toThrow();

      expect(injector.hasProviderFor(valueToken)).toBe(true);
      expect(injector.hasProviderFor(classToken)).toBe(true);
      expect(injector.hasProviderFor(factoryToken)).toBe(true);
      expect(injector.hasProviderFor(aliasToken)).toBe(true);
    });

    it('providers without at property register locally regardless of injector tag', () => {
      const injector = new Injector({tag: 'custom'});
      const token = new Token<string>('test');

      expect(() => {
        injector.register({provide: token, useValue: 'test'});
      }).not.toThrow();

      expect(injector.hasProviderFor(token)).toBe(true);
      expect(injector.inject(token)).toBe('test');
    });
  });
});
