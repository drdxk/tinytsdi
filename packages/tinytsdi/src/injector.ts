/** Main Injector class for managing dependencies. */

import {TAG_ROOT, TAG_SINK} from './constants.js';
import {
  AlreadyProvidedError,
  NeverCachedError,
  NoMatchingTagError,
  NotProvidedError,
  UnknownProviderError,
} from './errors.js';
import {
  isClassProvider,
  isConstructorProvider,
  isExistingProvider,
  isFactoryProvider,
  isValueProvider,
} from './providers.js';
import {normalizeTag} from './types_internal.js';

import type {GenericProvider, Provider} from './providers.js';
import type {InjectionId, TagValue} from './types.js';
import type {GenericInjectionId, InjectorProvider} from './types_internal.js';

/** Configuration options for Injector instance. */
export interface InjectorOptions {
  /**
   * Whether to allow provider overrides by default when no explicit allowOverrides parameter is
   * provided. Defaults to false.
   */
  defaultAllowOverrides?: boolean;
  /** Parent injector. Defaults to null. */
  parent?: Injector | null;
  /**
   * Tag for this injector.
   *
   * - If not set (undefined), defaults to TAG_ROOT if no parent, null if has parent.
   * - If explicitly set (including null), uses the provided value.
   */
  tag?: TagValue | null;
}

/** Configuration options for copying an injector with Injector.copy(). */
export interface CopyOptions {
  /** Whether to copy the cache of resolved dependencies. Defaults to false. */
  copyCache?: boolean;
  /**
   * Whether to allow provider overrides by default in the new injector.
   *
   * - If not set (undefined), uses the current instance's defaultAllowOverrides setting.
   * - If explicitly set (true/false), uses the provided value.
   */
  defaultAllowOverrides?: boolean;
  /**
   * Parent injector for the new injector.
   *
   * - If not set (undefined), uses the current instance's parent.
   * - If explicitly set (including null), uses the provided value.
   */
  parent?: Injector | null;
  /**
   * Tag for the new injector.
   *
   * - If not set (undefined), uses the current instance's tag.
   * - If explicitly set (including null), uses the provided value.
   */
  tag?: TagValue | null;
}

/** Configuration options for forking an injector with Injector.fork(). */
export interface ForkOptions {
  /**
   * Whether to allow provider overrides by default in the child injector.
   *
   * - If not set (undefined), uses the current instance's defaultAllowOverrides setting.
   * - If explicitly set (true/false), uses the provided value.
   */
  defaultAllowOverrides?: boolean;
  /**
   * Tag for the child injector.
   *
   * - If not set (undefined), defaults to null (child injectors have no tag by default).
   * - If explicitly set (including null), uses the provided value.
   */
  tag?: TagValue | null;
}

/** Main dependency injection container that manages providers and resolved values. */
export class Injector {
  private parent: Injector | null;
  private tag: symbol | null;
  private defaultAllowOverrides: boolean;

  private providers = new Map<GenericInjectionId, InjectorProvider>();
  private cache = new Map<GenericInjectionId, unknown>();
  private boundInject = this.inject.bind(this);

  /** Whether to allow provider overrides by default. */

  /**
   * Creates a new Injector instance.
   *
   * @param options - Configuration options for the injector.
   */
  constructor(options?: InjectorOptions) {
    this.defaultAllowOverrides = options?.defaultAllowOverrides ?? false;
    this.parent = options?.parent ?? null;
    this.tag =
      options?.tag !== undefined ? normalizeTag(options.tag) : this.parent ? null : TAG_ROOT;
  }

  /** @returns The parent injector, or null if this is a root injector. */
  getParent(): Injector | null {
    return this.parent;
  }

  /** @returns The tag symbol of this injector, or null if no tag is set. */
  getTag(): symbol | null {
    return this.tag;
  }

  /**
   * Creates a child injector with the current injector as its parent.
   *
   * @param options - Configuration options for the child injector.
   * @returns A new Injector instance with the current injector as parent.
   */
  fork(options?: ForkOptions): Injector {
    const defaultAllowOverrides =
      options?.defaultAllowOverrides !== undefined
        ? options.defaultAllowOverrides
        : this.defaultAllowOverrides;
    const tag = options?.tag !== undefined ? options.tag : null;

    return new Injector({
      defaultAllowOverrides,
      parent: this,
      tag,
    });
  }

