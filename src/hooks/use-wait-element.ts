import type { StrictlyParseSelector } from "typed-query-selector/parser";
import { UseSelectorOptions, useSelector } from "./use-selector";

export type WaitElementOptions = Pick<
  UseSelectorOptions,
  "root" | "subtree"
> & {
  timeout?: number;
};

export function useWaitElement<
  E extends Element = Element,
  S extends string = string,
  T extends StrictlyParseSelector<S, E> = StrictlyParseSelector<S, E>
>(selector: S, options: WaitElementOptions = {}): Promise<T> {
  return new Promise((resolve, reject) => {
    const observer = useSelector<T>(
      selector,
      (element) => {
        resolve(element);
      },
      { root: options.root, subtree: options.subtree, once: true }
    );

    if (options.timeout === undefined || options.timeout > 0) {
      setTimeout(() => {
        observer?.disconnect();
        reject(new Error(`Timeout waiting for element: '${selector}'`));
      }, options.timeout || 5000);
    }
  });
}
