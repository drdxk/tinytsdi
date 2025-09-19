import {Injector} from '../injector';

import {
  NUMBER,
  SERVICE,
  SERVICE_NO_ARGS,
  STRING,
  Service2NoArgs,
  Service,
  ServiceNoArgs,
  describe,
  it,
} from './ct_helper';

describe('Injector.inject', () => {
  const injector = new Injector();

  describe('InjectionId', () => {
    it('accepts all InjectionId types', () => {
      injector.inject(STRING);
      injector.inject(SERVICE);
      injector.inject(Service);
      injector.inject(ServiceNoArgs);
    });

    it('rejects incompatible types', () => {
      // @ts-expect-error - incompatible type
      injector.inject(42);
      // @ts-expect-error - incompatible type
      injector.inject(null);
      // @ts-expect-error - incompatible type
      injector.inject(undefined);
      // @ts-expect-error - incompatible type
      injector.inject('token');
      // @ts-expect-error - incompatible type
      injector.inject(new Date());
    });
  });

  describe('return type', () => {
    it('matches the InjectionId type', () => {
      const str: string = injector.inject(STRING);
      const service: Service = injector.inject(SERVICE);
      const serviceClass: Service = injector.inject(Service);
      const serviceNoArgs: ServiceNoArgs = injector.inject(ServiceNoArgs);
      void str;
      void service;
      void serviceClass;
      void serviceNoArgs;
    });
  });

  describe('defaultValue type', () => {
    it('matches the InjectionId type', () => {
      const strWithDefault: string = injector.inject(STRING, 'default');
      const numWithDefault: number = injector.inject(NUMBER, 0);
      const serviceWithDefault: Service = injector.inject(SERVICE, new Service('default'));
      void strWithDefault;
      void numWithDefault;
      void serviceWithDefault;
    });

    it('works with null as defaultValue', () => {
      const strWithNullOverride: string | null = injector.inject(STRING, null);
      const numWithNullOverride: number | null = injector.inject(NUMBER, null);
      const serviceWithNullOverride: ServiceNoArgs | null = injector.inject(SERVICE_NO_ARGS, null);
      void strWithNullOverride;
      void numWithNullOverride;
      void serviceWithNullOverride;
    });

    it('when defaultValue is null the return type is nullable', () => {
      // @ts-expect-error - null not assignable to string
      const strWithNullOverride: string = injector.inject(STRING, null);
      // @ts-expect-error - null not assignable to number
      const numWithNullOverride: number = injector.inject(NUMBER, null);
      // @ts-expect-error - null not assignable to ServiceNoArgs
      const serviceWithNullOverride: ServiceNoArgs = injector.inject(SERVICE_NO_ARGS, null);
      void strWithNullOverride;
      void numWithNullOverride;
      void serviceWithNullOverride;
    });

    it('rejects incompatible defaultValue types', () => {
      // @ts-expect-error - Default value type must match token type
      const strWithWrongDefault = injector.inject(STRING, 123);
      // @ts-expect-error - Default value type must match token type
      const numWithWrongDefault = injector.inject(NUMBER, 'wrong');
      // @ts-expect-error - Default value type must match token type
      const serviceWithWrongOverride = injector.inject(SERVICE_NO_ARGS, Service2NoArgs);
      void strWithWrongDefault;
      void numWithWrongDefault;
      void serviceWithWrongOverride;
    });
  });
});
