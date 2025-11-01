import {
  Container,
  ContainerAlreadyInstalledError,
  Injector,
  Token,
  deleteInjector,
  getContainer,
  getInjector,
  inject,
  install,
  register,
  uninstall,
} from 'tinytsdi';
import {beforeEach, describe, expect, it} from 'vitest';

function createMockContainer() {
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

  return {
    container,
    injector,
    calls,
  };
}

describe('Containers', () => {
  beforeEach(() => {
    // Clean up all installed containers
    uninstall(/* all= */ true);
    deleteInjector();
  });

  describe('basic functionality', () => {
    it('register() and inject() are routed to container', () => {
      const {container, injector, calls} = createMockContainer();
      install(container);

      expect(getContainer()).toBe(container);
      expect(getInjector()).toBe(injector);

      const token = new Token<string>('test-token');
      register({provide: token, useValue: 'custom-value'});

      expect(calls.getInjector).toBe(2);
      expect(inject(token)).toBe('custom-value');
    });

    it('deleteInjector() calls are routed to container', () => {
      const {container, calls} = createMockContainer();
      install(container);
      deleteInjector();

      expect(calls.deleteInjector).toBe(1);
    });

    it('uninstall() removes the installed container and defaults to default container', () => {
      const token = new Token<string>('test-token');
      register({provide: token, useValue: 'global-value'});

      const {container} = createMockContainer();
      install(container);

      expect(inject(token, 'default')).toBe('default');

      uninstall();

      expect(inject(token)).toBe('global-value');
    });
  });

  describe('getContainer()', () => {
    it('returns null when no container is installed', () => {
      expect(getContainer()).toBeNull();
    });

    it('returns the most recently installed container', () => {
      const {container} = createMockContainer();
      install(container);
      expect(getContainer()).toBe(container);
    });

    it('returns top of stack with multiple containers', () => {
      const {container: container1} = createMockContainer();
      const {container: container2} = createMockContainer();

      install(container1);
      install(container2, 'stack');

      expect(getContainer()).toBe(container2);
    });
  });

  describe('install() / uninstall()', () => {
    describe('THROW mode', () => {
      it('throws ContainerAlreadyInstalledError when container already installed', () => {
        const {container: container1} = createMockContainer();
        const {container: container2} = createMockContainer();

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
        const {container} = createMockContainer();
        install(container, 'override');
        expect(getContainer()).toBe(container);
      });

      it('replaces existing containers', () => {
        const {container: container1} = createMockContainer();
        const {container: container2} = createMockContainer();
        const {container: container3} = createMockContainer();

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
        const {container} = createMockContainer();
        install(container, 'stack');
        expect(getContainer()).toBe(container);
      });

      it('stacks container on top of existing', () => {
        const {container: container1} = createMockContainer();
        const {container: container2} = createMockContainer();
        const {container: container3} = createMockContainer();

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
        const {container: container1} = createMockContainer();
        const {container: container2} = createMockContainer();

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
      const {container: container1} = createMockContainer();
      const {container: container2} = createMockContainer();
      const {container: container3} = createMockContainer();

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
      const {container} = createMockContainer();
      install(container);

      uninstall(true);
      expect(getContainer()).toBeNull();
    });
  });
});
