import {Injector} from '../injector.js';
import {Service, describe, it} from './ct_helper';

describe('Injector constructor', () => {
  it('accepts no arguments', () => {
    const defaultInjector: Injector = new Injector();
    void defaultInjector;
  });

  it('accepts empty options object', () => {
    const emptyOptionsInjector: Injector = new Injector({});
    void emptyOptionsInjector;
  });

  it('accepts options with defaultAllowOverrides', () => {
    const explicitFalseInjector: Injector = new Injector({defaultAllowOverrides: false});
    const explicitTrueInjector: Injector = new Injector({defaultAllowOverrides: true});
    void explicitFalseInjector;
    void explicitTrueInjector;
  });

  it('rejects non-boolean values for defaultAllowOverrides', () => {
    // @ts-expect-error - string not assignable to boolean
    const invalidInjector1: Injector = new Injector({defaultAllowOverrides: 'invalid'});
    void invalidInjector1;

    // @ts-expect-error - number not assignable to boolean
    const invalidInjector2: Injector = new Injector({defaultAllowOverrides: 42});
    void invalidInjector2;
  });

  it('accepts options with parent injector', () => {
    const parentInjector: Injector = new Injector();
    const childInjector: Injector = new Injector({parent: parentInjector});
    void childInjector;
  });

  it('accepts options with null parent', () => {
    const injector: Injector = new Injector({parent: null});
    void injector;
  });

  it('rejects non-injector parent values', () => {
    // @ts-expect-error - string not assignable to Injector
    const invalidChildInjector1: Injector = new Injector({parent: 'not an injector'});
    void invalidChildInjector1;

    // @ts-expect-error - Service constructor not assignable to Injector
    const invalidChildInjector2: Injector = new Injector({parent: Service});
    void invalidChildInjector2;
  });

  it('accepts options with both defaultAllowOverrides and parent', () => {
    const parentInjector: Injector = new Injector();
    const childInjector: Injector = new Injector({
      defaultAllowOverrides: true,
      parent: parentInjector,
    });
    void childInjector;
  });

  it('rejects unknown properties in options', () => {
    // @ts-expect-error - unknown property not allowed
    const invalidInjector: Injector = new Injector({unknownProperty: 'value'});
    void invalidInjector;
  });

  it('rejects primitive values as options', () => {
    // @ts-expect-error - boolean not assignable to InjectorOptions
    const invalidInjector1: Injector = new Injector(true);
    void invalidInjector1;

    // @ts-expect-error - string not assignable to InjectorOptions
    const invalidInjector2: Injector = new Injector('invalid');
    void invalidInjector2;
  });
});
