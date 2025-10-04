/** Public constants. */

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
