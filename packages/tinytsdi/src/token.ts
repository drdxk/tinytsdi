/** Type-safe unique key for dependencies */
export class Token<T> {
  private readonly __brand = 'Token' as const;

  constructor(public readonly name?: string) {
    void this.__brand; // suppress unused property warning
  }

  toString(): string {
    const name = this.name || 'anonymous';
    return `Token<${name}>`;
  }

  logT(t: T): void {
    void t; // Suppress unused parameter warning
  }
}
