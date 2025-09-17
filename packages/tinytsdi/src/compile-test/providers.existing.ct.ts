import {ExistingProvider, Provider} from '../providers';
import {Token} from '../types.js';
import {NUMBER, SERVICE, STRING, Service, ServiceNoArgs, describe, it} from './ct_helper';

describe('ExistingProvider<T>', () => {
  it('accepts compatible primitive types', () => {
    const sourceToken = new Token<string>('source');
    const targetToken = new Token<string>('target');
    const validExistingProvider: ExistingProvider<string> = {
      provide: targetToken,
      useExisting: sourceToken,
    };
    void validExistingProvider;
  });

  it('accepts compatible class types', () => {
    const sourceToken = new Token<Service>('source');
    const targetToken = new Token<Service>('target');
    const validExistingProvider: ExistingProvider<Service> = {
      provide: targetToken,
      useExisting: sourceToken,
    };
    void validExistingProvider;
  });

  it('rejects incompatible primitive types', () => {
    const invalidExistingProvider: ExistingProvider<string> = {
      provide: STRING,
      // @ts-expect-error - Token<number> not assignable to Token<string>
      useExisting: NUMBER,
    };
    void invalidExistingProvider;
  });

  it('rejects incompatible class types', () => {
    const serviceNoArgsToken = new Token<ServiceNoArgs>('ServiceNoArgs');
    const invalidExistingProvider: ExistingProvider<Service> = {
      provide: SERVICE,
      // @ts-expect-error - Token<ServiceNoArgs> not assignable to Token<Service>
      useExisting: serviceNoArgsToken,
    };
    void invalidExistingProvider;
  });

  it('rejects incompatible mixed types', () => {
    const invalidExistingProvider: ExistingProvider<string> = {
      provide: STRING,
      // @ts-expect-error - Token<Service> not assignable to Token<string>
      useExisting: SERVICE,
    };
    void invalidExistingProvider;
  });

  it('assignable to Provider<T>', () => {
    const sourceToken = new Token<string>('source');
    const targetToken = new Token<string>('target');
    const validExistingProvider: ExistingProvider<string> = {
      provide: targetToken,
      useExisting: sourceToken,
    };
    const providerFromExisting: Provider<string> = validExistingProvider;
    void providerFromExisting;
  });

  it('not assignable to Provider<U> for U not assignable from T', () => {
    const sourceToken = new Token<string>('source');
    const targetToken = new Token<string>('target');
    const validExistingProvider: ExistingProvider<string> = {
      provide: targetToken,
      useExisting: sourceToken,
    };
    // @ts-expect-error - Incompatible types
    const invalidProviderFromExisting: Provider<number> = validExistingProvider;
    void invalidProviderFromExisting;
  });
});
