## v3.0.0 ideas:

### 1. ✅ Add basic support for hierarchical injectors

### 2. ✅ Modify `scope` provider setting, rename to `noCache`, defaulting to `false`

### 3. Make passing of `InjectFn` to constructors of class providers (shorthand and full) optional, false by default. -- Maybe?

- Controlled via boolean `injectFn` option in the provider settings.
- Or by the class itself, via a static [InjectFn] symbol property (symbol provided by the library)?

### 4. Global: add `hijackGlobalContext` API function -- Maybe?

- `hijackGlobalContext(getInjector: () => Injector)` allows to create own "DI container" using
  library methods, since global `inject()` and `register()` simply call `getInjector()[method])()`.
- Document the fact that this means that other global functions will not work.
- maybe add options to hijack `deleteInjector` as the second argument.
- Put non-hijacked functions in error mode (i.e. `if hijacked throw`).
- `restoreGlobalContext()` to restore the original global context.

### 5. Support hierarcy-aware providers via `atRoot` boolean property:

- If set, `register()` will pass the registration to the parent injector when parent is set.

## Organizational refactorings:

### 1. Convert to monorepo to support container packages and maybe full-scale e2e tests

### 2. Move tests to subdirectories in `src/`

- one for compile tests, one for unit tests

### 3. e2e test package with subset of functionality

- maybe both unit and compile tests
- ESM / CJS

## v3+ ideas:

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
