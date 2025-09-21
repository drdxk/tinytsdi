## Next releases:

### v3.1. Support hierarchy-aware providers with tags

`InjectorOptions` has `tag: string|Symbol` property, defaulting to `root` if no parent and `null`
otherwise. Internally, tag is storied as a `Symbol`, strings converted with `Symbol.for()`.

Providers have `at?: string|Symbol` option, which if specified, will register the provider only if
the injector has the matching tag. If not, will pass to parent, and so on. If no matching injector
is found, throw an error.

- Special tag for `root` assigned by default.
- Special tag for `sink` for testing: injector tagged with sink ignores `at` option and register the
  provider itself.

- Add tag to constructor options and `fork`
- Add tag to `newTestInjector()`

### v3.2. Global: add `hijackGlobalContext` API function

- `hijackGlobalContext(getInjector: () => Injector)` allows to create own "DI container" using
  library methods, since global `inject()` and `register()` simply call `getInjector()[method])()`.
- Document the fact that this means that other global functions will not work.
- maybe add options to hijack `deleteInjector` as the second argument.
- Put non-hijacked functions in error mode (i.e. `if hijacked throw`).
- `restoreGlobalContext()` to restore the original global context.

## Not scheduled yet:

### 0. Implement testing mode as a hijacked global context, i.e. create a test container, think how to map existing flows onto this

- mark test global functions as deprecated from then on, to be delted in v4.

### 1. `node-als` either as a submodule or separate script in the built directory

(NOT exported from index!):

- exports global conainer API that supports forking for async contexts:

```typescript
const als = new AsyncLocalStorage(); // Create this in a factory method.

// Same as global#getInjector().
export function getRootInjector(): Injector {
  // ...
}

// To be used to set up async context
export function runWithFork(fn: (injector: Injector) => void) {
  const injector = getRootInjector().fork();
  als.run(injector, () => {
    fn(injector);
  });
}

export function inject() {
  const injector = als.getStore() || getRootInjector();
  // ...
}

// alternatively with hijack:
hijackGlobalContext(() => als.getStore() || getRootInjector());

// same for register()

export function registerAtRoot() {
  // TThoughts: I sort of feel like this is the proper way of doing root registrations,
  // rather than having providers knowledgably about hierarchy, but lack foresight here.
  getRootInjector().register();
}

// test provider functionality shouldn't really change.
```

### 2. Based on that, express middleware (definitely a submodule):

```typescript
// app.use(requestInjector)
export function requestInjector(_req, _res, next) {
  runWithFork(() => {
    next();
  }
}


// const configureInjector = (injector: Injector) => {
//    injector.register(/* ... */);
// };
// app.use(requestInjectorAnd(configureInjector))
export function requestInjectorAnd(configFn: (injector: Injector) => void) {
  return (req, res, next) => {
    runWithFork((injector) => {
      configFn(injector);
      next();
    });
  };
}

// const providers = [{provide: REQUEST_ID, useValue: 123}];
// app.use(requestInjectorProviders(providers))
export function requestInjectorProviders(providers: Provider[]) {
  return (req, res, next) => {
    runWithFork((injector) => {
      injector.register(providers);
      next();
    });
  };
}

// or maybe let's just create options with both injector and providers?
```

Add example.

### 3. And a fastify plugin:

```typescript
import fp from 'fastify-plugin';

async function requestInjector(fastify, opts) {
  fastify.addHook('onRequest', (request, reply, done) => {
  runWithFork(() => {
    done();
  });
}

// not sure if needed
export default fp(requestInjector);
```

Test, add an example.

### 4. Add a browser example / test

Like within a react app running off vite or something. Maybe create a React context provider + a
hook that creates and returns a configured context provider.

## v-ANY:

### 1. Add generated documentation

With `tsdoc-markdown` or probably more like `typedoc`+ `typedoc-plugin-markdown`.

### 2. Add human written documentation

- Terminology / concepts (NestJS might confuse people on what a provider is)
- Some guides on how to use the library in different contexts
- Include testing setups

### 3. Changesets if versioning management becomes a pain
