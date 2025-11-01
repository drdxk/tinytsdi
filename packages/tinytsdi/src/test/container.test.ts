import {beforeEach, describe, expect, it} from 'vitest';

import {Container, getContainer, install, uninstall} from '../container.js';
import {ContainerAlreadyInstalledError} from '../errors.js';
import {Injector} from '../injector.js';

function createMockContainer(): Container {
  const injector = new Injector();
  return {
    getInjector: () => injector,
    deleteInjector: () => {},
  };
}

describe('Container infrastructure', () => {
  beforeEach(() => {
    // Clear any installed containers.
    uninstall(/* all = */ true);
  });

  describe('getContainer()', () => {
    it('returns null when no container is installed', () => {
      expect(getContainer()).toBeNull();
    });

    it('returns the most recently installed container', () => {
      const container = createMockContainer();
      install(container);
      expect(getContainer()).toBe(container);
    });

    it('returns top of stack with multiple containers', () => {
      const container1 = createMockContainer();
      const container2 = createMockContainer();

      install(container1);
      install(container2, 'stack');

      expect(getContainer()).toBe(container2);
    });
  });

  describe('install() / uninstall()', () => {
    describe('THROW mode', () => {
      it('throws ContainerAlreadyInstalledError when container already installed', () => {
        const container1 = createMockContainer();
        const container2 = createMockContainer();

        install(container1, 'throw');

        expect(() => install(container2, 'throw')).toThrow(ContainerAlreadyInstalledError);

        // Original container unchanged
        expect(getContainer()).toBe(container1);

        // Verify single container on the stack.
        uninstall();
        expect(getContainer()).toBeNull();
      });
    });

    describe('OVERRIDE mode', () => {
      it('installs successfully when stack is empty', () => {
        const container = createMockContainer();
        install(container, 'override');
        expect(getContainer()).toBe(container);
      });

      it('replaces existing containers', () => {
        const container1 = createMockContainer();
        const container2 = createMockContainer();
        const container3 = createMockContainer();

        install(container1);
        install(container2, 'override');
        install(container3, 'override');

        expect(getContainer()).toBe(container3);

        // Verify it's just a single container on the stack.
        uninstall();
        expect(getContainer()).toBeNull();
      });
    });

    describe('STACK mode', () => {
      it('installs successfully when stack is empty', () => {
        const container = createMockContainer();
        install(container, 'stack');
        expect(getContainer()).toBe(container);
      });

      it('stacks container on top of existing', () => {
        const container1 = createMockContainer();
        const container2 = createMockContainer();
        const container3 = createMockContainer();

        install(container1);
        install(container2, 'stack');
        install(container3, 'stack');

        expect(getContainer()).toBe(container3);

        // Verify all containers are on the stack.
        uninstall();
        expect(getContainer()).toBe(container2);
        uninstall();
        expect(getContainer()).toBe(container1);
        uninstall();
        expect(getContainer()).toBeNull();
      });
    });

    describe('defaults', () => {
      it('install() defaults to THROW mode', () => {
        const container1 = createMockContainer();
        const container2 = createMockContainer();

        install(container1);
        expect(() => install(container2)).toThrow(ContainerAlreadyInstalledError);
      });

      it('uninstall() is no-op when stack is empty', () => {
        expect(() => uninstall()).not.toThrow();
        expect(getContainer()).toBeNull();
      });
    });
  });

  describe('uninstall(true) - clear all', () => {
    it('clears entire stack', () => {
      const container1 = createMockContainer();
      const container2 = createMockContainer();
      const container3 = createMockContainer();

      install(container1);
      install(container2, 'stack');
      install(container3, 'stack');

      uninstall(true);
      expect(getContainer()).toBeNull();
    });

    it('works when stack is empty (no-op)', () => {
      expect(() => uninstall(true)).not.toThrow();
      expect(getContainer()).toBeNull();
    });

    it('clears single container', () => {
      const container = createMockContainer();
      install(container);

      uninstall(true);
      expect(getContainer()).toBeNull();
    });
  });

  describe('container methods', () => {
    function createTrackingContainer() {
      const injector = new Injector();
      const calls = {
        getInjector: 0,
        deleteInjector: 0,
      };

      const container: Container = {
        getInjector: () => {
          calls.getInjector++;
          return injector;
        },
        deleteInjector: () => {
          calls.deleteInjector++;
        },
      };

      return {container, calls};
    }

    it('container methods are identical to those on the installed container', () => {
      const {container} = createTrackingContainer();
      install(container);

      const retrieved = getContainer();
      expect(retrieved).toBe(container);

      // Verify methods exist and are callable
      expect(typeof retrieved?.getInjector).toBe('function');
      expect(typeof retrieved?.deleteInjector).toBe('function');
      expect(retrieved?.getInjector).toBe(container.getInjector);
      expect(retrieved?.deleteInjector).toBe(container.deleteInjector);
    });

    it('getInjector is callable', () => {
      const {container, calls} = createTrackingContainer();
      install(container);

      const retrieved = getContainer();
      const injector = retrieved?.getInjector();

      expect(injector).toBeInstanceOf(Injector);
      expect(calls.getInjector).toBe(1);

      retrieved?.getInjector();
      expect(calls.getInjector).toBe(2);
    });

    it('deleteInjector is callable', () => {
      const {container, calls} = createTrackingContainer();
      install(container);

      const retrieved = getContainer();
      retrieved?.deleteInjector();

      expect(calls.deleteInjector).toBe(1);

      retrieved?.deleteInjector();
      expect(calls.deleteInjector).toBe(2);
    });
  });
});
