/** Core type definitions for TSDI */

/** Constructor type that can be used as InjectionId */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor<T> = new (...args: any[]) => T;

/** Constructor type for providers - must accept no args or single InjectFn arg */
export type InjectableConstructor<T> = (new () => T) | (new (inject: InjectFn) => T);

/** Type alias for the inject function */
export type InjectFn = <T>(id: InjectionId<T>, defaultValue?: T) => T;

/** Valid injection identifiers */
export type InjectionId<T> = Token<T> | Constructor<T>;

/** Scope for providers */
export type InjectScope = 'singleton' | 'transient';

/** Generic injection ID for internal use */
export type GenericInjectionId = InjectionId<unknown>;

/** Type-safe unique key for dependencies */
export class Token<T> {
  constructor(public readonly name?: string) {}

  toString(): string {
    const name = this.name || 'anonymous';
    return `Token<${name}>`;
  }

  logT(t: T): void {
    void t; // Suppress unused parameter warning
  }
}
