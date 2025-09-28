import {FactoryProvider, Provider} from '../providers';
import {InjectFn} from '../types';

import {NUMBER, SERVICE, STRING, Service, describe, it} from './ct_helper';

describe('FactoryProvider<T>', () => {
  describe('factory function', () => {
    it('accepts no-args factory', () => {
      const validFactoryProvider: FactoryProvider<string> = {
        provide: STRING,
        useFactory: () => 'factory result',
      };
      void validFactoryProvider;
    });

    it('accepts factory with InjectFn argument', () => {
      const validFactoryProviderWithInject: FactoryProvider<string> = {
        provide: STRING,
        useFactory: (inject: InjectFn) => {
          const value = inject(NUMBER);
          return `processed: ${value}`;
        },
        noCache: true,
      };
      void validFactoryProviderWithInject;
    });

    it('rejects factory incompatible return type', () => {
      const invalidFactoryProvider: FactoryProvider<string> = {
        provide: STRING,
        // @ts-expect-error - number not assignable to string
        useFactory: () => 42,
      };
      void invalidFactoryProvider;
    });
  });

  describe('noCache option', () => {
    it('accepts false', () => {
      const validFactoryProviderCached: FactoryProvider<Service> = {
        provide: Service,
        useFactory: () => new Service('cached factory result'),
        noCache: false,
      };
      void validFactoryProviderCached;
    });

    it('accepts true', () => {
      const validFactoryProviderNoCache: FactoryProvider<Service> = {
        provide: Service,
        useFactory: (inject: InjectFn) => inject(SERVICE),
        noCache: true,
      };
      void validFactoryProviderNoCache;
    });

    it('rejects invalid value', () => {
      const invalidNoCacheFactoryProvider: FactoryProvider<Service> = {
        provide: Service,
        useFactory: (inject: InjectFn) => inject(SERVICE),
        // @ts-expect-error - 'invalid' not a valid value for noCache
        noCache: 'invalid',
      };
      void invalidNoCacheFactoryProvider;
    });
  });

  describe('at option', () => {
    it('accepts string tag values', () => {
      const factoryProviderWithAt: FactoryProvider<string> = {
        provide: STRING,
        useFactory: () => 'factory result',
        at: 'custom-tag',
      };
      void factoryProviderWithAt;
    });

    it('accepts symbol tag values', () => {
      const factoryProviderWithAtSymbol: FactoryProvider<string> = {
        provide: STRING,
        useFactory: () => 'factory result',
        at: Symbol('custom'),
      };
      void factoryProviderWithAtSymbol;
    });

    it('rejects invalid at property types', () => {
      const invalidAtProvider: FactoryProvider<string> = {
        provide: STRING,
        useFactory: () => 'result',
        // @ts-expect-error - number not assignable to TagValue
        at: 42,
      };
      void invalidAtProvider;
    });
  });

  it('assignable to Provider<T>', () => {
    const validFactoryProvider: FactoryProvider<string> = {
      provide: STRING,
      useFactory: () => 'factory result',
    };
    const provider: Provider<string> = validFactoryProvider;
    void provider;
  });

  it('factory provider with all options assignable to Provider<T>', () => {
    const factoryProviderWithAllOptions: FactoryProvider<Service> = {
      provide: Service,
      useFactory: (inject: InjectFn) => inject(SERVICE),
      noCache: true,
      at: 'tag',
    };
    const provider: Provider<Service> = factoryProviderWithAllOptions;
    void provider;
  });

  it('not assignable to Provider<Y> for incompatible Y', () => {
    const validFactoryProvider: FactoryProvider<string> = {
      provide: STRING,
      useFactory: () => 'factory result',
    };
    // @ts-expect-error - Incompatible types
    const invalidProvider: Provider<number> = validFactoryProvider;
    void invalidProvider;
  });
});
