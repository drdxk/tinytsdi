import {FactoryProvider, Provider} from '../providers';
import {InjectFn} from '../types';
import {NUMBER, SERVICE, STRING, Service, describe, it} from './ct_helper';

describe('FactoryProvider<T>', () => {
  it('accepts valid no-args factory', () => {
    const validFactoryProvider: FactoryProvider<string> = {
      provide: STRING,
      useFactory: () => 'factory result',
    };
    void validFactoryProvider;
  });

  it('accepts valid factory with InjectFn argument', () => {
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

  it('accepts valid factory with noCache false', () => {
    const validFactoryProviderCached: FactoryProvider<Service> = {
      provide: Service,
      useFactory: () => new Service('cached factory result'),
      noCache: false,
    };
    void validFactoryProviderCached;
  });

  it('accepts valid factory with noCache true', () => {
    const validFactoryProviderNoCache: FactoryProvider<Service> = {
      provide: Service,
      useFactory: (inject: InjectFn) => inject(SERVICE),
      noCache: true,
    };
    void validFactoryProviderNoCache;
  });

  it('rejects factory with invalid noCache value', () => {
    const invalidNoCacheFactoryProvider: FactoryProvider<Service> = {
      provide: Service,
      useFactory: (inject: InjectFn) => inject(SERVICE),
      // @ts-expect-error - 'invalid' not a valid value for noCache
      noCache: 'invalid',
    };
    void invalidNoCacheFactoryProvider;
  });

  it('rejects incompatible return type from factory', () => {
    const invalidFactoryProvider: FactoryProvider<string> = {
      provide: STRING,
      // @ts-expect-error - number not assignable to string
      useFactory: () => 42,
    };
    void invalidFactoryProvider;
  });

  it('assignable to Provider<T>', () => {
    const validFactoryProvider: FactoryProvider<string> = {
      provide: STRING,
      useFactory: () => 'factory result',
    };
    const provider: Provider<string> = validFactoryProvider;
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
