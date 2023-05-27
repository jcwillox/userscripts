import { useSelector } from "@/lib";

export interface WaitElementOptions {
  root?: Element;
  timeout?: number;
}

export function useWaitElement<T extends Element = Element>(
  selector: string,
  options: WaitElementOptions = {}
): Promise<T> {
  return new Promise((resolve, reject) => {
    //! check if element already exists
    const el = document.querySelector<T>(selector);
    if (el) return resolve(el);

    //! wait for element to be added
    const observer = useSelector<T>(
      selector,
      (element) => {
        observer.disconnect();
        resolve(element);
      },
      { root: options.root }
    );

    if (options.timeout === undefined || options.timeout > 0) {
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Timeout waiting for element: '${selector}'`));
      }, options.timeout || 5000);
    }
  });
}
