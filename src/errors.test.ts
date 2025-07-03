/**
 * @fileoverview Tests for error classes
 */

import {describe, it, expect} from 'vitest';
import {Token} from './types.js';
import {AlreadyProvidedError, NotProvidedError, NeverCachedError} from './errors.js';

describe('Error classes', () => {
  it('creates AlreadyProvidedError with token', () => {
    const token = new Token<string>('test');
    const error = new AlreadyProvidedError(token);
    expect(error.name).toBe('AlreadyProvidedError');
    expect(error.message).toBe('Provider already registered for Token<test>');
  });

  it('creates NotProvidedError with class constructor', () => {
    class TestClass {}
    const error = new NotProvidedError(TestClass);
    expect(error.name).toBe('NotProvidedError');
    expect(error.message).toBe('No provider registered for class TestClass');
  });

  it('creates NeverCachedError with anonymous token', () => {
    const token = new Token<number>();
    const error = new NeverCachedError(token);
    expect(error.name).toBe('NeverCachedError');
    expect(error.message).toBe('Provider for Token<anonymous> is transient and never cached');
  });
});
