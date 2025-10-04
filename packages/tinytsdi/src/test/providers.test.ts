import {describe, expect, it} from 'vitest';

import {
  isClassProvider,
  isConstructorProvider,
  isExistingProvider,
  isFactoryProvider,
  isValueProvider,
} from '../providers.js';
import {Token} from '../token.js';
import {InjectFn} from '../types.js';

import type {
  ClassProvider,
  ExistingProvider,
  FactoryProvider,
  ValueProvider,
} from '../providers.js';

describe('ClassProvider predicates', () => {
  it('identifies ClassProvider', () => {
    class Test {
      readonly brand = 'test';
    }
    const token = new Token<Test>('class');

    const provider = {
      provide: token,
      useClass: Test,
    } as const;

    provider satisfies ClassProvider<Test>;

    expect(isClassProvider(provider)).toBe(true);
    expect(isValueProvider(provider)).toBe(false);
    expect(isFactoryProvider(provider)).toBe(false);
    expect(isExistingProvider(provider)).toBe(false);
    expect(isConstructorProvider(provider)).toBe(false);
  });

  it('identifies ClassProvider with noCache option', () => {
    class Test {
      readonly brand = 'test';
    }
    const token = new Token<Test>('class');

    const provider = {
      provide: token,
      useClass: Test,
      noCache: true,
    } as const;

    provider satisfies ClassProvider<Test>;
    expect(isClassProvider(provider)).toBe(true);
    expect(isValueProvider(provider)).toBe(false);
    expect(isFactoryProvider(provider)).toBe(false);
    expect(isExistingProvider(provider)).toBe(false);
    expect(isConstructorProvider(provider)).toBe(false);
  });

  it('identifies ClassProvider with injectFn option', () => {
    class Test {
      readonly brand = 'test';
      constructor(inject: InjectFn) {
        void inject;
      }
    }
    const token = new Token<Test>('class');

    const provider = {
      provide: token,
      useClass: Test,
      injectFn: true,
    } as const;

    provider satisfies ClassProvider<Test>;

    expect(isClassProvider(provider)).toBe(true);
    expect(isValueProvider(provider)).toBe(false);
    expect(isFactoryProvider(provider)).toBe(false);
    expect(isExistingProvider(provider)).toBe(false);
    expect(isConstructorProvider(provider)).toBe(false);
  });

  it('identifies ClassProvider with at property', () => {
    class Test {}
    const token = new Token<Test>('class');

    const provider = {
      provide: token,
      useClass: Test,
      at: 'custom-tag',
    } as const;

    provider satisfies ClassProvider<Test>;
    expect(isClassProvider(provider)).toBe(true);
    expect(isValueProvider(provider)).toBe(false);
    expect(isFactoryProvider(provider)).toBe(false);
    expect(isExistingProvider(provider)).toBe(false);
    expect(isConstructorProvider(provider)).toBe(false);
  });

  it('identifies ClassProvider with edge options', () => {
    class Test {}
    const token = new Token<Test>('class');

    const provider = {
      provide: token,
      useClass: Test,
      noCache: false,
    } as const;

    provider satisfies ClassProvider<Test>;
    expect(isClassProvider(provider)).toBe(true);
    expect(isValueProvider(provider)).toBe(false);
    expect(isFactoryProvider(provider)).toBe(false);
    expect(isExistingProvider(provider)).toBe(false);
    expect(isConstructorProvider(provider)).toBe(false);
  });

  it('identifies ClassProvider with all options', () => {
    class Test {
      constructor(inject: InjectFn) {
        void inject;
      }
    }
    const token = new Token<Test>('class');

    const provider = {
      provide: token,
      useClass: Test,
      injectFn: true,
      noCache: true,
      at: Symbol('tag'),
    } as const;

    provider satisfies ClassProvider<Test>;
    expect(isClassProvider(provider)).toBe(true);
    expect(isValueProvider(provider)).toBe(false);
    expect(isFactoryProvider(provider)).toBe(false);
    expect(isExistingProvider(provider)).toBe(false);
    expect(isConstructorProvider(provider)).toBe(false);
  });
});

describe('ConstructorProvider predicates', () => {
  it('identifies shorthand ClassProvider (constructor)', () => {
    class Test {
      readonly brand = 'test';
    }

    const provider = Test;

    provider satisfies typeof Test;
    expect(isClassProvider(provider)).toBe(false);
    expect(isValueProvider(provider)).toBe(false);
    expect(isFactoryProvider(provider)).toBe(false);
    expect(isExistingProvider(provider)).toBe(false);
    expect(isConstructorProvider(provider)).toBe(true);
  });
});

