import {inject, register} from '../global';
import {Injector} from '../injector';
import {InjectFn} from '../types';

import {describe, it} from './ct_helper';

describe('default global container', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const injector = new Injector();

  it('inject() has the same type as Injector.inject', () => {
    type InjectorInjectFn = typeof injector.inject;
    const injectorInjectFn: InjectorInjectFn = inject;
    void injectorInjectFn;
  });

  it('inject() has the same type as InjectFn', () => {
    const globalInjectFn: InjectFn = inject;
    void globalInjectFn;
  });

  describe('register() has the same type as Injector.register', () => {
    type RegisterFn = typeof injector.register;
    const registerFn: RegisterFn = register;
    void registerFn;
  });
});
