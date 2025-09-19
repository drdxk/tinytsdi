import {Provider} from '../providers';
import {Token} from '../types';

import {describe, it} from './ct_helper';

describe('Provider<T>', () => {
  it('accepts async factory', () => {
    type StringPromise = Promise<string>;
    const asyncProvider: Provider<StringPromise> = {
      provide: new Token<StringPromise>('async'),
      // eslint-disable-next-line @typescript-eslint/require-await
      useFactory: async () => 'async result',
    };
    void asyncProvider;
  });

  it('accepts nested complex generic types', () => {
    type NestedGeneric = Array<Promise<Map<string, number>>>;
    const nestedGenericProvider: Provider<NestedGeneric> = {
      provide: new Token<NestedGeneric>('nested'),
      useFactory: () => [
        Promise.resolve(
          new Map<string, number>([
            ['one', 1],
            ['two', 2],
          ])
        ),
      ],
    };
    void nestedGenericProvider;
  });
});
