// watch selector for changes, fires callback every time the element is added
// call observer.disconnect() to stop watching
export function useSelector<T extends Element = Element>(
  selector: string,
  callback: (element: T) => void,
  root: Node = document.body
) {
  for (const el of document.querySelectorAll<T>(selector)) {
    callback(el);
  }
  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as Element;
          if (el.matches(selector)) {
            callback(el as T);
          }
        }
      }
    }
  });
  observer.observe(root, { childList: true, subtree: true });
  return observer;
}

export interface WaitElementOptions {
  root?: Node;
  timeout?: number;
}

export function useWaitElement<T extends Element = Element>(
  selector: string,
  options: WaitElementOptions = {}
): Promise<T> {
  return new Promise((resolve, reject) => {
    // check if element already exists
    const el = document.querySelector<T>(selector);
    if (el) return resolve(el);

    // wait for element to be added
    const observer = useSelector<T>(
      selector,
      element => {
        observer.disconnect();
        resolve(element);
      },
      options.root
    );

    if (options.timeout === undefined || options.timeout > 0) {
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Timeout waiting for element: '${selector}'`));
      }, options.timeout || 5000);
    }
  });
}
