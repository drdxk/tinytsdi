import {describe, expect, it} from 'vitest';

import {Injector} from '../injector.js';
import {Token} from '../token.js';
import {InjectFn} from '../types.js';

describe('Injector inject function', () => {
  describe('works in', () => {
    it('shorthand (constructor) provider ', () => {
      const injector = new Injector();
      const depToken = new Token<string>('dependency');

      class ServiceWithDependency {
        constructor(private inject: InjectFn) {}

        getDependency() {
          return this.inject(depToken);
        }
      }

      injector.register({provide: depToken, useValue: 'injected value'});
      injector.register(ServiceWithDependency);

      const service = injector.inject(ServiceWithDependency);
      expect(service.getDependency()).toBe('injected value');
    });

    it('class provider with injectFn true', () => {
      const injector = new Injector();
      const depToken = new Token<string>('dependency');

      class ServiceWithDependency {
        constructor(private inject: InjectFn) {}

        getDependency() {
          return this.inject(depToken);
        }
      }

      injector.register({provide: depToken, useValue: 'injected value'});
      injector.register({
        provide: ServiceWithDependency,
        useClass: ServiceWithDependency,
        injectFn: true,
      });

      const service = injector.inject(ServiceWithDependency);
      expect(service.getDependency()).toBe('injected value');
    });

    it('factory provider factory function', () => {
      const injector = new Injector();
      const depToken = new Token<string>('dependency');
      const factoryToken = new Token<string>('factory');

      injector.register({provide: depToken, useValue: 'injected value'});
      injector.register({
        provide: factoryToken,
        useFactory: (inject) => `factory: ${inject(depToken)}`,
      });

      expect(injector.inject(factoryToken)).toBe('factory: injected value');
    });

    it('existing providers (aliases)', () => {
      const injector = new Injector();
      const originalToken = new Token<string>('original');
      const aliasToken = new Token<string>('alias');
      const serviceToken = new Token<TestServiceUsingAlias>('service');

      class TestServiceUsingAlias {
        public aliasValue: string;

        constructor(inject: InjectFn) {
          this.aliasValue = inject(aliasToken);
        }
      }

      injector.register({provide: originalToken, useValue: 'original value'});
      injector.register({provide: aliasToken, useExisting: originalToken});
      injector.register({
        provide: serviceToken,
        useClass: TestServiceUsingAlias,
        injectFn: true,
      });

      const service = injector.inject(serviceToken);
      expect(service.aliasValue).toBe('original value');
    });
  });

  describe('supports', () => {
    it('nested resolution', () => {
      const injector = new Injector();
      const baseToken = new Token<string>('base');
      const serviceAToken = new Token<ServiceA>('serviceA');
      const factoryToken = new Token<ServiceB>('serviceB');

      class ServiceA {
        public baseValue: string;

        constructor(inject: InjectFn) {
          this.baseValue = inject(baseToken);
        }
      }

      class ServiceB {
        public serviceA: ServiceA;

        constructor(inject: InjectFn) {
          this.serviceA = inject(serviceAToken);
        }

        getBaseValue() {
          return this.serviceA.baseValue;
        }
      }

      const factoryFn = (inject: InjectFn) => inject(ServiceB);

      injector.register({provide: baseToken, useValue: 'base value'});
      injector.register({provide: serviceAToken, useClass: ServiceA, injectFn: true});
      injector.register(ServiceB);
      injector.register({provide: factoryToken, useFactory: factoryFn});

      const serviceB = injector.inject(factoryToken);
      expect(serviceB.getBaseValue()).toBe('base value');
    });

    it('default values in constructors', () => {
      const injector = new Injector();
      const depToken = new Token<string>('optional-dependency');
      const serviceToken = new Token<TestServiceWithDefault>('service');

      class TestServiceWithDefault {
        public value: string;

        constructor(inject: InjectFn) {
          this.value = inject(depToken, 'default value');
        }
      }

      injector.register({
        provide: serviceToken,
        useClass: TestServiceWithDefault,
        injectFn: true,
      });

      const service = injector.inject(serviceToken);
      expect(service.value).toBe('default value');
    });

    it('default values in factory functions', () => {
      const injector = new Injector();
      const depToken = new Token<string>('optional-dependency');
      const factoryToken = new Token<string>('factory');

      injector.register({
        provide: factoryToken,
        useFactory: (inject) => inject(depToken, 'default value'),
      });

      const value = injector.inject(factoryToken);
      expect(value).toBe('default value');
    });
  });

  describe('is not passed', () => {
    it('to constructors of class providers by default', () => {
      const injector = new Injector();
      const serviceToken = new Token<TestServiceDefault>('service');

      class TestServiceDefault {
        public readonly constructorArgsLength: number;

        constructor() {
          this.constructorArgsLength = arguments.length;
        }
      }

      injector.register({
        provide: serviceToken,
        useClass: TestServiceDefault,
      });

      const service = injector.inject(serviceToken);
      expect(service.constructorArgsLength).toBe(0);
    });

    it('to constructors of class providers when injectFn is explicity false', () => {
      const injector = new Injector();
      const serviceToken = new Token<TestServiceNoArgs>('service');

      class TestServiceNoArgs {
        public readonly constructorArgsLength: number;

        constructor() {
          this.constructorArgsLength = arguments.length;
        }
      }

      injector.register({
        provide: serviceToken,
        useClass: TestServiceNoArgs,
        injectFn: false,
      });

      const service = injector.inject(serviceToken);
      expect(service.constructorArgsLength).toBe(0);
    });
  });
});
