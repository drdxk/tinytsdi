import {Injector} from '../injector.js';
import {Service, describe, it} from './ct_helper';

describe('Injector constructor', () => {
  it('accepts no arguments', () => {
    const defaultInjector: Injector = new Injector();
    void defaultInjector;
  });

  it('accepts boolean argument for defaultAllowOverrides', () => {
    const explicitFalseInjector: Injector = new Injector(/* defaultAllowOverrides= */ false);
    const explicitTrueInjector: Injector = new Injector(/* defaultAllowOverrides= */ true);
    void explicitFalseInjector;
    void explicitTrueInjector;
  });

  it('rejects non-boolean arguments for defaultAllowOverrides', () => {
    // @ts-expect-error - string not assignable to boolean
    const invalidInjector: Injector = new Injector(/* defaultAllowOverrides= */ 'invalid');
    void invalidInjector;
  });

  it('accepts parent injector argument', () => {
    const parentInjector: Injector = new Injector();
    const childInjector: Injector = new Injector(/* defaultAllowOverrides= */ true, parentInjector);
    void childInjector;
  });

  it('rejects non-injector parent arguments', () => {
    const invalidChildInjector1: Injector = new Injector(
      /* defaultAllowOverrides= */ true,
      // @ts-expect-error - string not assignable to Injector
      'not an injector'
    );
    void invalidChildInjector1;

    const invalidChildInjector2: Injector = new Injector(
      /* defaultAllowOverrides= */ true,
      // @ts-expect-error - number not assignable to Injector
      Service
    );
    void invalidChildInjector2;
  });
});
