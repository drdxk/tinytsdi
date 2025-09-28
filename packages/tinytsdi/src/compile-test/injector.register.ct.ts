import {Injector} from '../injector.js';
import {Token} from '../types.js';

import {
  NUMBER,
  SERVICE,
  SERVICE_NO_ARGS,
  SERVICE_WITH_INJECT,
  STRING,
  Service2NoArgs,
  Service,
  ServiceNoArgs,
  ServiceWithArgs,
  ServiceWithInject,
  ServiceWithInjectAndOptionalArg,
  ServiceWithInjectAndOtherArg,
  describe,
  it,
} from './ct_helper';

describe('Injector.register', () => {
  const injector = new Injector();

  describe('ValueProvider', () => {
    it('accepts compatible types', () => {
      injector.register({provide: STRING, useValue: 'test string'});
      injector.register({provide: STRING, useValue: 'test string', at: 'custom'});
      injector.register({provide: NUMBER, useValue: 42});
      injector.register({provide: NUMBER, useValue: 42, at: Symbol.for('custom')});
      injector.register({provide: SERVICE, useValue: new Service('test service')});
    });

    it('rejects incompatible types', () => {
      // @ts-expect-error - number not assignable to string
      injector.register({provide: STRING, useValue: 42});
      // @ts-expect-error - string not assignable to number
      injector.register({provide: NUMBER, useValue: 'not a number'});
      // @ts-expect-error - Service2NoArgs not assignable to Service
      injector.register({provide: SERVICE, useValue: new Service2NoArgs()});
      // @ts-expect-error - number not assignable to TagValue
      injector.register({provide: STRING, useValue: 'test', at: 42});
    });
  });

  describe('ExistingProvider', () => {
    it('accepts compatible primitive types', () => {
      const sourceToken = new Token<string>('source');
      const targetToken = new Token<string>('target');
      injector.register({
        provide: targetToken,
        useExisting: sourceToken,
      });
    });

    it('accepts compatible class types', () => {
      injector.register({
        provide: SERVICE,
        useExisting: Service,
        at: 'custom',
      });
    });

    it('rejects incompatible primitive types', () => {
      // @ts-expect-error - number not assignable to string
      injector.register({
        provide: STRING,
        useExisting: NUMBER,
      });
    });

    it('rejects incompatible class types', () => {
      // @ts-expect-error - incompatible class types
      injector.register({
        provide: SERVICE,
        useExisting: Service2NoArgs,
      });
    });

    it('rejects invalid provider types', () => {
      // @ts-expect-error - Types of property 'injectFn' are incompatible.
      injector.register({provide: SERVICE, useExisting: Service, injectFn: []});
      // @ts-expect-error - Types of property 'noCache' are incompatible.
      injector.register({provide: SERVICE, useExisting: Service, noCache: {}});
      // @ts-expect-error - number not assignable to TagValue
      injector.register({provide: SERVICE, useExisting: Service, at: 42});
    });
  });

  describe('FactoryProvider', () => {
    it('accepts compatible factory return types', () => {
      injector.register({
        provide: STRING,
        useFactory: () => 'factory string',
      });

      injector.register({
        provide: NUMBER,
        useFactory: (inject) => {
          const str = inject(STRING, 'default');
          return str.length;
        },
        noCache: true,
        at: 'custom',
      });

      injector.register({
        provide: SERVICE,
        useFactory: () => new Service('from factory'),
        at: Symbol('custom'),
      });
    });

    it('rejects incompatible factory return types', () => {
      // @ts-expect-error - string not assignable to number
      injector.register({
        provide: STRING,
        useFactory: () => 42,
      });

      // @ts-expect-error - number not assignable to string
      injector.register({
        provide: NUMBER,
        useFactory: () => 'not a number',
        noCache: true,
      });

      // @ts-expect-error - incompatible class types
      injector.register({
        provide: SERVICE,
        useFactory: () => new Service2NoArgs(),
      });
    });

    it('rejects invalid provider types', () => {
      // @ts-expect-error - Types of property 'noCache' are incompatible.
      injector.register({
        provide: STRING,
        useFactory: () => 'test',
        noCache: 42,
      });
      injector.register({
        provide: STRING,
        useFactory: () => 'test',
        // @ts-expect-error - number not assignable to TagValue
        at: 42,
      });
    });
  });

  describe('ConstructorProvider', () => {
    it('accepts valid constructor providers', () => {
      injector.register(ServiceNoArgs);
      injector.register(ServiceWithInject);
      injector.register(ServiceWithInjectAndOptionalArg);
    });

    it('rejects invalid constructor providers', () => {
      // @ts-expect-error - incompatible constructor args
      injector.register(Service);
      // @ts-expect-error - incompatible constructor args
      injector.register(ServiceWithArgs);
      // @ts-expect-error - incompatible constructor args
      injector.register(ServiceWithInjectAndOtherArg);
    });
  });

  describe('ClassProvider', () => {
    it('accepts valid class providers', () => {
      injector.register({
        provide: SERVICE_NO_ARGS,
        useClass: ServiceNoArgs,
      });

      injector.register({
        provide: SERVICE_WITH_INJECT,
        useClass: ServiceWithInject,
        at: 'custom',
        noCache: true,
        injectFn: true,
      });

      injector.register({
        provide: SERVICE_NO_ARGS,
        useClass: ServiceNoArgs,
        at: Symbol('custom'),
        noCache: false,
        injectFn: false,
      });
    });

    it('rejects invalid class providers', () => {
      // @ts-expect-error - incompatible class types
      injector.register({
        provide: SERVICE_NO_ARGS,
        useClass: Service2NoArgs,
      });

      // @ts-expect-error - Constructor requires InjectFn but no injectFn specified
      injector.register({
        provide: SERVICE_WITH_INJECT,
        useClass: ServiceWithInject,
      });

      // @ts-expect-error - Service2NoArgs does not produce number
      injector.register({
        provide: NUMBER,
        useClass: Service2NoArgs,
      });

      // @ts-expect-error - invalid value for noCache
      injector.register({
        provide: SERVICE_NO_ARGS,
        useClass: ServiceNoArgs,
        noCache: 'invalid',
      });

      injector.register({
        provide: SERVICE_NO_ARGS,
        useClass: ServiceNoArgs,
        // @ts-expect-error - number not assignable to TagValue
        at: 42,
      });
    });
  });

  describe('Invalid Providers', () => {
    it('reject invalid provider types', () => {
      // @ts-expect-error - string is not a valid provider
      injector.register('invalid provider');
      // @ts-expect-error - number is not a valid provider
      injector.register(42);
      // @ts-expect-error - plain object not assignable to provider
      injector.register({invalidProperty: 'test'});
      // @ts-expect-error - null not assignable to provider
      injector.register(null);
      // @ts-expect-error - undefined not assignable to provider
      injector.register(undefined);
    });
  });

  describe('allowOverrides parameter', () => {
    it('accepts valid allowOverrides types', () => {
      injector.register({provide: STRING, useValue: 'test'}, true);
      injector.register({provide: STRING, useValue: 'test'}, false);
    });

    it('rejects incompatible allowOverrides types', () => {
      // @ts-expect-error - string not assignable to boolean
      injector.register({provide: STRING, useValue: 'test'}, 'invalid');
      // @ts-expect-error - number not assignable to boolean
      injector.register({provide: STRING, useValue: 'test'}, 1);
    });
  });

  describe('registering multiple providers', () => {
    it('accepts arrays of valid providers', () => {
      injector.register([
        {provide: STRING, useValue: 'test'},
        {provide: NUMBER, useValue: 42, at: 'custom'},
      ]);

      injector.register([
        {provide: SERVICE, useValue: new Service('test')},
        ServiceWithInject,
        {
          provide: STRING,
          useFactory: () => 'from factory',
          noCache: true,
          at: Symbol('custom'),
        },
      ]);
    });

    it('accepts empty arrays', () => {
      injector.register([]);
    });

    it('accepts single-element arrays', () => {
      injector.register([{provide: STRING, useValue: 'single'}]);
    });

    it('accepts arrays with allowOverrides parameter', () => {
      injector.register(
        [
          {provide: STRING, useValue: 'override1'},
          {provide: NUMBER, useValue: 999},
        ],
        true
      );
    });

    it('rejects arrays containing invalid providers', () => {
      // @ts-expect-error - array of strings not assignable to provider array
      injector.register(['invalid', 'providers']);

      injector.register([
        {provide: STRING, useValue: 'valid'},
        // @ts-expect-error - not a valid provider
        {invalidProperty: 'not a provider'},
      ]);

      // @ts-expect-error - invalid item in array
      injector.register([{provide: STRING, useValue: 'valid'}, 'invalid provider']);
    });
  });
});
