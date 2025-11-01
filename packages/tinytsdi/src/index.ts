/** TypeScript Dependency Injection library - Main exports */

// Re-export all public types and classes
export * from './constants.js';
export * from './container.js';
export * from './errors.js';
export * from './injector.js';
export * from './providers.js';
export * from './token.js';
export * from './types.js';

// Re-export global API functions
export {
  deleteInjector,
  getInjector,
  init,
  inject,
  newTestInjector,
  register,
  removeTestInjector,
  resetInitForTestOnly,
  setTestInjector,
} from './global.js';
export type {ContainerConfig} from './global.js';
