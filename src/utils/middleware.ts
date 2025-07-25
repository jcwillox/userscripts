export type WithMiddleware<
  T extends (...args: Args) => R,
  Args extends unknown[] = unknown[],
  R = unknown
> = ((args: Args, next: T) => R)[];

export function createMiddleware<Args extends unknown[], R>(
  this: unknown,
  fn: (...args: Args) => R,
  ...middlewares: ((args: Args, next: (...args: Args) => R) => R)[]
): (...args: Args) => R {
  if (!middlewares.length) return fn.bind(this);
  return function (this: unknown, ...args: Args): R {
    const next = createMiddleware.bind(this)(fn, ...middlewares.slice(1));
    return middlewares[0].call(this, args, next);
  };
}
