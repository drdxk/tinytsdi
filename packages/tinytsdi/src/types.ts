/** Core type definitions for TSDI */

import {Token} from './token';

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
