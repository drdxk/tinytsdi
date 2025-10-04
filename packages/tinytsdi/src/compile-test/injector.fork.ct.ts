import {Injector} from '../injector';

import {describe, it} from './ct_helper';

describe('Injector.fork()', () => {
  const injector = new Injector();

  it('returns Injector type', () => {
    const child: Injector = injector.fork();
    void child;
  });

  it('accepts valid values for defaultAllowOverrides option', () => {
    const allowOverrides: Injector = injector.fork({defaultAllowOverrides: true});
    const disallowOverrides: Injector = injector.fork({defaultAllowOverrides: false});
    void allowOverrides;
    void disallowOverrides;
  });

  it('rejects invalid values for defaultAllowOverrides option', () => {
    injector.fork(
      // @ts-expect-error - defaultAllowOverrides must be boolean
      {defaultAllowOverrides: 'true'}
    );
    injector.fork(
      // @ts-expect-error - defaultAllowOverrides must be boolean
      {defaultAllowOverrides: 123}
    );
  });

  it('accepts valid values for tag option', () => {
    const withStringTag: Injector = injector.fork({tag: 'test'});
    const withSymbolTag: Injector = injector.fork({tag: Symbol('test')});
    const withNullTag: Injector = injector.fork({tag: null});
    void withStringTag;
    void withSymbolTag;
    void withNullTag;
  });

  it('rejects invalid values for tag option', () => {
    injector.fork(
      // @ts-expect-error - tag must be TagValue or null
      {tag: 42}
    );
    injector.fork(
      // @ts-expect-error - tag must be TagValue or null
      {tag: {}}
    );
    injector.fork(
      // @ts-expect-error - tag must be TagValue or null
      {tag: []}
    );
  });

  it('accepts all options together', () => {
    const child: Injector = injector.fork({
      defaultAllowOverrides: true,
      tag: 'test',
    });
    void child;
  });
});
