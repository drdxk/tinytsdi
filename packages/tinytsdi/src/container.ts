/** DI containers infrastructure. */

import {ContainerAlreadyInstalledError} from './errors.js';

import type {Injector} from './injector.js';

/**
 * Interface that containers must implement. Container's getInjector() will be called by global
 * inject() and register() functions. Container's deleteInjector() will be called by global
 * deleteInjector() function. Containers are installed via install() function and managed via
 * uninstall() function. Containers can implement any additional functionality as needed.
 *
 * Best practice:
 *
 * - Container should provide a function that configures and installs the container (e.g.
 *   `initMyContainer(options)`)
 */
export interface Container {
  /**
   * Get the current injector managed by this container. Called by global inject() and register()
   * functions.
   */
  getInjector(this: void): Injector;

  /** Delete the injector managed by this container. Called by global deleteInjector() function. */
  deleteInjector(this: void): void;
}

/**
 * Mode for installing containers.
 *
 * - `'throw'` - Throw an error if a container is already installed.
 * - `'override'` - Override/replace the currently installed container.
 * - `'stack'` - Stack the new container on top of existing containers. Useful for testing containers.
 */
export type InstallMode = 'throw' | 'override' | 'stack';

/** Module-level stack of installed containers */
const stack: Container[] = [];

/** Get the currently active container (top of stack). Returns null if no container is installed. */
export function getContainer(): Container | null {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return stack.length ? stack[stack.length - 1]! : null;
}

/**
 * Install a container to handle global inject() and register() calls.
 *
 * @param container - The container to install.
 * @param mode - Installation mode (default: 'throw').
 * @throws {@link ContainerAlreadyInstalledError} If mode is 'throw' and a container is already
 *   installed.
 */
export function install(container: Container, mode: InstallMode = 'throw'): void {
  if (mode === 'throw' && stack.length) {
    throw new ContainerAlreadyInstalledError();
  }

  if (mode === 'override' && stack.length) {
    stack.pop();
  }

  stack.push(container);
}

/**
 * Uninstall the currently active container. No-op if no container is installed.
 *
 * @param all - If true, clear the entire stack. If false (default), remove only the top container.
 */
export function uninstall(all: boolean = false): void {
  if (all) {
    stack.length = 0;
  } else if (stack.length) {
    stack.pop();
  }
}
