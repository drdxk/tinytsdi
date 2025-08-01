/**
 * Global API functions for dependency injection using a module-level singleton injector.
 */

import {AlreadyInitializedError, TestInjectorNotAllowedError} from './errors.js';
import {Injector} from './injector.js';

import type {GenericProvider, Provider} from './providers.js';
import type {InjectionId} from './types.js';

/** Configuration options for TSDI initialization. */
export interface Config {
  /** Default value for allowOverrides when creating the global injector. */
  defaultAllowOverrides?: boolean;
  /** Whether test injector functions are disabled. */
  noTestInjector?: boolean;
}

/** Module-level injector instance, created lazily on first access. */
let injector: Injector | undefined;
/** Test injector instance, when set overrides the global injector. */
let testInjector: Injector | undefined;
/** Configuration object, set once via init(). */
let config: Config | undefined;

/**
 * Initializes TSDI with configuration options.
 *
 * Can only be called once. Subsequent calls will throw AlreadyInitializedError.
 *
 * @param options - Configuration options for TSDI.
 * @throws {@link AlreadyInitializedError} When init() has already been called.
 */
export function init(options: Partial<Config> = {}): void {
  if (config !== undefined) {
    throw new AlreadyInitializedError();
  }
  config = {
    defaultAllowOverrides: false,
    noTestInjector: false,
    ...options,
  };
}

/**
 * Returns the current injector instance (test injector if set, otherwise global injector).
 *
 * The injector is created with settings from init() if called, otherwise defaults.
 * Multiple calls return the same instance unless deleteInjector() has been called.
 *
 * @returns The current injector instance.
 */
export function getInjector(): Injector {
  // Return test injector if one is set
  if (testInjector) {
    return testInjector;
  }

  if (!injector) {
    const defaultAllowOverrides = config?.defaultAllowOverrides ?? false;
    injector = new Injector(defaultAllowOverrides);
  }
  return injector;
}

/**
 * Deletes the current global injector instance.
 *
 * The next call to getInjector(), register(), or inject() will create a new injector.
 * This is primarily useful for testing to reset the global state between tests.
 *
 * @example
 * ```typescript
 * // In test setup
 * beforeEach(() => {
 *   deleteInjector(); // Start with clean injector for each test
 * });
 * ```
 */
export function deleteInjector(): void {
  injector = undefined;
}

/**
 * Registers one or more providers with the global injector.
 *
 * Supports all provider types:
 * - Value providers: `{provide: token, useValue: value}`
 * - Class providers: `{provide: token, useClass: SomeClass, scope: 'singleton'|'transient'}`
 * - Factory providers: `{provide: token, useFactory: (inject) => value, scope: 'singleton'|'transient'}`
 * - Existing providers: `{provide: token, useExisting: otherToken}` (aliases)
 * - Constructor shorthand: `SomeClass` (equivalent to singleton class provider)
 *
 * @param providerOrProviders - Single provider or array of providers to register.
 * @param allowOverrides - Whether to allow overriding existing providers. If undefined, uses injector's default (false).
 * @throws {@link AlreadyProvidedError} - When attempting to register a provider that already exists and allowOverrides is false.
 * @throws {@link UnknownProviderError} - When provider type is not supported.
 *
 * @example
 * ```typescript
 * // Register a value
 * register({provide: myToken, useValue: 'hello'});
 *
 * // Register multiple providers
 * register([
 *   {provide: stringToken, useValue: 'test'},
 *   {provide: numberToken, useValue: 42}
 * ]);
 *
 * // Register a class with constructor shorthand
 * register(MyService);
 * ```
 */
export function register<T>(
  providerOrProviders: Provider<T> | GenericProvider[],
  allowOverrides?: boolean
): void {
  getInjector().register(providerOrProviders, allowOverrides);
}

/**
 * Resolves a dependency from the global injector.
 *
 * For singleton providers, returns the same instance on subsequent calls.
 * For transient providers, creates a new instance on each call.
 * For value providers, returns the registered value.
 * For existing providers (aliases), delegates to the target provider.
 *
 * @param id - Token or constructor to resolve
 * @param defaultValue - Value to return if provider is not found
 * @returns The resolved dependency instance
 * @throws {@link NotProvidedError} - When no provider is registered for the ID and no default value is provided
 *
 * @example
 * ```typescript
 * // Inject with a token
 * const config = inject(configToken);
 *
 * // Inject with default value
 * const optional = inject(optionalToken, 'default');
 *
 * // Inject a class
 * const service = inject(MyService);
 * ```
 */
export function inject<T>(id: InjectionId<T>, defaultValue?: T): T {
  return getInjector().inject(id, defaultValue);
}

/**
 * Checks if test injector functions are disabled.
 *
 * @throws {@link TestInjectorNotAllowedError} - When test injector functions are disabled via noTestInjector config.
 */
function checkTestInjectorAllowed(): void {
  if (config?.noTestInjector) {
    throw new TestInjectorNotAllowedError();
  }
}

/**
 * Creates a new test injector, optionally copying from the current global injector.
 *
 * @param fromCurrent - Whether to copy providers from the current global injector (not test injector).
 * @param allowOverrides - Whether the new test injector should allow provider overrides by default.
 * @returns A new injector instance to be used for testing.
 * @throws {@link TestInjectorNotAllowedError} - When test injector functions are disabled.
 */
export function newTestInjector(
  fromCurrent: boolean = false,
  allowOverrides: boolean = false
): Injector {
  checkTestInjectorAllowed();

  let testInjector: Injector;
  if (fromCurrent && injector) {
    // Always copy from the global injector, not the test injector
    testInjector = Injector.from(injector, false);
    testInjector.defaultAllowOverrides = allowOverrides;
  } else {
    testInjector = new Injector(allowOverrides);
  }
  setTestInjector(testInjector);
  return testInjector;
}

/**
 * Sets a custom test injector to override the global injector.
 *
 * @param injectorInstance - The injector instance to use as the test injector.
 * @returns The provided injector instance for convenience.
 * @throws {@link TestInjectorNotAllowedError} - When test injector functions are disabled.
 */
export function setTestInjector(injectorInstance: Injector): Injector {
  checkTestInjectorAllowed();
  testInjector = injectorInstance;
  return injectorInstance;
}

/**
 * Removes the current test injector, restoring the global injector.
 *
 * @throws {@link TestInjectorNotAllowedError} - When test injector functions are disabled.
 */
export function removeTestInjector(): void {
  checkTestInjectorAllowed();
  testInjector = undefined;
}

/**
 * Resets the init state for testing purposes only.
 *
 * This function is intended only for internal testing and should not be used in production code.
 * It allows tests to call init() multiple times by resetting the configuration state.
 */
export function resetInitForTestOnly(): void {
  config = undefined;
}
