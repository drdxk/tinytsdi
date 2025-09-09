/** Helper functions to structure compile tests. */

import {Token} from '../types';

import type {InjectFn} from '../types';

export function describe(description: string, fn: () => void) {
  void description;
  fn();
}

export function it(description: string, fn: () => void) {
  void description;
  fn();
}

// Shared test values

export class Service {
  readonly __brand = 'TestService' as const;
  constructor(public value: string) {}
}

export class ServiceWithInject {
  readonly __brand = 'TestServiceWithInject' as const;
  constructor(private inject: InjectFn) {
    void this.inject;
  }
}

export class ServiceNoArgs {
  readonly __brand = 'TestServiceNoArgs' as const;
  constructor() {}
}

export class ServiceWithArgs {
  readonly __brand = 'TestServiceWithArgs' as const;
  constructor(
    public arg1: string,
    public arg2: number
  ) {}
}

// Shared test tokens
export const STRING = new Token<string>('test');
