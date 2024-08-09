/** You can use this namespace to store your models, as well as utility types */
declare namespace NgSnippets {
  namespace Utilities {
    /**
     * Advanced type that declares a function as a composable function.
     *
     * For every extension provided into your composition function, add its type to the return value of the function
     *
     * @example
     * ```typescript
     * const withNotification = () => ({ notify: (message: string): void => {} });
     * const withDialog = () => ({ dialog: (data: any): void => {} });
     * const compose = <T extends any[]>(...extensions: T): NgSnippets.Utilities.Composable<T> => null!;
     * const composed = compose(withNotification(), withDialog());
     * // Type-safe calls
     * composed.notify('OK');
     * composed.dialog({});
     * ```
     *
     */
    type Composable<T extends any[]> =
      { [I in keyof T]: (x: T[I]) => void } extends Record<`${number}`, (x: infer U) => void> ? U : never;

    /**
     * Advanced string literal type that allows to path into an object and verify that each key exists in said object
     *
     * @example
     * ```typescript
     * const x = {
     *   plainkey: 'somekey',
     *   nest: { nestedkey: 'somekey' },
     *   array: ['somekey'],
     *   nestarray: [{ nestedkey: 'somekey' }],
     * };
     *
     * function test(p: NgSnippets.Utilities.Pathable<typeof x>) {}
     *
     * test('plainkey');
     * test('nest.nestedkey');
     * test('array.0');
     * test('nestarray.0.nestedkey');
     * ```
     */
    type Pathable<T extends Record<string, any>, Delimiter extends string = '.'> = keyof {
      [K in keyof T as T[K] extends string | number
        ? K
        : T[K] extends Record<string, any>
          ? `${K & (string | number)}${Delimiter}${Pathable<T[K]>}`
          : never]: any;
    };
  }

  /** @internal internal types : when you need types from libraries, follow this syntax, because if you use an ES6 import statement, it breaks the purpose of a *.d.ts file */
  namespace Internals {
    type Observable<T> = import('rxjs').Observable<T>;
  }
}
