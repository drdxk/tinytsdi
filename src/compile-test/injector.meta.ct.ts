import {Injector} from '../injector';
import {SERVICE, STRING, Service, ServiceNoArgs, describe, it} from './ct_helper';

describe('Injector meta methods', () => {
  const injector = new Injector();

  describe('static from()', () => {
    it('returns Injector type', () => {
      const newInjector: Injector = Injector.from(new Injector());
      void newInjector;
    });

    it('rejects invalid Injector as the first argument', () => {
      // @ts-expect-error - First parameter must be Injector
      const invalidSource = Injector.from({});
      // @ts-expect-error - First parameter must be Injector
      const invalidSource2 = Injector.from(null);
      // @ts-expect-error - First parameter must be Injector
      const invalidSource3 = Injector.from(new Date());
      void invalidSource;
      void invalidSource2;
      void invalidSource3;
    });

    it('accepts valid values for copyCache paramater', () => {
      const newInjectorWithCache: Injector = Injector.from(injector, true);
      const newInjectorWithoutCache: Injector = Injector.from(injector, false);
      void newInjectorWithCache;
      void newInjectorWithoutCache;
    });

    it('rejects invalid values for copyCache paramater', () => {
      // @ts-expect-error - copyCache must be boolean
      const invalidCopyCache = Injector.from(injector, 'invalid');
      // @ts-expect-error - copyCache must be boolean
      const invalidCopyCache2 = Injector.from(injector, 123);
      void invalidCopyCache;
      void invalidCopyCache2;
    });

    it('accepts valid values for copyParent paramater', () => {
      const sourceInjector = new Injector();
      const newInjectorWithParent: Injector = Injector.from(sourceInjector, false, true);
      const newInjectorWithoutParent: Injector = Injector.from(sourceInjector, false, false);
      void newInjectorWithParent;
      void newInjectorWithoutParent;
    });

    it('rejects invalid values for copyParent paramater', () => {
      const sourceInjector = new Injector();
      // @ts-expect-error - copyParent must be boolean
      const invalidCopyParent = Injector.from(sourceInjector, false, 'invalid');
      // @ts-expect-error - copyParent must be boolean
      const invalidCopyParent2 = Injector.from(sourceInjector, false, 123);
      void invalidCopyParent;
      void invalidCopyParent2;
    });
  });

  describe('hasProviderFor()', () => {
    it('accepts valid injection IDs', () => {
      injector.hasProviderFor(STRING);
      injector.hasProviderFor(SERVICE);
      injector.hasProviderFor(Service);
      injector.hasProviderFor(ServiceNoArgs);
    });

    it('rejects invalid injection IDs', () => {
      // @ts-expect-error - invalid injection ID
      injector.hasProviderFor(42);
      // @ts-expect-error - invalid injection ID
      injector.hasProviderFor(null);
      // @ts-expect-error - invalid injection ID
      injector.hasProviderFor(undefined);
      // @ts-expect-error - invalid injection ID
      injector.hasProviderFor('token');
      // @ts-expect-error - invalid injection ID
      injector.hasProviderFor(new Date());
    });

    it('returns boolean', () => {
      let hasProvider: boolean;
      hasProvider = injector.hasProviderFor(STRING);
      hasProvider = injector.hasProviderFor(SERVICE);
      hasProvider = injector.hasProviderFor(Service);
      hasProvider = injector.hasProviderFor(ServiceNoArgs);
      void hasProvider;
    });
  });

  describe('hasCachedValue()', () => {
    it('accepts valid injection IDs', () => {
      injector.hasCachedValue(STRING);
      injector.hasCachedValue(SERVICE);
      injector.hasCachedValue(Service);
      injector.hasCachedValue(ServiceNoArgs);
    });

    it('rejects invalid injection IDs', () => {
      // @ts-expect-error - invalid injection ID
      injector.hasCachedValue(42);
      // @ts-expect-error - invalid injection ID
      injector.hasCachedValue(null);
      // @ts-expect-error - invalid injection ID
      injector.hasCachedValue(undefined);
      // @ts-expect-error - invalid injection ID
      injector.hasCachedValue('token');
      // @ts-expect-error - invalid injection ID
      injector.hasCachedValue(new Date());
    });

    it('returns boolean', () => {
      let hasCached: boolean;
      hasCached = injector.hasCachedValue(STRING);
      hasCached = injector.hasCachedValue(SERVICE);
      hasCached = injector.hasCachedValue(Service);
      hasCached = injector.hasCachedValue(ServiceNoArgs);
      void hasCached;
    });
  });

  describe('invalidate()', () => {
    it('accepts no parameters', () => {
      injector.invalidate();
    });

    it('accepts a single valid injection ID', () => {
      injector.invalidate(STRING);
      injector.invalidate(SERVICE);
      injector.invalidate(Service);
      injector.invalidate(ServiceNoArgs);
    });

    it('accepts an array of valid injection IDs', () => {
      injector.invalidate([STRING, SERVICE]);
      injector.invalidate([Service, ServiceNoArgs]);
      injector.invalidate([STRING, ServiceNoArgs]);
    });

    it('rejects invalid parameters', () => {
      // @ts-expect-error - invalid parameter
      injector.invalidate(42);
      // @ts-expect-error - invalid parameter
      injector.invalidate(null);
      // @ts-expect-error - invalid parameter
      injector.invalidate('token');
      // @ts-expect-error - invalid parameter
      injector.invalidate(new Date());
      // @ts-expect-error - invalid parameter
      injector.invalidate([42, SERVICE]);
      // @ts-expect-error - invalid parameter
      injector.invalidate([STRING, null]);
      // @ts-expect-error - invalid parameter
      injector.invalidate(['token', Service]);
      // @ts-expect-error - invalid parameter
      injector.invalidate([new Date(), ServiceNoArgs]);
    });

    it('returns void', () => {
      const result: void = injector.invalidate();
      void result;
    });
  });

  describe('unregister()', () => {
    it('accepts no parameters', () => {
      injector.unregister();
    });

    it('accepts a single valid injection ID', () => {
      injector.unregister(STRING);
      injector.unregister(SERVICE);
      injector.unregister(Service);
      injector.unregister(ServiceNoArgs);
    });

    it('accepts an array of valid injection IDs', () => {
      injector.unregister([STRING, SERVICE]);
      injector.unregister([Service, ServiceNoArgs]);
      injector.unregister([STRING, ServiceNoArgs]);
    });

    it('rejects invalid parameters', () => {
      // @ts-expect-error - invalid parameter
      injector.unregister(42);
      // @ts-expect-error - invalid parameter
      injector.unregister(null);
      // @ts-expect-error - invalid parameter
      injector.unregister('token');
      // @ts-expect-error - invalid parameter
      injector.unregister(new Date());
      // @ts-expect-error - invalid parameter
      injector.unregister([42, SERVICE]);
      // @ts-expect-error - invalid parameter
      injector.unregister([STRING, null]);
      // @ts-expect-error - invalid parameter
      injector.unregister(['token', Service]);
      // @ts-expect-error - invalid parameter
      injector.unregister([new Date(), ServiceNoArgs]);
    });

    it('returns void', () => {
      const result: void = injector.unregister();
      void result;
    });
  });
});
