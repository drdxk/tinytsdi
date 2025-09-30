/** Core type definitions for TSDI */

/**
 * Tag for the root injector, automatically added for any injector without parent that doesn't
 * explicitly specify one.
 */
export const TAG_ROOT = Symbol.for('root');

/**
 * Tag for the "sink" injector. Sink injector ignores `at` property of providers and registers all
 * incoming providers.
 */
export const TAG_SINK = Symbol.for('sink');

/** Valid tag value types */
export type TagValue = string | symbol;

/** Constructor type that can be used as InjectionId */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor<T> = new (...args: any[]) => T;

/** Constructor type for providers - must accept no args or single InjectFn arg */
export type InjectableConstructor<T> = (new () => T) | (new (inject: InjectFn) => T);

/** Type alias for the inject function */
export type InjectFn = <T>(id: InjectionId<T>, defaultValue?: T) => T;

/** Valid injection identifiers */
export type InjectionId<T> = Token<T> | Constructor<T>;

/** Generic injection ID for internal use */
export type GenericInjectionId = InjectionId<unknown>;

/** Type-safe unique key for dependencies */
export class Token<T> {
  private readonly __brand = 'Token' as const;

  constructor(public readonly name?: string) {
    void this.__brand; // suppress unused property warning
  }

  toString(): string {
    const name = this.name || 'anonymous';
    return `Token<${name}>`;
  }

  logT(t: T): void {
    void t; // Suppress unused parameter warning
  }
}

// TODO: move normalizeTag to types_internal.ts (no re-export from index.ts).

/** Returns normalized tag or null if undefined */
export function normalizeTag(tag: TagValue | null | undefined): symbol | null {
  if (!tag) return null;
  return typeof tag === 'string' ? Symbol.for(tag) : tag;
}
