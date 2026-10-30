import assert from 'node:assert/strict';

type TestFn = (title: string, fn: () => void | Promise<void>) => void;
type HookFn = (fn: () => void | Promise<void>) => void;

const g = globalThis as unknown as Record<string, unknown>;
const hasGlobalDescribe = typeof g.describe === 'function';

const nodeTest = hasGlobalDescribe
  ? null
  : (require('node:test') as typeof import('node:test'));

export const describe = (hasGlobalDescribe ? g.describe : nodeTest!.describe) as (title: string, fn: () => void) => void;
export const it = (hasGlobalDescribe ? g.it : nodeTest!.it) as TestFn;
export const test = (hasGlobalDescribe ? (g.test ?? g.it) : (nodeTest!.test ?? nodeTest!.it)) as TestFn;
export const beforeEach = (hasGlobalDescribe ? g.beforeEach : nodeTest!.beforeEach) as HookFn;
export const afterEach = (hasGlobalDescribe ? g.afterEach : nodeTest!.afterEach) as HookFn;

interface Expectation<T> {
  toBe(expected: unknown): void;
  toEqual(expected: unknown): void;
  toBeDefined(): void;
  toBeUndefined(): void;
  toBeNull(): void;
  toBeTruthy(): void;
  toBeFalsy(): void;
  toBeGreaterThan(expected: number): void;
  toBeLessThan(expected: number): void;
  toBeGreaterThanOrEqual(expected: number): void;
  toBeLessThanOrEqual(expected: number): void;
  toContain(expected: unknown): void;
  toHaveLength(expected: number): void;
  toThrow(expected?: string | RegExp | Error | (new (...args: any[]) => any)): void;
  not: Expectation<T>;
  rejects: {
    toThrow(expected?: string | RegExp | Error | (new (...args: any[]) => any)): Promise<void>;
  };
}

export function expect<T>(actual: T): Expectation<T> {
  const createExpectation = (isNot: boolean): Expectation<T> => {
    return {
      toBe(expected: unknown) {
        if (isNot) {
          assert.notStrictEqual(actual, expected);
        } else {
          assert.strictEqual(actual, expected);
        }
      },
      toEqual(expected: unknown) {
        if (isNot) {
          assert.notDeepStrictEqual(actual, expected);
        } else {
          assert.deepStrictEqual(actual, expected);
        }
      },
      toBeDefined() {
        if (isNot) {
          assert.strictEqual(actual, undefined);
        } else {
          assert.notStrictEqual(actual, undefined);
        }
      },
      toBeUndefined() {
        if (isNot) {
          assert.notStrictEqual(actual, undefined);
        } else {
          assert.strictEqual(actual, undefined);
        }
      },
      toBeNull() {
        if (isNot) {
          assert.notStrictEqual(actual, null);
        } else {
          assert.strictEqual(actual, null);
        }
      },
      toBeTruthy() {
        if (isNot) {
          assert.ok(!actual);
        } else {
          assert.ok(actual);
        }
      },
      toBeFalsy() {
        if (isNot) {
          assert.ok(actual);
        } else {
          assert.ok(!actual);
        }
      },
      toBeGreaterThan(expected: number) {
        if (isNot) {
          assert.ok((actual as unknown as number) <= expected);
        } else {
          assert.ok((actual as unknown as number) > expected);
        }
      },
      toBeLessThan(expected: number) {
        if (isNot) {
          assert.ok((actual as unknown as number) >= expected);
        } else {
          assert.ok((actual as unknown as number) < expected);
        }
      },
      toBeGreaterThanOrEqual(expected: number) {
        if (isNot) {
          assert.ok((actual as unknown as number) < expected);
        } else {
          assert.ok((actual as unknown as number) >= expected);
        }
      },
      toBeLessThanOrEqual(expected: number) {
        if (isNot) {
          assert.ok((actual as unknown as number) > expected);
        } else {
          assert.ok((actual as unknown as number) <= expected);
        }
      },
      toContain(expected: unknown) {
        if (typeof actual === 'string' && typeof expected === 'string') {
          if (isNot) {
            assert.ok(!actual.includes(expected));
          } else {
            assert.ok(actual.includes(expected));
          }
        } else if (Array.isArray(actual)) {
          if (isNot) {
            assert.ok(!actual.includes(expected));
          } else {
            assert.ok(actual.includes(expected));
          }
        } else {
          throw new Error('toContain requires string or array');
        }
      },
      toHaveLength(expected: number) {
        const len = (actual as { length?: number })?.length;
        if (isNot) {
          assert.notStrictEqual(len, expected);
        } else {
          assert.strictEqual(len, expected);
        }
      },
      toThrow(expected?: string | RegExp | Error | (new (...args: unknown[]) => Error)) {
        if (typeof actual !== 'function') {
          throw new Error('toThrow requires a function');
        }
        if (isNot) {
          assert.doesNotThrow(actual as () => unknown);
        } else {
          assert.throws(actual as () => unknown, expected as (new (...args: unknown[]) => Error));
        }
      },
      get not() {
        return createExpectation(!isNot);
      },
      rejects: {
        async toThrow(expected?: string | RegExp | Error | (new (...args: unknown[]) => Error)) {
          let threw = false;
          let thrownError: unknown;
          try {
            await (actual as unknown as Promise<unknown>);
          } catch (err) {
            threw = true;
            thrownError = err;
          }
          if (isNot) {
            assert.ok(!threw, 'Expected promise not to reject');
          } else {
            assert.ok(threw, 'Expected promise to reject');
            if (expected) {
              if (typeof expected === 'function') {
                assert.ok(thrownError instanceof expected, `Expected error to be instance of ${expected.name}`);
              } else if (typeof expected === 'string') {
                assert.ok((thrownError as Error)?.message?.includes(expected), `Expected message to include "${expected}"`);
              } else if (expected instanceof RegExp) {
                assert.ok(expected.test((thrownError as Error)?.message), `Expected message to match ${expected}`);
              }
            }
          }
        },
      },
    };
  };

  return createExpectation(false);
}

export { assert };