  /**
   * Creates a new Injector instance from the current one, copying all providers.
   *
   * @param options - Configuration options for copying the injector.
   * @returns A new Injector instance.
   */
  copy(options?: CopyOptions): Injector {
    const copyCache = options?.copyCache ?? false;
    const parent = options?.parent !== undefined ? options.parent : this.parent;
    const defaultAllowOverrides =
      options?.defaultAllowOverrides !== undefined
        ? options.defaultAllowOverrides
        : this.defaultAllowOverrides;
    const tag = options?.tag !== undefined ? options.tag : this.tag;

    const newInjector = new Injector({
      defaultAllowOverrides,
      parent,
      tag,
    });

    // Copy all providers
    for (const [id, provider] of this.providers) {
      newInjector.providers.set(id, provider);
    }

    // Copy cache if requested
    if (copyCache) {
      for (const [id, value] of this.cache) {
        newInjector.cache.set(id, value);
      }
    }

    return newInjector;
  }

  /**
   * Registers one or more providers with the injector.
   *
   * @param providerOrProviders - Single provider or array of providers to register.
   * @param allowOverrides - Whether to allow overriding existing providers. If undefined, uses
   *   defaultAllowOverrides.
   * @throws {@link AlreadyProvidedError} - When attempting to register a provider that already
   *   exists and allowOverrides is false.
   * @throws {@link UnknownProviderError} - When provider type is not supported.
   * @throws {@link NoMatchingTagError} - When provider has 'at' property but no matching tag is
   *   found in hierarchy.
   */
  register<T>(
    providerOrProviders: Provider<T> | GenericProvider[],
    allowOverrides?: boolean
  ): void {
    const providerArray = Array.isArray(providerOrProviders)
      ? providerOrProviders
      : [providerOrProviders];

    for (const provider of providerArray) {
      const injectorProvider = this.createInjectorProvider(provider);
      this.registerInternal(injectorProvider, allowOverrides);
    }
  }

  /**
   * Resolves a dependency by its injection ID.
   *
   * For cached providers, returns the same instance on subsequent calls. For noCache providers,
   * creates a new instance on each call. For value providers, returns the registered value. For
   * existing providers (aliases), delegates to the target provider.
   *
   * @param id - Token or constructor to resolve.
   * @param defaultValue - Value to return if provider is not found.
   * @returns The resolved dependency instance.
   * @throws {@link NotProvidedError} - When no provider is registered for the ID and no default
   *   value is provided.
   */
  inject<T>(id: InjectionId<T>, defaultValue?: T): T {
    const provider = this.providers.get(id);

    if (!provider) {
      // Check parent injector if provider not found locally
      if (this.parent) {
        return this.parent.inject(id, defaultValue);
      }

      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new NotProvidedError(id);
    }

    // Check cache first - if cached, assume it's singleton
    if (this.cache.has(id)) {
      return this.cache.get(id) as T;
    }

    // Resolve the provider
    const instance = provider.resolve();

    // Cache if singleton
    if (provider.cache) {
      this.cache.set(id, instance);
    }

    return instance as T;
  }

  /**
   * Checks if the injector has a provider registered for the given injection ID.
   *
   * @param id - The injection ID to check for.
   * @returns True if a provider is registered for the given ID, false otherwise.
   */
  hasProviderFor(id: GenericInjectionId): boolean {
    return this.providers.has(id);
  }

  /**
   * Checks if the injector has a cached value for the given injection ID.
   *
   * @param id - The injection ID to check for cached value.
   * @returns True if a cached value exists for the given ID, false otherwise.
   * @throws {@link NotProvidedError} - When no provider is registered for the given ID.
   * @throws {@link NeverCachedError} - When checking cache status of a noCache provider.
   */
  hasCachedValue(id: GenericInjectionId): boolean {
    const provider = this.providers.get(id);

    if (!provider) {
      throw new NotProvidedError(id);
    }

    // Throw error if provider is never cached, i.e. noCache: true.
    if (!provider.cache) {
      throw new NeverCachedError(id);
    }

    return this.cache.has(id);
  }

