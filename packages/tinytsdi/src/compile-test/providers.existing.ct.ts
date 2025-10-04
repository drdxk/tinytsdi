import {ExistingProvider, Provider} from '../providers';
import {Token} from '../token';

import {NUMBER, SERVICE, STRING, Service, ServiceNoArgs, describe, it} from './ct_helper';

describe('ExistingProvider<T>', () => {
  describe('alias type compatibility', () => {
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
  });

  describe('at option', () => {
    it('accepts string tag values', () => {
      const sourceToken = new Token<string>('source');
      const targetToken = new Token<string>('target');
      const existingProviderWithAt: ExistingProvider<string> = {
        provide: targetToken,
        useExisting: sourceToken,
        at: 'custom-tag',
      };
      void existingProviderWithAt;
    });

    it('accepts symbol tag values', () => {
      const sourceToken = new Token<Service>('source');
      const targetToken = new Token<Service>('target');
      const existingProviderWithAtSymbol: ExistingProvider<Service> = {
        provide: targetToken,
        useExisting: sourceToken,
        at: Symbol('custom'),
      };
      void existingProviderWithAtSymbol;
    });

    it('rejects invalid at property types', () => {
      const sourceToken = new Token<string>('source');
      const targetToken = new Token<string>('target');
      const invalidAtProvider: ExistingProvider<string> = {
        provide: targetToken,
        useExisting: sourceToken,
        // @ts-expect-error - number not assignable to TagValue
        at: 42,
      };
      void invalidAtProvider;
    });
  });

  describe('assignability', () => {
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

    it('assignable to Provider<T> when using at option', () => {
      const sourceToken = new Token<Service>('source');
      const targetToken = new Token<Service>('target');
      const existingProviderWithAt: ExistingProvider<Service> = {
        provide: targetToken,
        useExisting: sourceToken,
        at: 'tag',
      };
      const provider: Provider<Service> = existingProviderWithAt;
      void provider;
    });

    it('not assignable to Provider<U> for U not assignable to T', () => {
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
});
