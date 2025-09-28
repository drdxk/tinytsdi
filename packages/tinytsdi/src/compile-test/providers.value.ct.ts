import {Provider, ValueProvider} from '../providers';

import {SERVICE, STRING, Service, describe, it} from './ct_helper';

describe('ValueProvider<T>', () => {
  it('accepts valid primitive type', () => {
    const stringValueProvider: ValueProvider<string> = {
      provide: STRING,
      useValue: 'test',
    };
    void stringValueProvider;
  });

  it('accepts valid class type using typed token as InjectionId', () => {
    const serviceValueProvider: ValueProvider<Service> = {
      provide: SERVICE,
      useValue: new Service('value'),
    };
    void serviceValueProvider;
  });

  it('accepts valid class type using constructor as InjectionId', () => {
    const validValueProviderWithClass: ValueProvider<Service> = {
      provide: Service,
      useValue: new Service('value'),
    };
    void validValueProviderWithClass;
  });

  it('rejects incompatible token type for primitive values', () => {
    const invalidValueProvider: ValueProvider<string> = {
      provide: STRING,
      // @ts-expect-error - number not assignable to string value
      useValue: 42,
    };
    void invalidValueProvider;
  });

  it('rejects incompatible token type for class values', () => {
    const invalidValueProvider: ValueProvider<Service> = {
      provide: SERVICE,
      // @ts-expect-error - ServiceNoArgs not assignable to Service
      useValue: new (class ServiceNoArgs {})(),
    };
    void invalidValueProvider;
  });

  it('rejects incompatible constructor type for class values', () => {
    const invalidValueProvider: ValueProvider<Service> = {
      provide: Service,
      // @ts-expect-error - ServiceNoArgs not assignable to Service
      useValue: new (class ServiceNoArgs {})(),
    };
    void invalidValueProvider;
  });

  it('primitive type provider assignable to Provider<T>', () => {
    const validValueProvider: ValueProvider<string> = {
      provide: STRING,
      useValue: 'test',
    };
    const providerFromValue: Provider<string> = validValueProvider;
    void providerFromValue;
  });

  it('class type provider assignable to Provider<T>', () => {
    const validValueProviderWithClass: ValueProvider<Service> = {
      provide: Service,
      useValue: new Service('value'),
    };
    const providerFromValue: Provider<Service> = validValueProviderWithClass;
    void providerFromValue;
  });

  it('not assignable to Provider<Y> for incompatible Y', () => {
    const validValueProviderWithClass: ValueProvider<Service> = {
      provide: Service,
      useValue: new Service('value'),
    };
    // @ts-expect-error - Incompatible types
    const invalidProvider: Provider<string> = validValueProviderWithClass;
    void invalidProvider;
  });
});

describe('ValueProvider<T> at property', () => {
  it('accepts string tag values', () => {
    const stringTagProvider: ValueProvider<string> = {
      provide: STRING,
      useValue: 'test',
      at: 'custom-tag',
    };
    void stringTagProvider;
  });

  it('accepts symbol tag values', () => {
    const symbolTagProvider: ValueProvider<string> = {
      provide: STRING,
      useValue: 'test',
      at: Symbol('custom'),
    };
    void symbolTagProvider;
  });

  it('rejects invalid tag types', () => {
    const invalidTagProvider: ValueProvider<string> = {
      provide: STRING,
      useValue: 'test',
      // @ts-expect-error - number not assignable to TagValue
      at: 42,
    };
    void invalidTagProvider;
  });

  it('maintains Provider<T> assignability with at property', () => {
    const classValueProviderWithAt: ValueProvider<Service> = {
      provide: SERVICE,
      useValue: new Service('test'),
      at: 'tag',
    };
    const provider: Provider<Service> = classValueProviderWithAt;
    void provider;
  });
});
