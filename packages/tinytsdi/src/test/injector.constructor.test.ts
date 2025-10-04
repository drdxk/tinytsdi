import {describe, expect, it} from 'vitest';

import {TAG_ROOT, TAG_SINK} from '../constants.js';
import {Injector} from '../injector.js';
import {Token} from '../token.js';

describe('new Injector()', () => {
  it('creates injector with default allowOverrides=false', () => {
    const injector = new Injector();
    const token = new Token<string>('override-test-default-false');
    injector.register({provide: token, useValue: 'first'});

    expect(() => {
      injector.register({provide: token, useValue: 'second'});
    }).toThrow();
    expect(injector.inject(token)).toBe('first');
  });

  it('creates injector with defaultAllowOverrides=true', () => {
    const injector = new Injector({defaultAllowOverrides: true});
    const token = new Token<string>('override-test-true');
    injector.register({provide: token, useValue: 'first'});

    expect(() => {
      injector.register({provide: token, useValue: 'second'});
    }).not.toThrow();
    expect(injector.inject(token)).toBe('second');
  });

  it('creates injector with defaultAllowOverrides=false', () => {
    const injector = new Injector({defaultAllowOverrides: false});
    const token = new Token<string>('override-test-false');
    injector.register({provide: token, useValue: 'first'});

    expect(() => {
      injector.register({provide: token, useValue: 'second'});
    }).toThrow();
    expect(injector.inject(token)).toBe('first');
  });

  it('assigns TAG_ROOT when no parent and no tag specified', () => {
    const injector = new Injector();
    expect(injector.getTag()).toBe(TAG_ROOT);
  });

  it('assigns null tag when has parent and no tag specified', () => {
    const parent = new Injector();
    const child = new Injector({parent});
    expect(child.getTag()).toBe(null);
  });

  it('assigns explicit string tag when specified', () => {
    const injector = new Injector({tag: 'test'});
    expect(injector.getTag()).toBe(Symbol.for('test'));
  });

  it('assigns explicit symbol tag when specified', () => {
    const customSymbol = Symbol('custom');
    const injector = new Injector({tag: customSymbol});
    expect(injector.getTag()).toBe(customSymbol);
  });

  it('assigns TAG_ROOT when explicitly specified as a string', () => {
    const injector = new Injector({tag: 'root'});
    expect(injector.getTag()).toBe(TAG_ROOT);
  });

  it('assigns TAG_SINK when explicitly specified as a string', () => {
    const injector = new Injector({tag: 'sink'});
    expect(injector.getTag()).toBe(TAG_SINK);
  });

  it('overrides default tag assignment with explicit tag', () => {
    const parent = new Injector();
    const child = new Injector({parent, tag: 'override'});
    expect(child.getTag()).toBe(Symbol.for('override'));
  });

  it('assigns null tag when explicitly specified', () => {
    const injector = new Injector({tag: null});
    expect(injector.getTag()).toBe(null);
  });

  it('overrides default TAG_ROOT with explicit null tag', () => {
    const injector = new Injector({tag: null});
    expect(injector.getTag()).toBe(null);
  });

  it('root injector does not have a parent', () => {
    const injector = new Injector();
    expect(injector.getParent()).toBe(null);
  });

  it('child injector has a parent', () => {
    const parent = new Injector();
    const child = new Injector({parent});
    expect(child.getParent()).toBe(parent);
  });
});
