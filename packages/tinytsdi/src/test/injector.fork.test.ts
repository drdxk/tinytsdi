import {describe, expect, it} from 'vitest';

import {Injector} from '../injector.js';
import {Token} from '../token.js';

describe('fork()', () => {
  it('creates child injector', () => {
    const parent = new Injector();
    const child1 = parent.fork();
    const child2 = parent.fork();

    // Test that child is a separate instance
    expect(child1).not.toBe(parent);
    expect(child2).not.toBe(parent);
    expect(child1).not.toBe(child2);
  });

  it('preserves defaultAllowOverrides setting when true', () => {
    const parentWithOverrides = new Injector({defaultAllowOverrides: true});
    const childWithOverrides = parentWithOverrides.fork();
    const token = new Token<string>('override-hierarchy-true');
    childWithOverrides.register({provide: token, useValue: 'first'});

    expect(() => {
      childWithOverrides.register({provide: token, useValue: 'second'});
    }).not.toThrow();
    expect(childWithOverrides.inject(token)).toBe('second');
  });

  it('preserves defaultAllowOverrides setting when false', () => {
    const parentWithoutOverrides = new Injector({defaultAllowOverrides: false});
    const childWithoutOverrides = parentWithoutOverrides.fork();
    const token2 = new Token<string>('override-hierarchy-false');
    childWithoutOverrides.register({provide: token2, useValue: 'first'});

    expect(() => {
      childWithoutOverrides.register({provide: token2, useValue: 'second'});
    }).toThrow();
    expect(childWithoutOverrides.inject(token2)).toBe('first');
  });

  it('allows overriding defaultAllowOverrides setting', () => {
    const parent = new Injector({defaultAllowOverrides: false});
    const child = parent.fork({defaultAllowOverrides: true});
    const token = new Token<string>('override-test');

    child.register({provide: token, useValue: 'first'});
    expect(() => {
      child.register({provide: token, useValue: 'second'});
    }).not.toThrow();
    expect(child.inject(token)).toBe('second');
  });

  it('creates child with null tag by default', () => {
    const parent = new Injector({tag: 'parent-tag'});
    const child = parent.fork();

    expect(parent.getTag()).toBe(Symbol.for('parent-tag'));
    expect(child.getTag()).toBe(null);
  });

  it('creates child with explicit null tag when specified', () => {
    const parent = new Injector({tag: 'parent-tag'});
    const child = parent.fork({tag: null});

    expect(parent.getTag()).toBe(Symbol.for('parent-tag'));
    expect(child.getTag()).toBe(null);
  });

  it('creates child with explicit tag when specified', () => {
    const parent = new Injector({tag: 'parent-tag'});
    const child = parent.fork({tag: 'child-tag'});

    expect(parent.getTag()).toBe(Symbol.for('parent-tag'));
    expect(child.getTag()).toBe(Symbol.for('child-tag'));
  });

  it('accepts combined options for tag and defaultAllowOverrides', () => {
    const parent = new Injector({tag: 'parent', defaultAllowOverrides: true});
    const child = parent.fork({tag: 'child', defaultAllowOverrides: false});

    expect(child.getTag()).toBe(Symbol.for('child'));

    const token = new Token<string>('combined-test');
    child.register({provide: token, useValue: 'first'});
    expect(() => {
      child.register({provide: token, useValue: 'second'});
    }).toThrow();
    expect(child.inject(token)).toBe('first');
  });
});
