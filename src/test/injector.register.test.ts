import {describe, expect, it} from 'vitest';

import {AlreadyProvidedError, UnknownProviderError} from '../errors.js';
import {Injector} from '../injector.js';
import {Token} from '../types.js';

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
      const injector = new Injector(/* defaultAllowOverrides= */ true);
      const token = new Token<string>('test');
      const provider1 = {provide: token, useValue: 'first'};
      const provider2 = {provide: token, useValue: 'second'};

      injector.register(provider1);
      expect(() => injector.register(provider2)).not.toThrow();
    });

    it('explicit allowOverrides=false overrides defaultAllowOverrides=true', () => {
      const injector = new Injector(/* defaultAllowOverrides= */ true);
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
});
