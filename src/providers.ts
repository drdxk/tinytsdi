/** Provider type definitions for TSDI */

import type {InjectFn, InjectableConstructor, InjectionId} from './types.js';

/** Associates a static value with an InjectionId */
export interface ValueProvider<T> {
  provide: InjectionId<T>;
  useValue: T;
}

/** Associates a constructor with an InjectionId */
export interface ClassProvider<T> {
  provide: InjectionId<T>;
  useClass: InjectableConstructor<T>;
  noCache?: boolean;
}

/** Associates a factory function with an InjectionId */
export interface FactoryProvider<T> {
  provide: InjectionId<T>;
  useFactory: (() => T) | ((inject: InjectFn) => T);
  noCache?: boolean;
}

/** Associates one InjectionId with another (aliasing) */
export interface ExistingProvider<T> {
  provide: InjectionId<T>;
  useExisting: InjectionId<T>;
}

/** Union type of all provider types */
export type Provider<T> =
  | ValueProvider<T>
  | ClassProvider<T>
  | FactoryProvider<T>
  | ExistingProvider<T>
  | InjectableConstructor<T>; // Constructor provider shorthand

/** Generic provider for internal use */
export type GenericProvider = Provider<unknown>;

/** Type predicate for ValueProvider */
export function isValueProvider<T>(provider: Provider<T>): provider is ValueProvider<T> {
  return typeof provider === 'object' && Object.hasOwn(provider, 'useValue');
}

/** Type predicate for ClassProvider */
export function isClassProvider<T>(provider: Provider<T>): provider is ClassProvider<T> {
  return typeof provider === 'object' && Object.hasOwn(provider, 'useClass');
}

/** Type predicate for FactoryProvider */
export function isFactoryProvider<T>(provider: Provider<T>): provider is FactoryProvider<T> {
  return typeof provider === 'object' && Object.hasOwn(provider, 'useFactory');
}

/** Type predicate for ExistingProvider */
export function isExistingProvider<T>(provider: Provider<T>): provider is ExistingProvider<T> {
  return typeof provider === 'object' && Object.hasOwn(provider, 'useExisting');
}

/** Type predicate for constructor provider (shorthand) */
export function isConstructorProvider<T>(
  provider: Provider<T>
): provider is InjectableConstructor<T> {
  return typeof provider === 'function';
}
