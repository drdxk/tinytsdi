/** Tests for basic types */

import {describe, expect, it} from 'vitest';

import {Token} from './types.js';

describe('Token', () => {
  it('creates token with name', () => {
    const token = new Token<string>('test');
    expect(token.name).toBe('test');
    expect(token.toString()).toBe('Token<test>');
  });

  it('creates anonymous token', () => {
    const token = new Token<string>();
    expect(token.name).toBeUndefined();
    expect(token.toString()).toBe('Token<anonymous>');
  });

  it('tokens are unique by reference', () => {
    const token1 = new Token<string>('same');
    const token2 = new Token<string>('same');
    expect(token1).not.toBe(token2);
  });
});
