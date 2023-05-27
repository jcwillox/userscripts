export interface UseSelectorOptions {
  root?: Element;
  event?: "added" | "removed";
}

//! watch selector for changes, fires callback every time the element is added
//! call observer.disconnect() to stop watching
export function useSelector<T extends Element = Element>(
  selector: Node | string,
  callback: (element: T) => void,
  options: UseSelectorOptions = {}
) {
  const opts: Required<UseSelectorOptions> = {
    root: options.root || document.body,
    event: options.event || "added",
  };

  if (opts.event == "added") {
    if (typeof selector == "string") {
      for (const el of document.querySelectorAll<T>(selector)) {
        callback(el);
      }
    } else {
      callback(selector as T);
    }
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      const nodes =
        opts.event == "added" ? mutation.addedNodes : mutation.removedNodes;
      const matches =
        typeof selector == "string" && opts.root.querySelectorAll<T>(selector);
      for (const node of nodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as Element;
          if (typeof selector == "string") {
            if (matches) {
              for (const match of matches) {
                if (match == el) {
                  callback(match);
                  break;
                }
              }
            }
          } else if (node == selector) {
            callback(el as T);
          }
        }
      }
    }
  });
  observer.observe(opts.root, { childList: true, subtree: true });
  return observer;
}

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