  /**
   * Clears the cache of resolved dependencies, but keeps the providers registered.
   *
   * @param ids - Single ID, array of IDs, or undefined to clear all cache.
   * @throws {@link NotProvidedError} - When any of the provided IDs is not registered.
   * @throws {@link NeverCachedError} - When trying to invalidate a provider that is never cached.
   */
  invalidate(ids?: GenericInjectionId | GenericInjectionId[]): void {
    if (ids === undefined) {
      // Clear all cache
      this.cache.clear();
      return;
    }

    const idArray = Array.isArray(ids) ? ids : [ids];

    for (const id of idArray) {
      const provider = this.providers.get(id);

      if (!provider) {
        throw new NotProvidedError(id);
      }

      // Throw error if provider is never cached.
      if (!provider.cache) {
        throw new NeverCachedError(id);
      }

      // Remove from cache if it exists
      this.cache.delete(id);
    }
  }

  /**
   * Unregisters providers for the given IDs and removes any cached values.
   *
   * @param ids - Single ID, array of IDs, or undefined to unregister all providers.
   * @throws {@link NotProvidedError} - When any of the provided IDs is not registered.
   */
  unregister(ids?: GenericInjectionId | GenericInjectionId[]): void {
    if (ids === undefined) {
      // Reset the injector - remove all providers and cache
      this.providers.clear();
      this.cache.clear();
      return;
    }

    const idArray = Array.isArray(ids) ? ids : [ids];

    for (const id of idArray) {
      if (!this.providers.has(id)) {
        throw new NotProvidedError(id);
      }

      // Remove provider and any cached value
      this.providers.delete(id);
      this.cache.delete(id);
    }
  }

  /**
   * Creates an internal provider wrapper for the given provider configuration.
   *
   * @param provider - External provider configuration.
   * @returns Internal provider wrapper.
   * @throws {@link UnknownProviderError} - When provider type is not supported.
   */
  private createInjectorProvider(provider: GenericProvider): InjectorProvider {
    if (isConstructorProvider(provider)) {
      return {
        id: provider,
        cache: true,
        resolve: () => new provider(this.boundInject),
        at: null,
      };
    }

    if (isValueProvider(provider)) {
      return {
        id: provider.provide,
        cache: false, // Value providers are never cached
        resolve: () => provider.useValue,
        at: normalizeTag(provider.at),
      };
    }

    if (isClassProvider(provider)) {
      return {
        id: provider.provide,
        cache: !provider.noCache,
        resolve: () => {
          // Pass inject function only if injectFn is explicitly true
          if (provider.injectFn === true) {
            return new provider.useClass(this.boundInject);
          } else {
            return new provider.useClass();
          }
        },
        at: normalizeTag(provider.at),
      };
    }

    if (isFactoryProvider(provider)) {
      return {
        id: provider.provide,
        cache: !provider.noCache,
        resolve: () => provider.useFactory(this.boundInject),
        at: normalizeTag(provider.at),
      };
    }

    if (isExistingProvider(provider)) {
      return {
        id: provider.provide,
        cache: false, // Existing providers delegate to the target provider's caching
        resolve: () => this.inject(provider.useExisting),
        at: normalizeTag(provider.at),
      };
    }

    throw new UnknownProviderError(provider);
  }

  /**
   * Register an injector provider with the current injector or delegates to parent depending on
   * provider targeting.
   *
   * @param injectorProvider - The internal provider wrapper to register.
   * @param allowOverrides - Whether to allow overriding existing providers.
   * @throws {@link AlreadyProvidedError} - When attempting to register a provider that already
   *   exists and allowOverrides is false.
   * @throws {@link NoMatchingTagError} - When provider has 'at' property but no matching tag is
   *   found in hierarchy.
   */
  private registerInternal(
    injectorProvider: InjectorProvider,
    allowOverrides: boolean | undefined
  ): void {
    // Check if provider is targeting a different injector
    if (injectorProvider.at && this.tag !== TAG_SINK && this.tag !== injectorProvider.at) {
      // Provider is targetting a different injector and current injector is not a sink
      if (this.parent) {
        // Delegate to parent
        return this.parent.registerInternal(injectorProvider, allowOverrides);
      }
      // No matching injector found
      throw new NoMatchingTagError(injectorProvider.at);
    }

    if (this.providers.has(injectorProvider.id)) {
      // Provider already exists, check if overrides are allowed
      const throwOnOverride = !(allowOverrides ?? this.defaultAllowOverrides);
      if (throwOnOverride) {
        throw new AlreadyProvidedError(injectorProvider.id);
      }
      // Clear cache when overriding
      this.cache.delete(injectorProvider.id);
    }

    this.providers.set(injectorProvider.id, injectorProvider);
  }
}
