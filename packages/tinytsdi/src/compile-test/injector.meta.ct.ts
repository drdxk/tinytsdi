import {Injector} from '../injector';

import {SERVICE, STRING, Service, ServiceNoArgs, describe, it} from './ct_helper';

describe('Injector meta methods', () => {
  const injector = new Injector();

  describe('getTag()', () => {
    it('returns symbol or null', () => {
      const tag: symbol | null = injector.getTag();
      void tag;
    });
  });

  describe('getParent()', () => {
    it('returns Injector or null', () => {
      const parent: Injector | null = injector.getParent();
      void parent;
    });
  });

  describe('copy()', () => {
    it('returns Injector type', () => {
      const newInjector: Injector = injector.copy();
      void newInjector;
    });

    it('accepts valid values for copyCache option', () => {
      const newInjectorWithCache: Injector = injector.copy({copyCache: true});
      const newInjectorWithoutCache: Injector = injector.copy({copyCache: false});
      void newInjectorWithCache;
      void newInjectorWithoutCache;
    });

    it('rejects invalid values for copyCache option', () => {
      injector.copy(
        // @ts-expect-error - copyCache must be boolean
        {copyCache: 'true'}
      );
      injector.copy(
        // @ts-expect-error - copyCache must be boolean
        {copyCache: 123}
      );
    });

    it('accepts valid values for parent option', () => {
      const withParent: Injector = injector.copy({parent: new Injector()});
      const withoutParent: Injector = injector.copy({parent: null});
      void withParent;
      void withoutParent;
    });

    it('rejects invalid values for parent option', () => {
      injector.copy(
        // @ts-expect-error - parent must be Injector or null
        {parent: 'true'}
      );
      injector.copy(
        // @ts-expect-error - parent must be Injector or null
        {parent: 123}
      );
      injector.copy(
        // @ts-expect-error - parent must be Injector or null
        {parent: {}}
      );
    });

    it('accepts valid values for defaultAllowOverrides option', () => {
      const allowOverrides: Injector = injector.copy({defaultAllowOverrides: true});
      const disallowOverrides: Injector = injector.copy({defaultAllowOverrides: false});
      void allowOverrides;
      void disallowOverrides;
    });

    it('rejects invalid values for defaultAllowOverrides option', () => {
      injector.copy(
        // @ts-expect-error - defaultAllowOverrides must be boolean
        {defaultAllowOverrides: 'true'}
      );
      injector.copy(
        // @ts-expect-error - defaultAllowOverrides must be boolean
        {defaultAllowOverrides: 123}
      );
    });

    it('accepts all options together', () => {
      const newInjector: Injector = injector.copy({
        copyCache: true,
        parent: null,
        defaultAllowOverrides: true,
      });
      void newInjector;
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
