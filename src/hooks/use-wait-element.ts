import type { StrictlyParseSelector } from "typed-query-selector/parser";
import { useSelector } from "./use-selector";

export type WaitElementOptions = {
  root?: Element | Document | null;
  timeout?: number;
};

export function useWaitElement<
  E extends Element = Element,
  S extends string = string,
  T extends StrictlyParseSelector<S, E> = StrictlyParseSelector<S, E>
>(selector: S, options: WaitElementOptions = {}): Promise<T> {
  return new Promise((resolve, reject) => {
    //! check if element already exists
    const el = document.querySelector<T>(selector);
    if (el) return resolve(el);

    //! wait for element to be added
    const observer = useSelector<T>(
      selector,
      (element) => {
        resolve(element);
      },
      { root: options.root, once: true }
    );

    if (options.timeout === undefined || options.timeout > 0) {
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Timeout waiting for element: '${selector}'`));
      }, options.timeout || 5000);
    }
  });
}
