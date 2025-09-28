/** Error classes for tinytsdi */

import {Token} from './types.js';

import type {GenericInjectionId} from './types.js';

/** Error thrown when attempting to register a provider that already exists */
export class AlreadyProvidedError extends Error {
  constructor(id: GenericInjectionId) {
    super(`Provider already registered for ${formatInjectionId(id)}`);
    this.name = 'AlreadyProvidedError';
  }
}

/** Error thrown when attempting to inject a dependency that has no provider */
export class NotProvidedError extends Error {
  constructor(id: GenericInjectionId) {
    super(`No provider registered for ${formatInjectionId(id)}`);
    this.name = 'NotProvidedError';
  }
}

/** Error thrown when checking cache status of a noCache provider */
export class NeverCachedError extends Error {
  constructor(id: GenericInjectionId) {
    super(`Provider for ${formatInjectionId(id)} is transient and never cached`);
    this.name = 'NeverCachedError';
  }
}

/** Error thrown when attempting to register an unknown/unsupported provider type */
export class UnknownProviderError extends Error {
  constructor(provider: unknown) {
    super(`Unknown or unsupported provider type: ${typeof provider}`);
    this.name = 'UnknownProviderError';
  }
}

/** Error thrown when attempting to initialize tinytsdi more than once */
export class AlreadyInitializedError extends Error {
  constructor() {
    super('Container has already been initialized. init() can only be called once');
    this.name = 'AlreadyInitializedError';
  }
}

/** Error thrown when test injector functions are called but disabled via configuration */
export class TestInjectorNotAllowedError extends Error {
  constructor() {
    super('Test injector functions are disabled via noTestInjector configuration');
    this.name = 'TestInjectorNotAllowedError';
  }
}

/** Error thrown when no injector with matching tag is found in the hierarchy */
export class NoMatchingTagError extends Error {
  constructor(tag: symbol) {
    super(`No injector with tag ${tag.toString()} found in the hierarchy`);
    this.name = 'NoMatchingTagError';
  }
}

function formatInjectionId(id: GenericInjectionId): string {
  if (id instanceof Token) {
    return id.toString();
  }
  if (typeof id === 'function' && id.name) {
    return `class ${id.name}`;
  }
  return 'unknown provider';
}