describe('FactoryProvider predicates', () => {
  it('identifies FactoryProvider with no-args', () => {
    const token = new Token<number>('factory');

    const provider = {
      provide: token,
      useFactory: () => 42,
    } as const;

    provider satisfies FactoryProvider<number>;
    expect(isFactoryProvider(provider)).toBe(true);
    expect(isValueProvider(provider)).toBe(false);
    expect(isClassProvider(provider)).toBe(false);
    expect(isExistingProvider(provider)).toBe(false);
    expect(isConstructorProvider(provider)).toBe(false);
  });

  it('identifies FactoryProvider with InjectFn', () => {
    const token = new Token<string>('factory');

    const provider = {
      provide: token,
      useFactory: (inject: InjectFn) => {
        void inject;
        return 'result';
      },
    } as const;

    provider satisfies FactoryProvider<string>;
    expect(isFactoryProvider(provider)).toBe(true);
    expect(isValueProvider(provider)).toBe(false);
    expect(isClassProvider(provider)).toBe(false);
    expect(isExistingProvider(provider)).toBe(false);
    expect(isConstructorProvider(provider)).toBe(false);
  });

  it('identifies FactoryProvider with noCache option', () => {
    const token = new Token<number>('factory');

    const provider = {
      provide: token,
      useFactory: () => 42,
      noCache: true,
    } as const;

    provider satisfies FactoryProvider<number>;
    expect(isFactoryProvider(provider)).toBe(true);
    expect(isValueProvider(provider)).toBe(false);
    expect(isClassProvider(provider)).toBe(false);
    expect(isExistingProvider(provider)).toBe(false);
    expect(isConstructorProvider(provider)).toBe(false);
  });

  it('identifies FactoryProvider with at property', () => {
    const token = new Token<string>('factory');

    const provider = {
      provide: token,
      useFactory: () => 'result',
      at: 'custom-tag',
    } as const;

    provider satisfies FactoryProvider<string>;
    expect(isFactoryProvider(provider)).toBe(true);
    expect(isValueProvider(provider)).toBe(false);
    expect(isClassProvider(provider)).toBe(false);
    expect(isExistingProvider(provider)).toBe(false);
    expect(isConstructorProvider(provider)).toBe(false);
  });

  it('identifies FactoryProvider with all options', () => {
    const token = new Token<string>('factory');

    const provider = {
      provide: token,
      useFactory: (inject: InjectFn) => {
        void inject;
        return 'result';
      },
      noCache: true,
      at: Symbol('tag'),
    } as const;

    provider satisfies FactoryProvider<string>;
    expect(isFactoryProvider(provider)).toBe(true);
    expect(isValueProvider(provider)).toBe(false);
    expect(isClassProvider(provider)).toBe(false);
    expect(isExistingProvider(provider)).toBe(false);
    expect(isConstructorProvider(provider)).toBe(false);
  });
});

describe('ExistingProvider predicates', () => {
  it('identifies ExistingProvider', () => {
    const sourceToken = new Token<string>('source');
    const targetToken = new Token<string>('target');

    const provider = {
      provide: targetToken,
      useExisting: sourceToken,
    } as const;

    provider satisfies ExistingProvider<string>;
    expect(isExistingProvider(provider)).toBe(true);
    expect(isValueProvider(provider)).toBe(false);
    expect(isClassProvider(provider)).toBe(false);
    expect(isFactoryProvider(provider)).toBe(false);
    expect(isConstructorProvider(provider)).toBe(false);
  });

  it('identifies ExistingProvider with at property', () => {
    const sourceToken = new Token<string>('source');
    const targetToken = new Token<string>('target');

    const provider = {
      provide: targetToken,
      useExisting: sourceToken,
      at: 'custom-tag',
    } as const;

    provider satisfies ExistingProvider<string>;
    expect(isExistingProvider(provider)).toBe(true);
    expect(isValueProvider(provider)).toBe(false);
    expect(isClassProvider(provider)).toBe(false);
    expect(isFactoryProvider(provider)).toBe(false);
    expect(isConstructorProvider(provider)).toBe(false);
  });
});

describe('ValueProvider predicates', () => {
  it('identifies ValueProvider', () => {
    const token = new Token<string>('test');

    const provider = {
      provide: token,
      useValue: 'test value',
    } as const;

    provider satisfies ValueProvider<string>;
    // Predicate functions (assumed to be imported)
    expect(isValueProvider(provider)).toBe(true);
    expect(isClassProvider(provider)).toBe(false);
    expect(isFactoryProvider(provider)).toBe(false);
    expect(isExistingProvider(provider)).toBe(false);
    expect(isConstructorProvider(provider)).toBe(false);
  });

  it('identifies ValueProvider with at property', () => {
    const token = new Token<string>('value');

    const provider = {
      provide: token,
      useValue: 'test value',
      at: 'custom-tag',
    } as const;

    provider satisfies ValueProvider<string>;
    expect(isValueProvider(provider)).toBe(true);
    expect(isClassProvider(provider)).toBe(false);
    expect(isFactoryProvider(provider)).toBe(false);
    expect(isExistingProvider(provider)).toBe(false);
    expect(isConstructorProvider(provider)).toBe(false);
  });

  it('identifies ValueProvider with edge value', () => {
    const token = new Token<number>('num');

    const provider = {
      provide: token,
      useValue: 0,
    } as const;

    provider satisfies ValueProvider<number>;
    expect(isValueProvider(provider)).toBe(true);
    expect(isClassProvider(provider)).toBe(false);
    expect(isFactoryProvider(provider)).toBe(false);
    expect(isExistingProvider(provider)).toBe(false);
    expect(isConstructorProvider(provider)).toBe(false);
  });
});
