import {describe, expect, it} from 'vitest';

import {TAG_ROOT} from '../constants.js';
import {TAG_SINK} from '../constants.js';
import {normalizeTag} from '../types_internal.js';

describe('normalizeTag()', () => {
  it('converts string to symbol using Symbol.for', () => {
    const result = normalizeTag('test');
    expect(result).toBe(Symbol.for('test'));
    expect(typeof result).toBe('symbol');
  });

  it('returns symbol unchanged', () => {
    const symbol = Symbol();
    const result = normalizeTag(symbol);
    expect(result).toBe(symbol);
    expect(typeof result).toBe('symbol');
  });

  it('consistently converts the same string', () => {
    const result1 = normalizeTag('same-string');
    const result2 = normalizeTag('same-string');
    expect(result1).toBe(result2);
    expect(result1).toBe(Symbol.for('same-string'));
  });

  it('produces different symbols for different strings', () => {
    const result1 = normalizeTag('first');
    const result2 = normalizeTag('second');
    expect(result1).not.toBe(result2);
  });

  it('preserves Symbol.for symbols', () => {
    const original = Symbol.for('preserved');
    const result = normalizeTag(original);
    expect(result).toBe(original);
  });

  it('treats Symbol.for and strings with same key as equivalent', () => {
    const stringTag = 'equivalent';
    const symbolTag = Symbol.for('equivalent');
    const resultFromString = normalizeTag(stringTag);
    const resultFromSymbol = normalizeTag(symbolTag);
    expect(resultFromString).toBe(resultFromSymbol);
  });

  it('matches TAG_ROOT and TAG_SINK correctly', () => {
    expect(normalizeTag('root')).toBe(TAG_ROOT);
    expect(normalizeTag('sink')).toBe(TAG_SINK);
    expect(normalizeTag(Symbol.for('root'))).toBe(TAG_ROOT);
    expect(normalizeTag(Symbol.for('sink'))).toBe(TAG_SINK);
    expect(normalizeTag(TAG_ROOT)).toBe(TAG_ROOT);
    expect(normalizeTag(TAG_SINK)).toBe(TAG_SINK);
  });

  it('returns null for undefined', () => {
    const result = normalizeTag(undefined);
    expect(result).toBeNull();
  });

  it('returns null for null', () => {
    const result = normalizeTag(null);
    expect(result).toBeNull();
  });

  it('returns null for empty string', () => {
    const result = normalizeTag('');
    expect(result).toBeNull();
  });
});
