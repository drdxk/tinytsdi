/** Type tests for core types. */

import {Token} from '../types.js';
import {
  STRING,
  Service,
  ServiceNoArgs,
  ServiceWithArgs,
  ServiceWithInject,
  describe,
  it,
} from './ct_helper.js';

import type {Constructor, InjectFn, InjectableConstructor, InjectionId} from '../types.js';

describe('InjectionId<T>', () => {
  it('Token is assignable to InjectionId', () => {
    const tokenAsId: InjectionId<string> = STRING;
    void tokenAsId;
  });

  it('constructor is assignable to InjectionId', () => {
    const serviceAsId: InjectionId<Service> = Service;
    void serviceAsId;
  });

  it('incompatible generic types fails', () => {
    // @ts-expect-error - Token<string> not assignable to InjectionId<number>
    const wrongTokenType: InjectionId<number> = STRING;

    // @ts-expect-error - Constructor<TestService> not assignable to InjectionId<string>
    const wrongConstructorType: InjectionId<string> = Service;

    void wrongTokenType;
    void wrongConstructorType;
  });
});

describe('InjectFn', () => {
  const mockInject: InjectFn = () => {
    // Return value doesn't matter for the tests, only the typing as InjectFn
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-return
    return 'mock' as any;
  };

  describe('signature', () => {
    it('defaultValue is optional', () => {
      const injectedWithoutDefault: string = mockInject(STRING);
      void injectedWithoutDefault;
    });

    it('defaultValue can be null', () => {
      const injectedWithNullDefault: string | null = mockInject(STRING, null);
      void injectedWithNullDefault;
    });

    it('accepts compatible id and defaultValue', () => {
      const injectedString: string = mockInject(STRING, 'default');
      const injectedService: Service = mockInject(Service, new Service('default'));
      void injectedString;
      void injectedService;
    });

    it('incompatible defaultValue type fails', () => {
      // @ts-expect-error -  number is not assignable to string
      const wrongDefault: string = mockInject(STRING, 42);
      void wrongDefault;
    });

    it('null defaultValue should be reflected in receiver type', () => {
      // @ts-expect-error - string not assignable to string | null
      const wrongDefault: string = mockInject(STRING, null);
      void wrongDefault;
    });

    it('incompatible return type fails', () => {
      // @ts-expect-error - string not assignable to number
      const wrongReturnType: number = mockInject(STRING);
      // @ts-expect-error - string not assignable to number
      const wrongReturnTypeDefault: number = mockInject(STRING, 'default');
      void wrongReturnType;
      void wrongReturnTypeDefault;
    });
  });

  describe('complex return types', () => {
    const complexToken = new Token<Service>('service');
    const complexId: InjectionId<Service> = complexToken;

    it('complex generic type is propagated correctly', () => {
      const complexInject: Service = mockInject(complexId);
      void complexInject;
    });

    it('enforces generic type propagation', () => {
      // Negative: Generic type propagation should be enforced
      // @ts-expect-error - TestService not assignable to string
      const wrongComplexType: string = mockInject(complexToken);
      void wrongComplexType;
    });

    it('accepts union types', () => {
      const unionToken = new Token<string | number>('union');
      const unionValue: string | number = mockInject(unionToken);
      void unionValue;
    });

    it('enforces union type', () => {
      const unionToken = new Token<string | number>('union');
      // @ts-expect-error - string | number not assignable to string
      const narrowUnion: string = mockInject(unionToken);
      void narrowUnion;
    });

    it('accepts array types', () => {
      const arrayToken = new Token<string[]>('array');
      const arrayValue: string[] = mockInject(arrayToken);
      void arrayValue;
    });

    it('enforces array types', () => {
      const arrayToken = new Token<string[]>('array');
      // @ts-expect-error - string[] not assignable to string
      const narrowArray: string = mockInject(arrayToken);
      void narrowArray;
    });
  });
});

describe('Constructor<T>', () => {
  it('accepts classes', () => {
    const validConstructor: Constructor<Service> = Service;
    const validConstructorWithInject: Constructor<ServiceWithInject> = ServiceWithInject;
    void validConstructor;
    void validConstructorWithInject;
  });

  it('rejects non-constructors', () => {
    // @ts-expect-error - string not assignable to Constructor<T>
    const notConstructor: Constructor<Service> = 'not a constructor';

    // @ts-expect-error - function not assignable to Constructor<T>
    const notConstructorFn: Constructor<Service> = () => new Service('test');

    void notConstructor;
    void notConstructorFn;
  });
});

describe('InjectableConstructor<T>', () => {
  it('accepts classes with no args', () => {
    const validInjectableNoArgs: InjectableConstructor<ServiceNoArgs> = ServiceNoArgs;
    void validInjectableNoArgs;
  });

  it('accepts classes with InjectFn arg', () => {
    const validInjectableWithInject: InjectableConstructor<ServiceWithInject> = ServiceWithInject;
    void validInjectableWithInject;
  });

  it('incompatible constructor args fails', () => {
    // @ts-expect-error - Constructor with non-InjectFn args not assignable to InjectableConstructor<T>
    const invalidInjectableWithArgs: InjectableConstructor<ServiceWithArgs> = ServiceWithArgs;
    void invalidInjectableWithArgs;
  });

  it('rejects non-constructors', () => {
    // @ts-expect-error - string not assignable to InjectableConstructor<T>
    const notInjectableConstructor: InjectableConstructor<ServiceNoArgs> = 'not a constructor';
    void notInjectableConstructor;
  });
});

describe('Token<T>', () => {
  it('same generic type is compatible', () => {
    const stringToken1 = new Token<string>('first');
    const stringToken2: Token<string> = stringToken1;
    void stringToken2;
  });

  it('different generic types fails', () => {
    const stringToken1 = new Token<string>('first');
    const numberToken = new Token<number>('number');

    // @ts-expect-error - Token<string> not assignable to Token<number>
    const incompatibleToken: Token<number> = stringToken1;

    // @ts-expect-error - Token<number> not assignable to Token<string>
    const incompatibleToken2: Token<string> = numberToken;

    void incompatibleToken;
    void incompatibleToken2;
  });
});
