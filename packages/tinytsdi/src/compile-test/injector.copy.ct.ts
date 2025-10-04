import {Injector} from '../injector';

import {describe, it} from './ct_helper';

describe('Injector.copy()', () => {
  const injector = new Injector();

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

  it('accepts valid values for tag option', () => {
    const withStringTag: Injector = injector.copy({tag: 'test'});
    const withSymbolTag: Injector = injector.copy({tag: Symbol('test')});
    const withNullTag: Injector = injector.copy({tag: null});
    void withStringTag;
    void withSymbolTag;
    void withNullTag;
  });

  it('rejects invalid values for tag option', () => {
    injector.copy(
      // @ts-expect-error - tag must be TagValue or null
      {tag: 42}
    );
    injector.copy(
      // @ts-expect-error - tag must be TagValue or null
      {tag: {}}
    );
    injector.copy(
      // @ts-expect-error - tag must be TagValue or null
      {tag: []}
    );
  });

  it('accepts all options together', () => {
    const newInjector: Injector = injector.copy({
      copyCache: true,
      parent: null,
      defaultAllowOverrides: true,
      tag: 'test',
    });
    void newInjector;
  });
});
