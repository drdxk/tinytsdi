import type {InjectionId, TagValue} from './types';

/** Generic injection ID for internal use */
export type GenericInjectionId = InjectionId<unknown>;

/** Internal provider wrapper that provides a uniform interface for all provider types. */
export interface InjectorProvider {
  /** The injection identifier (token or constructor). */
  id: GenericInjectionId;

  /** Whether the resolved value should be cached. */
  cache: boolean;

  /** Function that creates/returns the provider's value. */
  resolve: () => unknown;

  /** Target tag for this provider (normalized symbol or null). */
  at: symbol | null;
}

/** Normalizes a tag value to a symbol or null. */
export function normalizeTag(tag: TagValue | null | undefined): symbol | null {
  if (!tag) return null;
  return typeof tag === 'string' ? Symbol.for(tag) : tag;
}
