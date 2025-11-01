/** Type tests for container infrastructure. */

import {getContainer, install, uninstall} from '../container.js';

import {describe, it} from './ct_helper.js';

import type {Container, InstallMode} from '../container.js';
import type {Injector} from '../injector.js';

describe('Container interface', () => {
  it('has correct method signatures', () => {
    const mockContainer: Container = {
      getInjector: (): Injector => {
        return {} as unknown as Injector;
      },
      deleteInjector: (): void => {
        // Mock implementation
      },
    };
    void mockContainer;
  });

  it('getInjector returns Injector', () => {
    const mockContainer: Container = {
      getInjector: (): Injector => {
        return {} as unknown as Injector;
      },
      deleteInjector: (): void => {},
    };

    const injector: Injector = mockContainer.getInjector();
    void injector;
  });

  it('deleteInjector returns void', () => {
    const mockContainer: Container = {
      getInjector: (): Injector => {
        return {} as unknown as Injector;
      },
      deleteInjector: (): void => {},
    };

    const result: void = mockContainer.deleteInjector();
    void result;
  });

  it('rejects missing methods', () => {
    // @ts-expect-error - missing getInjector
    const missingGetInjector: Container = {
      deleteInjector: (): void => {},
    };

    // @ts-expect-error - missing deleteInjector
    const missingDeleteInjector: Container = {
      getInjector: (): Injector => {
        return {} as unknown as Injector;
      },
    };

    void missingGetInjector;
    void missingDeleteInjector;
  });

  it('rejects incorrect return types', () => {
    const wrongGetInjectorReturn: Container = {
      // @ts-expect-error - getInjector returns void instead of Injector
      getInjector: (): void => {},
      deleteInjector: (): void => {},
    };

    void wrongGetInjectorReturn;
  });
});

describe('install()', () => {
  const mockContainer: Container = {
    getInjector: (): Injector => {
      return {} as unknown as Injector;
    },
    deleteInjector: (): void => {},
  };

  it('accepts Container and InstallMode', () => {
    install(mockContainer, 'throw');
    install(mockContainer, 'override');
    install(mockContainer, 'stack');
  });

  it('mode parameter is optional', () => {
    install(mockContainer);
  });

  it('returns void', () => {
    const result: void = install(mockContainer);
    void result;
  });

  it('rejects non-Container types', () => {
    // @ts-expect-error - string not assignable to Container
    install('not a container');

    // @ts-expect-error - object with wrong shape not assignable to Container
    install({getInjector: 'wrong'});

    // @ts-expect-error - null not assignable to Container
    install(null);
  });

  it('rejects invalid InstallMode values', () => {
    // @ts-expect-error - invalid string not assignable to InstallMode
    install(mockContainer, 'invalid');

    // @ts-expect-error - number not assignable to InstallMode
    install(mockContainer, 42);
  });
});

describe('uninstall()', () => {
  it('accepts optional boolean parameter', () => {
    uninstall();
    uninstall(false);
    uninstall(true);
  });

  it('returns void', () => {
    const result: void = uninstall();
    const resultWithFalse: void = uninstall(false);
    const resultWithTrue: void = uninstall(true);
    void result;
    void resultWithFalse;
    void resultWithTrue;
  });

  it('rejects non-boolean parameters', () => {
    // @ts-expect-error - string not assignable to boolean
    uninstall('true');

    // @ts-expect-error - number not assignable to boolean
    uninstall(1);

    // @ts-expect-error - object not assignable to boolean
    uninstall({});
  });
});

describe('getContainer()', () => {
  it('returns Container | null', () => {
    const result: Container | null = getContainer();
    void result;
  });

  it('enforces return type', () => {
    // @ts-expect-error - Container | null not assignable to Container
    const wrongType: Container = getContainer();

    // @ts-expect-error - Container | null not assignable to null
    const wrongTypeNull: null = getContainer();

    void wrongType;
    void wrongTypeNull;
  });
});

describe('InstallMode type', () => {
  it('accepts valid string literals', () => {
    const throwMode: InstallMode = 'throw';
    const overrideMode: InstallMode = 'override';
    const stackMode: InstallMode = 'stack';

    void throwMode;
    void overrideMode;
    void stackMode;
  });

  it('invalid string values are not assignable to InstallMode', () => {
    // @ts-expect-error - invalid string not assignable to InstallMode
    const wrongMode: InstallMode = 'THROW';

    // @ts-expect-error - invalid string not assignable to InstallMode
    const wrongMode2: InstallMode = 'invalid';

    void wrongMode;
    void wrongMode2;
  });
});
