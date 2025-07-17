/**
 * TypeScript Dependency Injection library - Main exports
 */

// Re-export all types
export * from './types.js';
export * from './errors.js';
export * from './providers.js';

// Re-export Injector class
export {Injector} from './injector.js';

// Re-export global API functions
export {
  deleteInjector,
  getInjector,
  init,
  inject,
  newTestInjector,
  register,
  removeTestInjector,
  setTestInjector,
} from './global.js';
export type {Config} from './global.js';
