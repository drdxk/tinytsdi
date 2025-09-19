import {ClassProvider, Provider} from '../providers';

import {
  SERVICE2_NO_ARGS,
  SERVICE,
  SERVICE_NO_ARGS,
  SERVICE_WITH_INJECT,
  Service2NoArgs,
  Service,
  ServiceNoArgs,
  ServiceWithInject,
  ServiceWithInjectAndOptionalArg,
  ServiceWithInjectAndOtherArg,
  ServiceWithOptionalArgs,
  describe,
  it,
} from './ct_helper';

describe('ClassProvider<T>', () => {
  describe('constructor arguments', () => {
    it('accepts no-args constructor using token', () => {
      const validClassProvider: ClassProvider<ServiceNoArgs> = {
        provide: SERVICE_NO_ARGS,
        useClass: ServiceNoArgs,
      };
      void validClassProvider;
    });

    it('accepts no-args constructor using class', () => {
      const validClassProvider: ClassProvider<ServiceNoArgs> = {
        provide: ServiceNoArgs,
        useClass: ServiceNoArgs,
      };
      void validClassProvider;
    });

    it('accepts constructor with optional args', () => {
      const validClassProvider: ClassProvider<ServiceWithOptionalArgs> = {
        provide: ServiceWithOptionalArgs,
        useClass: ServiceWithOptionalArgs,
      };
      void validClassProvider;
    });

    it('rejects no-args constructor with incompatible token', () => {
      const invalidClassProvider: ClassProvider<ServiceNoArgs> = {
        // @ts-expect-error - incompatible token type
        provide: SERVICE2_NO_ARGS,
        useClass: ServiceNoArgs,
      };
      void invalidClassProvider;
    });

    it('rejects no-args constructor with incompatible class', () => {
      const invalidClassProvider: ClassProvider<ServiceNoArgs> = {
        // @ts-expect-error - incompatible class type
        provide: Service2NoArgs,
        useClass: ServiceNoArgs,
      };
      void invalidClassProvider;
    });

    it('rejects constructor with args using token', () => {
      const invalidClassProvider: ClassProvider<Service> = {
        provide: SERVICE,
        // @ts-expect-error - constructor with args not allowed
        useClass: Service,
      };
      void invalidClassProvider;
    });

    it('rejects constructor with InjectFn using token', () => {
      // @ts-expect-error - constructor with InjectFn not allowed
      const invalidClassProvider: ClassProvider<ServiceWithInject> = {
        provide: SERVICE_WITH_INJECT,
        useClass: ServiceWithInject,
      };
      void invalidClassProvider;
    });

    it('rejects constructor with InjectFn using class', () => {
      // @ts-expect-error - constructor with InjectFn not allowed
      const invalidClassProvider: ClassProvider<ServiceWithInject> = {
        provide: ServiceWithInject,
        useClass: ServiceWithInject,
      };
      void invalidClassProvider;
    });
  });

  describe('injectFn option', () => {
    it('accepts constructor with InjectFn and injectFn: true', () => {
      const validInjectFnClassProvider: ClassProvider<ServiceWithInject> = {
        provide: SERVICE_WITH_INJECT,
        useClass: ServiceWithInject,
        injectFn: true,
      };
      void validInjectFnClassProvider;
    });

    it('accepts constructor with empty args and injectFn: false', () => {
      const validInjectFnClassProvider: ClassProvider<ServiceNoArgs> = {
        provide: ServiceNoArgs,
        useClass: ServiceNoArgs,
        injectFn: false,
      };
      void validInjectFnClassProvider;
    });

    it('accepts constructor with inject and optional args and injectFn: true', () => {
      const validInjectAndOptionalArgsClassProvider: ClassProvider<ServiceWithInjectAndOptionalArg> =
        {
          provide: ServiceWithInjectAndOptionalArg,
          useClass: ServiceWithInjectAndOptionalArg,
          injectFn: true,
        };
      void validInjectAndOptionalArgsClassProvider;
    });

    it('rejects constructor with InjectFn and injectFn: false', () => {
      // @ts-expect-error - Constructor needs InjectFn but injectFn is false
      const falseInjectFnClassProvider: ClassProvider<ServiceWithInject> = {
        provide: ServiceWithInject,
        useClass: ServiceWithInject,
        injectFn: false,
      };
      void falseInjectFnClassProvider;
    });

    it('rejects constructor with incompatible args and injectFn: true', () => {
      const incompatibleArgsClassProvider: ClassProvider<Service> = {
        provide: SERVICE,
        // @ts-expect-error - InjectFn is not assignable to string
        useClass: Service,
        injectFn: true,
      };
      void incompatibleArgsClassProvider;
    });

    it('rejects constructor with optional args and injectFn: true', () => {
      // @ts-expect-error - InjectFn is not assignable to string | undefined
      const optionalArgsClassProvider: ClassProvider<ServiceWithOptionalArgs> = {
        provide: ServiceWithOptionalArgs,
        useClass: ServiceWithOptionalArgs,
        injectFn: true,
      };
      void optionalArgsClassProvider;
    });

    it('rejects constructor with InjectFn and other args and injectFn: true', () => {
      const invalidClassProvider: ClassProvider<ServiceWithInjectAndOtherArg> = {
        provide: ServiceWithInjectAndOtherArg,
        // @ts-expect-error - Incompatible signature
        useClass: ServiceWithInjectAndOtherArg,
        injectFn: true,
      };
      void invalidClassProvider;
    });
  });

  describe('noCache option', () => {
    it('accepts noCache: true', () => {
      const validNoCacheClassProvider: ClassProvider<ServiceNoArgs> = {
        provide: SERVICE_NO_ARGS,
        useClass: ServiceNoArgs,
        noCache: true,
      };
      void validNoCacheClassProvider;
    });

    it('accepts explicit noCache: false', () => {
      const validNoCacheClassProvider: ClassProvider<ServiceNoArgs> = {
        provide: SERVICE_NO_ARGS,
        useClass: ServiceNoArgs,
        noCache: false,
      };
      void validNoCacheClassProvider;
    });

    it('rejects invalid noCache value', () => {
      const invalidNoCacheClassProvider: ClassProvider<ServiceNoArgs> = {
        provide: SERVICE_NO_ARGS,
        useClass: ServiceNoArgs,
        // @ts-expect-error - 'invalid' not a valid value for noCache
        noCache: 'invalid',
      };
      void invalidNoCacheClassProvider;
    });
  });

  describe('assignability', () => {
    it('ClassProvider<T> is assignable to Provider<T>', () => {
      const classProvider: ClassProvider<ServiceNoArgs> = {
        provide: SERVICE_NO_ARGS,
        useClass: ServiceNoArgs,
      };
      const provider: Provider<ServiceNoArgs> = classProvider;
      void provider;
    });

    it('ClassProvider<X> is not assignable to Provider<Y>', () => {
      const classProvider: ClassProvider<ServiceNoArgs> = {
        provide: SERVICE_NO_ARGS,
        useClass: ServiceNoArgs,
      };
      // @ts-expect-error - Incompatible types
      const invalidProvider: Provider<Service> = classProvider;
      void invalidProvider;
    });

    it('no-args constructor is assignable to Provider<T>', () => {
      const providerFromConstructor: Provider<ServiceNoArgs> = ServiceNoArgs;
      void providerFromConstructor;
    });

    it('consstructor with InjectFn argument is assignable to Provider<T>', () => {
      const providerFromConstructor: Provider<ServiceWithInject> = ServiceWithInject;
      void providerFromConstructor;
    });

    it('constructor with optional InjectFn argument is assignable to Provider<T>', () => {
      const providerFromConstructor: Provider<ServiceWithInjectAndOptionalArg> =
        ServiceWithInjectAndOptionalArg;
      void providerFromConstructor;
    });

    it('constructor with optional args is assignable to Provider<T>', () => {
      const providerFromConstructor: Provider<ServiceWithOptionalArgs> = ServiceWithOptionalArgs;
      void providerFromConstructor;
    });

    it('constructor with args is not assignable to Provider<T>', () => {
      // @ts-expect-error - Incompatible constructor signature
      const invalidProviderFromConstructor: Provider<Service> = Service;
      void invalidProviderFromConstructor;
    });
  });
});
