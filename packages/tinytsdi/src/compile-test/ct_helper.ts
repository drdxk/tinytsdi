/** Helper functions to structure compile tests. */

import {Token} from '../token';

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
  readonly __brand = 'Service' as const;
  constructor(public value: string) {}
}

export class ServiceWithInject {
  readonly __brand = 'ServiceWithInject' as const;
  constructor(private inject: InjectFn) {
    void this.inject;
  }
}

export class ServiceWithInjectAndOtherArg {
  readonly __brand = 'ServiceWithInjectAndOtherArg' as const;
  constructor(
    private inject: InjectFn,
    public other: string
  ) {
    void this.inject;
  }
}

export class ServiceWithInjectAndOptionalArg {
  readonly __brand = 'ServiceWithInjectAndOptionalArg' as const;
  constructor(
    private inject: InjectFn,
    public other?: string
  ) {
    void this.inject;
  }
}

export class ServiceNoArgs {
  readonly __brand = 'ServiceNoArgs' as const;
  constructor() {}
}

export class Service2NoArgs {
  readonly __brand = 'Service2NoArgs' as const;
  constructor() {}
}

export class ServiceWithArgs {
  readonly __brand = 'ServiceWithArgs' as const;
  constructor(
    public arg1: string,
    public arg2: number
  ) {}
}

export class ServiceWithOptionalArgs {
  readonly __brand = 'ServiceWithOptionalArgs' as const;
  constructor(
    public arg1?: string,
    public arg2?: number
  ) {}
}

// Shared test tokens
export const SERVICE = new Token<Service>('service');
export const SERVICE_NO_ARGS = new Token<ServiceNoArgs>('service-no-args');
export const SERVICE2_NO_ARGS = new Token<Service2NoArgs>('service2-no-args');
export const SERVICE_WITH_INJECT = new Token<ServiceWithInject>('service-inject');
export const SERVICE_WITH_ARGS = new Token<ServiceWithArgs>('service-args');
export const STRING = new Token<string>('test');
export const NUMBER = new Token<number>('number');
